import { callLLM } from './llmClient.js';
import { db } from '../db/database.js';

/**
 * Study Planner Agent
 * Role: Creates realistic daily and weekly study plans based on available time,
 * subjects, deadlines, and student progress.
 * 
 * Rules:
 * - Deterministic arithmetic for time slot allocation.
 * - Respects break intervals (10-15m every 45-60m).
 * - Prioritizes low-confidence subjects and approaching deadlines.
 */

export class PlannerAgent {
  constructor() {
    this.name = 'Study Planner Agent';
    this.role = 'Realistic Daily & Weekly Timetable & Study Schedule Optimization';
  }

  /**
   * Generates a deterministic, conflict-free timetable
   * @param {Object} params - { date, daysCount, dailyStudyHours, startHour, subjects, assignments, exams }
   */
  async generateSchedule(params = {}) {
    const startTime = Date.now();
    const {
      date = new Date().toISOString().split('T')[0],
      daysCount = 1, // 1 for daily plan, 7 for weekly plan
      dailyStudyHours = 4,
      startHour = 9, // 09:00 AM
      preferredBlockMinutes = 50,
      breakMinutes = 10
    } = params;

    // Fetch live student context from DB if not passed
    const subjects = params.subjects || db.prepare('SELECT * FROM subjects ORDER BY confidence_level ASC').all();
    const assignments = params.assignments || db.prepare(`
      SELECT a.*, s.name as subject_name 
      FROM assignments a 
      LEFT JOIN subjects s ON a.subject_id = s.id 
      WHERE a.status != 'completed' 
      ORDER BY a.due_date ASC
    `).all();
    const exams = params.exams || db.prepare(`
      SELECT e.*, s.name as subject_name 
      FROM exams e 
      LEFT JOIN subjects s ON e.subject_id = s.id 
      ORDER BY e.exam_date ASC
    `).all();

    // Check if LLM is available for contextual enrichment
    const systemPrompt = `You are the Study Planner Agent in StudyPilot AI.
Given a list of subjects, upcoming assignments, and exam countdowns, allocate optimal study focus descriptions.
Adhere strictly to realistic student workload and fatigue limits.`;

    const userPrompt = `Create a realistic study focus allocation for ${daysCount} day(s), ${dailyStudyHours} hours/day.
Subjects: ${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name, confidence: s.confidence_level })))}
Pending Assignments: ${JSON.stringify(assignments.map(a => ({ title: a.title, due: a.due_date, priority: a.priority })))}
Upcoming Exams: ${JSON.stringify(exams.map(e => ({ title: e.title, date: e.exam_date })))}`;

    let llmNotes = null;
    const llmResult = await callLLM({ 
      systemPrompt, 
      userPrompt, 
      temperature: 0.3,
      apiKey: params.apiKey,
      provider: params.provider
    });
    if (llmResult.success) {
      llmNotes = llmResult.content;
    }

    // Deterministic Slot Allocation Engine
    const generatedSlots = this.buildDeterministicSlots({
      startDateStr: date,
      daysCount,
      dailyStudyHours,
      startHour,
      preferredBlockMinutes,
      breakMinutes,
      subjects: subjects?.length > 0 ? subjects : [
        { id: null, name: 'Core Academic Study', color: 'indigo', confidence_level: 2 },
        { id: null, name: 'Problem Sets & Practice', color: 'purple', confidence_level: 2 },
        { id: null, name: 'Active Recall & Review', color: 'blue', confidence_level: 3 }
      ],
      assignments,
      exams
    });

    const summary = `Generated ${generatedSlots.length} schedule block(s) across ${daysCount} day(s), covering ${dailyStudyHours} hours of focused study per day with built-in rest intervals.`;

    return {
      agent: this.name,
      daysCount,
      totalHours: dailyStudyHours * daysCount,
      slots: generatedSlots,
      summary,
      notes: llmNotes,
      executionTimeMs: Date.now() - startTime
    };
  }

  buildDeterministicSlots({
    startDateStr,
    daysCount,
    dailyStudyHours,
    startHour,
    preferredBlockMinutes,
    breakMinutes,
    subjects,
    assignments,
    exams
  }) {
    const slots = [];
    const baseDate = new Date(startDateStr);

    // Prioritize workload items:
    // 1. Assignments due within next 3 days
    // 2. Exams within next 7 days (revision)
    // 3. Subjects with lowest confidence (level 1-2)
    // 4. Regular study for other subjects
    const urgentAssignments = [...assignments];
    const upcomingExams = [...exams];

    for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
      const currentDay = new Date(baseDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dayDateStr = currentDay.toISOString().split('T')[0];
      const dayOfWeek = currentDay.getDay();

      let currentMinute = startHour * 60;
      const totalMinutesAvailable = Math.round(dailyStudyHours * 60);
      let minutesAllocated = 0;

      while (minutesAllocated < totalMinutesAvailable) {
        const remainingMinutes = totalMinutesAvailable - minutesAllocated;
        const blockDuration = Math.min(preferredBlockMinutes, remainingMinutes);

        // Determine subject & task for this block
        let targetSubject = null;
        let slotTopic = 'Core Concept Study';
        let slotType = 'study';

        // Check if an urgent assignment needs attention
        if (urgentAssignments.length > 0) {
          const assign = urgentAssignments[0];
          targetSubject = subjects.find(s => s.id === assign.subject_id) || subjects[0];
          slotTopic = `Assignment: ${assign.title.substring(0, 35)}`;
          slotType = 'assignment';
          urgentAssignments.shift(); // rotate
        } else if (upcomingExams.length > 0 && dayIndex % 2 === 0) {
          const exam = upcomingExams[dayIndex % upcomingExams.length];
          targetSubject = subjects.find(s => s.id === exam.subject_id) || subjects[0];
          slotTopic = `Exam Revision: ${exam.title.substring(0, 35)}`;
          slotType = 'revision';
        } else if (subjects.length > 0) {
          // Weighted by lowest confidence first
          const subIndex = (dayIndex + Math.floor(minutesAllocated / blockDuration)) % subjects.length;
          targetSubject = subjects[subIndex];
          slotTopic = `${targetSubject.name} Deep Study`;
          slotType = 'study';
        }

        const startStr = this.minutesToTimeString(currentMinute);
        const endStr = this.minutesToTimeString(currentMinute + blockDuration);

        slots.push({
          date: dayDateStr,
          day_of_week: dayOfWeek,
          start_time: startStr,
          end_time: endStr,
          subject_id: targetSubject?.id || null,
          subject_name: targetSubject?.name || 'General Study',
          subject_color: targetSubject?.color || 'indigo',
          topic: slotTopic,
          type: slotType,
          duration_minutes: blockDuration,
          is_completed: 0
        });

        currentMinute += blockDuration;
        minutesAllocated += blockDuration;

        // Add break if not at the very end of today's study
        if (minutesAllocated < totalMinutesAvailable) {
          const breakStartStr = this.minutesToTimeString(currentMinute);
          const breakEndStr = this.minutesToTimeString(currentMinute + breakMinutes);
          
          slots.push({
            date: dayDateStr,
            day_of_week: dayOfWeek,
            start_time: breakStartStr,
            end_time: breakEndStr,
            subject_id: null,
            subject_name: 'Rest & Refresh',
            subject_color: 'slate',
            topic: 'Active Break: Stretch, hydrate, rest your eyes',
            type: 'break',
            duration_minutes: breakMinutes,
            is_completed: 0
          });

          currentMinute += breakMinutes;
        }
      }
    }

    return slots;
  }

  minutesToTimeString(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

export const plannerAgent = new PlannerAgent();
