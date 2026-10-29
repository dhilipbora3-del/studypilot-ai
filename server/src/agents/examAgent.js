import { callLLM } from './llmClient.js';
import { db } from '../db/database.js';

/**
 * Exam Agent
 * Role: Creates mock tests, evaluates answers, identifies weak topics,
 * and recommends structured revision plans.
 * 
 * Rules:
 * - Deterministic arithmetic for scoring and percentage calculations.
 * - Never invent grades or past test records.
 */

export class ExamAgent {
  constructor() {
    this.name = 'Exam Agent';
    this.role = 'Mock Tests, Answer Evaluation, Weakness Diagnostics & Revision Planning';
  }

  /**
   * Generates a mock quiz
   */
  async generateMockTest({ subjectName, topic, count = 4, difficulty = 'medium', apiKey = null, provider = null }) {
    const startTime = Date.now();
    const systemPrompt = `You are the Exam Agent in StudyPilot AI.
Create a high-quality ${count}-question multiple-choice practice test on "${topic || subjectName}".
Difficulty: ${difficulty}.
Return a STRICT JSON array of objects with keys:
- "id": number (1 to ${count})
- "question": string
- "options": array of 4 distinct string choices
- "answerIndex": number (0 to 3 index of the correct option)
- "explanation": string (thorough explanation why the correct answer is right and why others are wrong)
- "topic": string (subtopic covered)`;

    const userPrompt = `Subject: ${subjectName}. Specific Topic: ${topic || 'Key Curriculum Topics'}. Question Count: ${count}.`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      apiKey,
      provider
    });

    let questions = [];
    if (llmResult.success) {
      try {
        const parsed = JSON.parse(llmResult.content);
        questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } catch (e) {
        questions = this.getDeterministicQuestions(subjectName, topic, count);
      }
    } else {
      questions = this.getDeterministicQuestions(subjectName, topic, count);
    }

    // Fallback if parsing produced too few questions
    if (!questions || questions.length === 0) {
      questions = this.getDeterministicQuestions(subjectName, topic, count);
    }

    return {
      agent: this.name,
      subjectName,
      topic: topic || 'Comprehensive Review',
      difficulty,
      questions,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Deterministically evaluates student quiz answers
   */
  evaluateAnswers(quizQuestions, studentAnswers = {}) {
    const startTime = Date.now();
    let score = 0;
    const totalQuestions = quizQuestions.length;
    const itemAnalysis = [];
    const missedTopicsCount = {};

    for (const q of quizQuestions) {
      const selectedOptionIndex = studentAnswers[q.id];
      const isCorrect = Number(selectedOptionIndex) === Number(q.answerIndex);

      if (isCorrect) {
        score++;
      } else {
        const topicName = q.topic || 'General Concepts';
        missedTopicsCount[topicName] = (missedTopicsCount[topicName] || 0) + 1;
      }

      itemAnalysis.push({
        questionId: q.id,
        question: q.question,
        selectedOptionIndex,
        correctOptionIndex: q.answerIndex,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic || 'General'
      });
    }

    // Deterministic arithmetic
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100 * 10) / 10 : 0;
    
    // Sort weak topics by most missed
    const weakTopics = Object.entries(missedTopicsCount)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, missedQuestions: count }));

    // Formulate targeted revision feedback
    let feedback = '';
    if (percentage >= 85) {
      feedback = `Outstanding performance (${percentage}%). You have strong mastery of these concepts. Polish up remaining edge cases before exam day.`;
    } else if (percentage >= 70) {
      feedback = `Solid foundation (${percentage}%). Focus your revision on: ${weakTopics.map(w => w.topic).join(', ')}.`;
    } else {
      feedback = `Revision needed (${percentage}%). Recommend targeted review of fundamental principles in: ${weakTopics.map(w => w.topic).join(', ')}. Schedule focused study sessions on these topics.`;
    }

    return {
      agent: this.name,
      score,
      totalQuestions,
      percentage,
      itemAnalysis,
      weakTopics,
      feedback,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Builds spaced revision milestones leading up to an exam
   */
  generateRevisionMilestones(examTitle, examDateStr, topics = []) {
    const now = new Date();
    const examDate = new Date(examDateStr);
    const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return [{ dayOffset: 0, task: 'Exam day: Final review and rest', done: false }];
    }

    const milestones = [];
    if (diffDays >= 14) {
      milestones.push({ dayOffset: -14, task: 'Complete comprehensive summary notes of all curriculum units', done: false });
    }
    if (diffDays >= 7) {
      milestones.push({ dayOffset: -7, task: `Targeted problem set & flashcard review on ${topics.slice(0, 2).join(', ') || 'key topics'}`, done: false });
    }
    if (diffDays >= 3) {
      milestones.push({ dayOffset: -3, task: 'Full-length timed mock examination under realistic test conditions', done: false });
    }
    if (diffDays >= 1) {
      milestones.push({ dayOffset: -1, task: 'Formula sheet review, error-log recap, and early sleep for cognitive peak', done: false });
    }

    return milestones;
  }

  getDeterministicQuestions(subjectName = '', topic = '', count = 4) {
    const sLower = (subjectName + ' ' + topic).toLowerCase();

    if (sLower.includes('cs') || sLower.includes('algorithm') || sLower.includes('computer')) {
      const qPool = [
        {
          id: 1,
          question: 'What is the tight worst-case time complexity of standard Quicksort with naive pivot selection on an already sorted array?',
          options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)'],
          answerIndex: 3,
          explanation: 'When Quicksort picks the first or last element as pivot on an already sorted array, the partitions are maximally unbalanced (0 and n-1 elements), causing O(n^2) worst-case time.',
          topic: 'Sorting & Complexity'
        },
        {
          id: 2,
          question: 'Which data structure is fundamentally used to implement Breadth-First Search (BFS) in a graph?',
          options: ['Stack', 'Queue', 'Max-Heap', 'Red-Black Tree'],
          answerIndex: 1,
          explanation: 'BFS explores neighbor nodes level by level using a FIFO Queue to guarantee closest nodes are processed first.',
          topic: 'Graph Traversals'
        },
        {
          id: 3,
          question: 'In Dijkstra\'s algorithm with a Fibonacci heap, what is the theoretical running time on a graph with V vertices and E edges?',
          options: ['O(V^2)', 'O(E + V log V)', 'O(E log V)', 'O(V * E)'],
          answerIndex: 1,
          explanation: 'With a Fibonacci heap, decrease-key is O(1) amortized and extract-min is O(log V), yielding O(E + V log V).',
          topic: 'Shortest Path Algorithms'
        },
        {
          id: 4,
          question: 'Which of the following problems is proven to be NP-Complete?',
          options: ['Shortest Path (Single Source)', 'Minimum Spanning Tree', '0/1 Knapsack Decision Problem', 'Connected Components'],
          answerIndex: 2,
          explanation: 'The 0/1 Knapsack decision problem is NP-Complete (solvable in pseudo-polynomial time via dynamic programming).',
          topic: 'Complexity Classes'
        }
      ];
      return qPool.slice(0, count);
    }

    if (sLower.includes('math') || sLower.includes('calculus') || sLower.includes('linear algebra')) {
      const qPool = [
        {
          id: 1,
          question: 'If a 3x3 matrix has eigenvalues λ1 = 2, λ2 = 3, and λ3 = -1, what is the determinant of the matrix?',
          options: ['4', '-6', '6', '0'],
          answerIndex: 1,
          explanation: 'The determinant of a square matrix is the product of its eigenvalues: 2 * 3 * (-1) = -6.',
          topic: 'Eigenvalues & Determinants'
        },
        {
          id: 2,
          question: 'What is the derivative of f(x) = ln(3x^2 + 1) with respect to x?',
          options: ['1 / (3x^2 + 1)', '6x / (3x^2 + 1)', '6x ln(3x^2 + 1)', '3 / (6x + 1)'],
          answerIndex: 1,
          explanation: 'By the Chain Rule: d/dx [ln(u)] = (1/u) * du/dx. Here u = 3x^2 + 1, and du/dx = 6x, so f\'(x) = 6x / (3x^2 + 1).',
          topic: 'Calculus Differentiation'
        },
        {
          id: 3,
          question: 'Two vectors u and v are orthogonal if and only if:',
          options: ['Their cross product is 1', 'Their dot product is 0', 'Their magnitudes are equal', 'u = -v'],
          answerIndex: 1,
          explanation: 'By definition, u • v = ||u|| ||v|| cos(θ). When vectors are orthogonal (θ = 90°), cos(90°) = 0, so the dot product is 0.',
          topic: 'Vector Spaces'
        },
        {
          id: 4,
          question: 'Which test determines convergence for the alternating series Σ ((-1)^n / n)?',
          options: ['Ratio Test (inconclusive)', 'Leibniz Alternating Series Test', 'Integral Test', 'Direct Comparison to 1/n^2'],
          answerIndex: 1,
          explanation: 'The Leibniz Alternating Series Test shows convergence because terms alternate in sign, |a_n| is monotonically decreasing, and lim a_n = 0.',
          topic: 'Infinite Series'
        }
      ];
      return qPool.slice(0, count);
    }

    if (sLower.includes('physic') || sLower.includes('mechanic')) {
      const qPool = [
        {
          id: 1,
          question: 'In an isolated system with no external net torque, which quantity is strictly conserved?',
          options: ['Linear velocity', 'Angular momentum', 'Kinetic energy in all cases', 'Centripetal force'],
          answerIndex: 1,
          explanation: 'Since τ_net = dL/dt, if net torque is zero, dL/dt = 0, meaning angular momentum L is conserved.',
          topic: 'Rotational Dynamics'
        },
        {
          id: 2,
          question: 'A mass on a frictionless spring oscillates in Simple Harmonic Motion with spring constant k and mass m. What is its angular frequency ω?',
          options: ['√(k/m)', '√(m/k)', '2π √(k/m)', 'k / m'],
          answerIndex: 0,
          explanation: 'For a mass-spring harmonic oscillator, ω = √(k/m).',
          topic: 'Oscillations & Waves'
        },
        {
          id: 3,
          question: 'In a completely inelastic collision between two carts, which statement is true?',
          options: ['Mechanical kinetic energy is conserved', 'Momentum is conserved, but kinetic energy is not', 'Both momentum and kinetic energy are lost', 'Neither momentum nor energy is conserved'],
          answerIndex: 1,
          explanation: 'Total linear momentum is always conserved in the absence of external net forces. However, in an inelastic collision, some kinetic energy is converted to thermal energy and deformation.',
          topic: 'Conservation Laws'
        }
      ];
      return qPool.slice(0, count);
    }

    // Default question bank
    return [
      {
        id: 1,
        question: `Which cognitive practice is most effective for exam preparation in ${subjectName || 'this subject'}?`,
        options: ['Passive re-reading of slides', 'Active retrieval practice and self-testing', 'Cramming the night before', 'Highlighting entire pages'],
        answerIndex: 1,
        explanation: 'Active retrieval practice forces the brain to reconstruct memory pathways, resulting in significantly higher long-term retention under test conditions.',
        topic: 'Study Methodology'
      },
      {
        id: 2,
        question: 'When encountering a multi-part exam problem, what is the best first step?',
        options: ['Immediately start writing the final equation', 'Identify all given variables and explicitly state what is required', 'Guess the answer from multiple choice options', 'Skip directly to the next question'],
        answerIndex: 1,
        explanation: 'Deconstructing the problem into given parameters and required targets clarifies the necessary solution path and prevents careless errors.',
        topic: 'Problem Solving'
      }
    ];
  }
}

export const examAgent = new ExamAgent();
