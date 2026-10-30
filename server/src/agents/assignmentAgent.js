import { callLLM } from './llmClient.js';
import { db } from '../db/database.js';

/**
 * Assignment Agent
 * Role: Tracks assignment details, priorities, and deadlines, and guides students
 * through solving academic problems.
 */

export class AssignmentAgent {
  constructor() {
    this.name = 'Assignment Agent';
    this.role = 'Assignment Breakdown, Priority Tracking & Problem Guidance';
  }

  /**
   * Deterministically calculates priority based on deadline proximity
   */
  calculatePriority(dueDateStr) {
    if (!dueDateStr) return 'medium';
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) return 'urgent';
    if (diffDays <= 5) return 'high';
    if (diffDays <= 10) return 'medium';
    return 'low';
  }

  /**
   * Breaks an assignment down into progressive actionable subtasks
   */
  async breakdownAssignment(assignment, options = {}) {
    const startTime = Date.now();
    const systemPrompt = `You are the Assignment Agent in StudyPilot AI.
Your role is to break down a student's assignment into 3 to 5 realistic, sequential actionable milestones.
Return a STRICT JSON array of objects with keys: "id" (number), "title" (string), "completed" (boolean default false), and "hint" (brief 1-sentence tip).`;

    const userPrompt = `Assignment: "${assignment.title}"
Description: "${assignment.description || 'No description provided'}"
Estimated Time: ${assignment.estimated_minutes || 90} minutes.`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      apiKey: options.apiKey,
      provider: options.provider,
      model: options.model
    });

    let subtasks = [];
    if (llmResult.success) {
      try {
        const parsed = JSON.parse(llmResult.content);
        subtasks = Array.isArray(parsed) ? parsed : (parsed.subtasks || parsed.tasks || []);
      } catch (e) {
        subtasks = this.deterministicBreakdown(assignment);
      }
    } else {
      subtasks = this.deterministicBreakdown(assignment);
    }

    // Ensure subtask fields are normalized
    subtasks = subtasks.map((task, index) => ({
      id: index + 1,
      title: task.title || `Milestone ${index + 1}`,
      completed: Boolean(task.completed),
      hint: task.hint || 'Focus on step-by-step execution'
    }));

    return {
      agent: this.name,
      subtasks,
      calculatedPriority: this.calculatePriority(assignment.due_date),
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Provides step-by-step problem guidance
   */
  async guideProblem(problemText, context = {}) {
    const startTime = Date.now();
    const systemPrompt = `You are the Assignment Agent in StudyPilot AI.
A student needs guidance solving an assignment problem.
Guide them through the methodology step-by-step:
1. Clarify what is given and what must be found.
2. Outline the core formula, theorem, or algorithm required.
3. Walk through the reasoning structure with intermediate checkpoints.
4. Provide a verification sanity-check to make sure their final answer makes sense.
Do not simply do all the work passively; encourage student comprehension.`;

    const userPrompt = `Student Problem: "${problemText}"
Subject Context: ${context.subject || 'General'}`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      apiKey: context.apiKey,
      provider: context.provider,
      model: context.model
    });

    let guidance;
    if (llmResult.success && llmResult.content) {
      guidance = llmResult.content;
    } else {
      guidance = this.deterministicProblemGuidance(problemText);
    }

    return {
      agent: this.name,
      guidance,
      executionTimeMs: Date.now() - startTime
    };
  }

  deterministicBreakdown(assignment) {
    const title = (assignment.title || '').toLowerCase();
    
    if (title.includes('essay') || title.includes('paper') || title.includes('report')) {
      return [
        { id: 1, title: 'Outline thesis statement & main body arguments', completed: false, hint: 'Define 3 distinct supporting points' },
        { id: 2, title: 'Gather primary sources, quotes, and citations', completed: false, hint: 'Use authoritative academic references' },
        { id: 3, title: 'Draft introductory paragraph and body sections', completed: false, hint: 'Write continuously without self-editing initially' },
        { id: 4, title: 'Write conclusion tying arguments to broader context', completed: false, hint: 'Synthesize findings rather than merely repeating' },
        { id: 5, title: 'Proofread for clarity, tone, and citation formatting', completed: false, hint: 'Read out loud to spot awkward sentences' }
      ];
    }

    if (title.includes('code') || title.includes('program') || title.includes('algorithm') || title.includes('lab')) {
      return [
        { id: 1, title: 'Analyze requirements, input/output constraints & edge cases', completed: false, hint: 'Consider empty inputs and extreme values' },
        { id: 2, title: 'Sketch pseudocode and choose optimal data structures', completed: false, hint: 'Check time and space complexity targets' },
        { id: 3, title: 'Implement core functionality in small testable chunks', completed: false, hint: 'Test each function independently' },
        { id: 4, title: 'Write unit tests and run against benchmark cases', completed: false, hint: 'Verify against edge cases' },
        { id: 5, title: 'Clean up code comments, documentation and submit', completed: false, hint: 'Ensure code is well-structured and readable' }
      ];
    }

    return [
      { id: 1, title: 'Deconstruct prompt and review relevant lecture notes', completed: false, hint: 'Identify key concepts involved' },
      { id: 2, title: 'Set up equations, models, or initial draft framework', completed: false, hint: 'Write out all known variables' },
      { id: 3, title: 'Execute primary problem solving and computations', completed: false, hint: 'Double check intermediate steps' },
      { id: 4, title: 'Verify final solution against requirements and format neatly', completed: false, hint: 'Confirm all parts of the question are answered' }
    ];
  }

  deterministicProblemGuidance(problemText) {
    return `### Assignment Guidance & Problem-Solving Framework

#### Step 1: Deconstruct the Problem
- **Given information**: List every variable, constraint, and initial condition provided in the problem prompt.
- **Goal**: State explicitly what value, proof, or structure you must calculate or prove.

#### Step 2: Formulate the Strategy
- Connect the given quantities to known theorems, formulas, or algorithmic patterns.
- Check units and dimensional consistency before substituting numbers.

#### Step 3: Step-by-Step Execution
- Work through one logical transformation at a time.
- Keep intermediate values exact (e.g., fractions or symbols) as long as possible to avoid compounding rounding errors.

#### Step 4: Verification & Sanity Check
- Does the magnitude and sign of your result make physical and logical sense?
- Test boundary cases (e.g., $0$, $\\infty$, or symmetric conditions).`;
  }
}

export const assignmentAgent = new AssignmentAgent();
