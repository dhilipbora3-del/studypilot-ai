import { tutorAgent } from './tutorAgent.js';
import { plannerAgent } from './plannerAgent.js';
import { assignmentAgent } from './assignmentAgent.js';
import { examAgent } from './examAgent.js';
import { reviewAgent } from './reviewAgent.js';
import { callLLM } from './llmClient.js';
import { db } from '../db/database.js';

/**
 * Manager Agent
 * Role: Understands the student's request, delegates tasks to relevant agents,
 * passes context between them, coordinates Review Agent validation, and combines results.
 */

export class ManagerAgent {
  constructor() {
    this.name = 'Manager Agent';
    this.role = 'Task Deconstruction, Agent Orchestration & Result Synthesis';
  }

  /**
   * Main dispatch method
   * @param {string} userMessage - Raw message from student
   * @param {Object} options - Optional overrides or extra parameters
   */
  async processRequest(userMessage, options = {}) {
    const totalStart = Date.now();
    const traces = [];

    // Step 1: Manager Analysis & Intent Decomposition
    const analysisStart = Date.now();
    const studentContext = this.gatherStudentContext();
    const intentPlan = await this.analyzeIntent(userMessage, studentContext);
    
    traces.push({
      agent: this.name,
      role: this.role,
      status: 'DISPATCHED',
      action: 'Deconstructed student prompt and selected target agents',
      details: `Identified intents: [${intentPlan.targetAgents.join(', ')}]. Objective: ${intentPlan.planSummary}`,
      executionTimeMs: Date.now() - analysisStart,
      timestamp: new Date().toISOString()
    });

    const subAgentResults = {};

    // Step 2: Invoke designated agents with context
    for (const agentType of intentPlan.targetAgents) {
      if (agentType === 'tutor') {
        const res = await tutorAgent.execute(userMessage, { studentContext });
        subAgentResults.tutor = res;
        traces.push({
          agent: tutorAgent.name,
          role: tutorAgent.role,
          status: 'COMPLETED',
          action: 'Generated conceptual explanation, examples, and study notes',
          details: `Output generated using ${res.provider} in ${res.executionTimeMs}ms`,
          executionTimeMs: res.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }

      if (agentType === 'planner') {
        const days = userMessage.toLowerCase().includes('week') ? 7 : 1;
        const res = await plannerAgent.generateSchedule({
          daysCount: days,
          dailyStudyHours: options.dailyStudyHours || 4,
          subjects: studentContext.subjects,
          assignments: studentContext.assignments,
          exams: studentContext.exams
        });
        subAgentResults.planner = res;
        traces.push({
          agent: plannerAgent.name,
          role: plannerAgent.role,
          status: 'COMPLETED',
          action: 'Calculated optimal study blocks and rest intervals',
          details: `Allocated ${res.slots.length} conflict-free study and break slots across ${days} day(s)`,
          executionTimeMs: res.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }

      if (agentType === 'assignment') {
        // If query mentions breakdown or a specific assignment
        const res = await assignmentAgent.guideProblem(userMessage, {
          subject: studentContext.subjects[0]?.name
        });
        subAgentResults.assignment = res;
        traces.push({
          agent: assignmentAgent.name,
          role: assignmentAgent.role,
          status: 'COMPLETED',
          action: 'Formulated step-by-step problem-solving strategy',
          details: `Constructed pedagogical problem framework in ${res.executionTimeMs}ms`,
          executionTimeMs: res.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }

      if (agentType === 'exam') {
        const targetSubject = studentContext.subjects.find(s => 
          userMessage.toLowerCase().includes(s.name.toLowerCase()) || 
          userMessage.toLowerCase().includes(s.code?.toLowerCase())
        ) || studentContext.subjects[0];

        const res = await examAgent.generateMockTest({
          subjectName: targetSubject?.name || 'Academic Studies',
          topic: userMessage,
          count: 3
        });
        subAgentResults.exam = res;
        traces.push({
          agent: examAgent.name,
          role: examAgent.role,
          status: 'COMPLETED',
          action: 'Constructed mock exam questions with detailed explanations',
          details: `Generated ${res.questions.length} diagnostic practice questions in ${res.executionTimeMs}ms`,
          executionTimeMs: res.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 3: Review Agent Verification
    const reviewData = {
      query: userMessage,
      agentType: intentPlan.targetAgents[0] || 'tutor',
      data: {
        text: subAgentResults.tutor?.output || subAgentResults.assignment?.guidance || '',
        schedule: subAgentResults.planner?.slots,
        quiz: subAgentResults.exam?.questions,
        assignments: studentContext.assignments,
        exams: studentContext.exams
      }
    };

    const reviewResult = await reviewAgent.review(reviewData);
    traces.push({
      agent: reviewAgent.name,
      role: reviewAgent.role,
      status: reviewResult.verified ? 'VERIFIED' : 'FLAGGED_ADVISORY',
      action: 'Verified mathematical computations, timetable collisions, and deadline validity',
      details: reviewResult.summary,
      checks: reviewResult.checks,
      warnings: reviewResult.warnings,
      executionTimeMs: reviewResult.executionTimeMs,
      timestamp: new Date().toISOString()
    });

    // Step 4: Manager Agent Result Synthesis
    const synthesizedResult = this.synthesizeOutput({
      userMessage,
      intentPlan,
      subAgentResults,
      reviewResult,
      studentContext
    });

    const totalDurationMs = Date.now() - totalStart;

    return {
      message: synthesizedResult.text,
      agentTraces: traces,
      reviewSummary: reviewResult,
      structuredData: synthesizedResult.structuredData,
      totalExecutionTimeMs: totalDurationMs,
      activeAgents: [this.name, ...traces.map(t => t.agent).filter((v, i, a) => a.indexOf(v) === i && v !== this.name)]
    };
  }

  /**
   * Deterministic + LLM-assisted intent classification
   */
  async analyzeIntent(userMessage, studentContext) {
    const text = userMessage.toLowerCase();
    const agents = new Set();

    // Check keywords for planner
    if (text.includes('plan') || text.includes('schedule') || text.includes('timetable') || 
        text.includes('routine') || text.includes('calendar') || text.includes('study hours') ||
        text.includes('today') || text.includes('week')) {
      agents.add('planner');
    }

    // Check keywords for assignments
    if (text.includes('assignment') || text.includes('homework') || text.includes('lab') ||
        text.includes('deadline') || text.includes('submit') || text.includes('problem set') ||
        text.includes('break down') || text.includes('solve')) {
      agents.add('assignment');
    }

    // Check keywords for exams & quizzes
    if (text.includes('exam') || text.includes('test') || text.includes('quiz') ||
        text.includes('mock') || text.includes('practice question') || text.includes('midterm') ||
        text.includes('revision') || text.includes('score')) {
      agents.add('exam');
    }

    // Check keywords for tutoring / explanations
    if (text.includes('explain') || text.includes('what is') || text.includes('how does') ||
        text.includes('why') || text.includes('concept') || text.includes('notes') ||
        text.includes('flashcard') || text.includes('analogy') || text.includes('teach me') ||
        agents.size === 0) {
      agents.add('tutor');
    }

    const targetAgents = Array.from(agents);
    const planSummary = `Coordinating [${targetAgents.join(' & ')}] with verification by Review Agent.`;

    return {
      targetAgents,
      planSummary
    };
  }

  /**
   * Pulls live student context from database
   */
  gatherStudentContext() {
    try {
      const subjects = db.prepare('SELECT * FROM subjects ORDER BY confidence_level ASC').all();
      const assignments = db.prepare('SELECT * FROM assignments WHERE status != "completed" ORDER BY due_date ASC LIMIT 5').all();
      const exams = db.prepare('SELECT * FROM exams ORDER BY exam_date ASC LIMIT 3').all();
      return { subjects, assignments, exams };
    } catch (e) {
      return { subjects: [], assignments: [], exams: [] };
    }
  }

  /**
   * Combines all sub-agent outputs into a coherent student-facing response
   */
  synthesizeOutput({ userMessage, intentPlan, subAgentResults, reviewResult, studentContext }) {
    let text = '';
    const structuredData = {};

    if (subAgentResults.tutor) {
      text += subAgentResults.tutor.output + '\n\n';
      if (subAgentResults.tutor.flashcards?.length > 0) {
        structuredData.flashcards = subAgentResults.tutor.flashcards;
      }
      if (subAgentResults.tutor.practiceQuestion) {
        structuredData.practiceQuestion = subAgentResults.tutor.practiceQuestion;
      }
    }

    if (subAgentResults.planner) {
      text += `### 📅 Study Plan Generated by Study Planner Agent\n${subAgentResults.planner.summary}\n\n`;
      if (subAgentResults.planner.notes) {
        text += `${subAgentResults.planner.notes}\n\n`;
      }
      structuredData.scheduleSlots = subAgentResults.planner.slots;
    }

    if (subAgentResults.assignment) {
      text += subAgentResults.assignment.guidance + '\n\n';
      if (subAgentResults.assignment.subtasks) {
        structuredData.assignmentSubtasks = subAgentResults.assignment.subtasks;
      }
    }

    if (subAgentResults.exam) {
      text += `### 📝 Diagnostic Mock Test Prepared by Exam Agent\nTopic: **${subAgentResults.exam.topic}** (${subAgentResults.exam.questions.length} questions)\n\n`;
      structuredData.quizQuestions = subAgentResults.exam.questions;
    }

    // Add Review Agent Verification Stamp
    text += `---\n`;
    if (reviewResult.verified) {
      text += `🛡️ **Review Agent Stamp: Verified** — All mathematical computations, schedule timeblocks, and deadline sequences checked and approved.`;
    } else {
      text += `⚠️ **Review Agent Notice:** ${reviewResult.warnings.join(' ')}`;
    }

    return { text: text.trim(), structuredData };
  }
}

export const managerAgent = new ManagerAgent();
