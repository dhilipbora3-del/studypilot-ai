import { tutorAgent } from './tutorAgent.js';
import { plannerAgent } from './plannerAgent.js';
import { assignmentAgent } from './assignmentAgent.js';
import { examAgent } from './examAgent.js';
import { reviewAgent } from './reviewAgent.js';
import { callLLM } from './llmClient.js';
import { db } from '../db/database.js';

/**
 * Manager Agent (High-Intelligence Orchestrator)
 * Role: Understands student requests, plans agent workflows, coordinates execution,
 * verifies results via Review Agent, and synthesizes multi-agent responses.
 */

export class ManagerAgent {
  constructor() {
    this.name = 'Manager Agent';
    this.role = 'Task Deconstruction, Agent Orchestration & Result Synthesis';
  }

  async processRequest(userMessage, options = {}) {
    const totalStart = Date.now();
    const traces = [];
    const userId = options.userId || 1;
    const apiKey = options.apiKey || null;
    const provider = options.provider || null;
    const model = options.model || null;

    // Step 1: Manager Analysis & Intent Decomposition
    const analysisStart = Date.now();
    const studentContext = this.gatherStudentContext(userId);
    const intentPlan = await this.analyzeIntent(userMessage, studentContext, options.selectedAgent);
    
    traces.push({
      agent: this.name,
      role: this.role,
      status: 'DISPATCHED',
      action: `Deconstructed prompt and delegated to: [${intentPlan.targetAgents.join(', ')}]`,
      details: `Plan: ${intentPlan.planSummary}`,
      executionTimeMs: Date.now() - analysisStart,
      timestamp: new Date().toISOString()
    });

    const subAgentResults = {};

    // Step 2: Invoke designated agents with user context & optional API key
    for (const agentType of intentPlan.targetAgents) {
      if (agentType === 'tutor') {
        const res = await tutorAgent.execute(userMessage, { studentContext, apiKey, provider, model });
        subAgentResults.tutor = res;
        traces.push({
          agent: tutorAgent.name,
          role: tutorAgent.role,
          status: 'COMPLETED',
          action: 'Formulated intuitive conceptual breakdown and worked examples',
          details: `Generated using ${res.provider} in ${res.executionTimeMs}ms`,
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
          exams: studentContext.exams,
          apiKey,
          provider,
          model
        });
        subAgentResults.planner = res;
        traces.push({
          agent: plannerAgent.name,
          role: plannerAgent.role,
          status: 'COMPLETED',
          action: 'Computed optimal study blocks and rest intervals',
          details: `Allocated ${res.slots.length} conflict-free study and break slots across ${days} day(s)`,
          executionTimeMs: res.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      }

      if (agentType === 'assignment') {
        const res = await assignmentAgent.guideProblem(userMessage, {
          subject: studentContext.subjects[0]?.name,
          apiKey,
          provider,
          model
        });
        subAgentResults.assignment = res;
        traces.push({
          agent: assignmentAgent.name,
          role: assignmentAgent.role,
          status: 'COMPLETED',
          action: 'Constructed step-by-step problem-solving strategy',
          details: `Pedagogical breakdown completed in ${res.executionTimeMs}ms`,
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
          count: 3,
          apiKey,
          provider,
          model
        });
        subAgentResults.exam = res;
        traces.push({
          agent: examAgent.name,
          role: examAgent.role,
          status: 'COMPLETED',
          action: 'Constructed mock exam questions with explanations',
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
      action: 'Audited computations, timeline integrity, and schedule collisions',
      details: reviewResult.summary,
      checks: reviewResult.checks,
      warnings: reviewResult.warnings,
      executionTimeMs: reviewResult.executionTimeMs,
      timestamp: new Date().toISOString()
    });

    // Step 4: Synthesize Output
    const synthesizedResult = await this.synthesizeOutput({
      userMessage,
      intentPlan,
      subAgentResults,
      reviewResult,
      studentContext,
      apiKey,
      provider
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

  async analyzeIntent(userMessage, studentContext, explicitAgent = null) {
    if (explicitAgent && explicitAgent !== 'auto') {
      return {
        targetAgents: [explicitAgent],
        planSummary: `Direct routing to specialist: ${explicitAgent} Agent`
      };
    }

    const text = userMessage.toLowerCase();
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(text);
    const hasAnyWord = (...words) => words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(text));
    const agents = new Set();

    // Study Planner triggers (word-bounded to avoid matching "explanation")
    if (hasAnyWord('plan', 'plans', 'planner', 'schedule', 'schedules', 'timetable', 'routine', 'calendar', 'study hours') ||
        text.includes('time management') || text.includes('organize my day') || text.includes('when should i study') ||
        (hasWord('today') && hasAnyWord('study', 'do')) || (hasWord('week') && hasAnyWord('study', 'routine'))) {
      agents.add('planner');
    }

    // Assignment Solver triggers (word-bounded to avoid matching "elaborate")
    if (hasAnyWord('assignment', 'assignments', 'homework', 'lab', 'labs', 'deadline', 'deadlines', 'problem set') ||
        text.includes('break down') || text.includes('solve problem') || (hasWord('submit') && hasWord('task'))) {
      agents.add('assignment');
    }

    // Exam Specialist triggers
    if (hasAnyWord('exam', 'exams', 'test', 'tests', 'quiz', 'quizzes', 'mock', 'midterm', 'midterms') ||
        text.includes('practice question') || text.includes('assess me') || hasWord('revision')) {
      agents.add('exam');
    }

    // AI Tutor triggers
    if (hasAnyWord('explain', 'explanation', 'concept', 'notes', 'flashcard', 'flashcards', 'analogy', 'teach', 'understand', 'loop', 'loops') ||
        text.includes('what is') || text.includes('what are') || text.includes('how does') ||
        text.includes('how do') || text.includes('difference between') || hasWord('why') ||
        agents.size === 0) {
      agents.add('tutor');
    }

    const targetAgents = Array.from(agents);
    const planSummary = `Coordinated multi-agent workflow: [${targetAgents.map(a => a.toUpperCase()).join(' + ')}] with Review Agent audit.`;

    return {
      targetAgents,
      planSummary
    };
  }

  gatherStudentContext(userId = 1) {
    try {
      const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY confidence_level ASC').all(userId);
      const assignments = db.prepare('SELECT * FROM assignments WHERE user_id = ? AND status != "completed" ORDER BY due_date ASC LIMIT 5').all(userId);
      const exams = db.prepare('SELECT * FROM exams WHERE user_id = ? ORDER BY exam_date ASC LIMIT 3').all(userId);
      return { subjects, assignments, exams };
    } catch (e) {
      return { subjects: [], assignments: [], exams: [] };
    }
  }

  async synthesizeOutput({ userMessage, intentPlan, subAgentResults, reviewResult, studentContext, apiKey, provider }) {
    let text = '';
    const structuredData = {};

    // Collect structured data from each agent
    if (subAgentResults.tutor?.flashcards?.length > 0) {
      structuredData.flashcards = subAgentResults.tutor.flashcards;
    }
    if (subAgentResults.tutor?.practiceQuestion) {
      structuredData.practiceQuestion = subAgentResults.tutor.practiceQuestion;
    }
    if (subAgentResults.planner?.slots?.length > 0) {
      structuredData.scheduleSlots = subAgentResults.planner.slots;
    }
    if (subAgentResults.assignment?.subtasks?.length > 0) {
      structuredData.assignmentSubtasks = subAgentResults.assignment.subtasks;
    }
    if (subAgentResults.exam?.questions?.length > 0) {
      structuredData.quizQuestions = subAgentResults.exam.questions;
    }

    // Single agent response formatting
    if (intentPlan.targetAgents.length === 1) {
      const single = intentPlan.targetAgents[0];
      if (single === 'tutor' && subAgentResults.tutor) {
        text = subAgentResults.tutor.output;
      } else if (single === 'planner' && subAgentResults.planner) {
        text = `### 📅 Timetable & Schedule Strategy\n${subAgentResults.planner.summary}\n\n${subAgentResults.planner.notes || ''}`;
      } else if (single === 'assignment' && subAgentResults.assignment) {
        text = subAgentResults.assignment.guidance;
      } else if (single === 'exam' && subAgentResults.exam) {
        text = `### 📝 Diagnostic Mock Test: ${subAgentResults.exam.topic}\nPrepared ${subAgentResults.exam.questions.length} diagnostic practice questions below.`;
      }
    } else {
      // Multi-agent collaborative synthesis
      text = `### 🎓 StudyPilot Multi-Agent Synthesis\n*Synchronized output from ${intentPlan.targetAgents.length} specialized agents:*\n\n`;

      if (subAgentResults.tutor) {
        text += `#### 💡 Conceptual Mastery (AI Tutor)\n${subAgentResults.tutor.output}\n\n`;
      }

      if (subAgentResults.planner) {
        text += `#### 📅 Optimal Study Schedule (Study Planner)\n${subAgentResults.planner.summary}\n`;
        if (subAgentResults.planner.notes) {
          text += `${subAgentResults.planner.notes}\n\n`;
        } else {
          text += `\n`;
        }
      }

      if (subAgentResults.assignment) {
        text += `#### 📋 Actionable Problem Solving (Assignment Solver)\n${subAgentResults.assignment.guidance}\n\n`;
      }

      if (subAgentResults.exam) {
        text += `#### 🎯 Knowledge Verification (Exam Specialist)\nDiagnostic test generated with ${subAgentResults.exam.questions.length} active retrieval question(s).\n\n`;
      }
    }

    // Add Review Agent Audit stamp
    text += `\n---\n`;
    if (reviewResult.verified) {
      text += `🛡️ **Review Agent Verified** — Arithmetic calculations, schedule conflict absence, and date validity verified.`;
    } else {
      text += `⚠️ **Review Agent Notice:** ${reviewResult.warnings.join(' ')}`;
    }

    return { text: text.trim(), structuredData };
  }
}

export const managerAgent = new ManagerAgent();
