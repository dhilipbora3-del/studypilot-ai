import { callLLM } from './llmClient.js';

/**
 * AI Tutor Agent
 * Role: Explains topics in simple language, generates notes, examples, flashcards,
 * and practice questions.
 */

export class TutorAgent {
  constructor() {
    this.name = 'AI Tutor Agent';
    this.role = 'Concept Explanations, Notes, Examples & Flashcards';
  }

  async execute(studentQuery, context = {}) {
    const startTime = Date.now();
    const systemPrompt = `You are the AI Tutor Agent in StudyPilot AI.
Your mission is to help students understand complex academic concepts intuitively and deeply.
Follow these guidelines:
1. Explain topics in simple, engaging, student-friendly language using real-world analogies.
2. Provide concrete, worked examples with step-by-step reasoning.
3. Highlight key formulas, definitions, and common misconceptions.
4. When relevant, format 1-2 flashcards (Front/Back) and a quick conceptual practice question.
5. Keep explanations structured with markdown headers, bullet points, and code/math blocks if needed.`;

    const userPrompt = `Topic or Question: "${studentQuery}"
Student Context: ${JSON.stringify(context.subjectContext || {})}
Please provide a comprehensive explanation, practical example, key takeaway notes, and a flashcard.`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.4
    });

    let explanation;
    let flashcards = [];
    let practiceQuestion = null;
    let provider = llmResult.provider;

    if (llmResult.success && llmResult.content) {
      explanation = llmResult.content;
      // Extract flashcards if present in text
      flashcards = this.extractFlashcardsFromText(explanation, studentQuery);
    } else {
      // Deterministic expert tutor engine
      const deterministicResponse = this.generateDeterministicTutorResponse(studentQuery, context);
      explanation = deterministicResponse.explanation;
      flashcards = deterministicResponse.flashcards;
      practiceQuestion = deterministicResponse.practiceQuestion;
      provider = 'deterministic_tutor_engine';
    }

    return {
      agent: this.name,
      provider,
      output: explanation,
      flashcards,
      practiceQuestion,
      executionTimeMs: Date.now() - startTime
    };
  }

  async generateFlashcards(topic, count = 3, context = {}) {
    const startTime = Date.now();
    const systemPrompt = `You are the AI Tutor Agent. Generate ${count} high-yield, active-recall study flashcards on the topic.
Return STRICT JSON array of objects with keys: "front" (concise question/concept prompt), "back" (clear, accurate, punchy explanation/answer), and "topic".`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt: `Topic: ${topic}. Subject: ${context.subject || 'General Studies'}. Count: ${count}`,
      responseFormat: 'json'
    });

    let cards = [];
    if (llmResult.success) {
      try {
        const parsed = JSON.parse(llmResult.content);
        cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || []);
      } catch (e) {
        cards = this.fallbackFlashcards(topic);
      }
    } else {
      cards = this.fallbackFlashcards(topic);
    }

    return {
      agent: this.name,
      cards,
      executionTimeMs: Date.now() - startTime
    };
  }

  generateDeterministicTutorResponse(query, context) {
    const qLower = query.toLowerCase();

    if (qLower.includes('eigen') || qLower.includes('matrix') || qLower.includes('linear algebra')) {
      return {
        explanation: `### Understanding Eigenvalues and Eigenvectors

**Real-World Analogy:**
Imagine stretching a piece of rubber sheet in one direction. Most lines drawn on the sheet tilt and rotate as it stretches. But there are special directions where vectors only get **longer or shorter** without changing their direction at all! Those special directions are **eigenvectors**, and the factor by which they stretch is the **eigenvalue** ($\lambda$).

#### 1. Core Equation
$$\\mathbf{A}\\mathbf{v} = \\lambda \\mathbf{v}$$
Where:
- $\\mathbf{A}$ is an $n \\times n$ square transformation matrix.
- $\\mathbf{v}$ is the non-zero eigenvector.
- $\\lambda$ is the scalar eigenvalue.

#### 2. Step-by-Step Method to Find Eigenvalues
1. Rewrite the equation: $(\\mathbf{A} - \\lambda \\mathbf{I})\\mathbf{v} = \\mathbf{0}$.
2. Since $\\mathbf{v} \\neq \\mathbf{0}$, the matrix $(\\mathbf{A} - \\lambda \\mathbf{I})$ must be non-invertible, meaning its determinant must equal zero:
   $$\\det(\\mathbf{A} - \\lambda \\mathbf{I}) = 0$$
   *(This is the Characteristic Polynomial)*.
3. Solve the polynomial for $\\lambda$.
4. For each $\\lambda$, substitute back into $(\\mathbf{A} - \\lambda \\mathbf{I})\\mathbf{v} = \\mathbf{0}$ to find the corresponding eigenvector space via Gaussian elimination.

#### 3. Key Properties to Double Check
- **Sum of eigenvalues** equals the **Trace** of matrix $\\mathbf{A}$: $\\sum \\lambda_i = \\text{tr}(\\mathbf{A})$.
- **Product of eigenvalues** equals the **Determinant** of matrix $\\mathbf{A}$: $\\prod \\lambda_i = \\det(\\mathbf{A})$.`,
        flashcards: [
          {
            front: 'What does det(A - λI) = 0 compute in linear algebra?',
            back: 'The characteristic polynomial, whose roots are the eigenvalues (λ) of matrix A.',
            topic: 'Linear Algebra'
          },
          {
            front: 'What is the relationship between the trace of a matrix and its eigenvalues?',
            back: 'The trace of a matrix (sum of main diagonal elements) equals the sum of its eigenvalues: tr(A) = Σ λ_i.',
            topic: 'Linear Algebra'
          }
        ],
        practiceQuestion: {
          question: 'If a 2x2 matrix has trace = 7 and determinant = 10, what are its eigenvalues?',
          options: ['λ = 2 and λ = 5', 'λ = 3 and λ = 4', 'λ = 1 and λ = 10', 'λ = -2 and λ = -5'],
          answerIndex: 0,
          explanation: 'Sum = 2 + 5 = 7 (matches trace) and Product = 2 * 5 = 10 (matches determinant).'
        }
      };
    }

    if (qLower.includes('dynamic programming') || qLower.includes('dp') || qLower.includes('memoiz')) {
      return {
        explanation: `### Dynamic Programming (DP) Explained Simply

**Core Philosophy:** *"Remember your past so you do not repeat your mistakes."*

Dynamic Programming is an optimization technique applied to problems that exhibit two essential properties:
1. **Optimal Substructure**: The optimal solution of the overall problem contains the optimal solutions of smaller subproblems.
2. **Overlapping Subproblems**: The same subproblems are computed again and again during a naive recursive tree.

#### Top-Down vs Bottom-Up
| Approach | Concept | Implementation |
|---|---|---|
| **Top-Down (Memoization)** | Start with original problem, recurse downwards, cache intermediate answers in a hash map / array. | Recursive with cache check |
| **Bottom-Up (Tabulation)** | Solve the smallest base subproblems first, iteratively filling a table until the final answer is reached. | Iterative loops |

#### The 4-Step DP Framework
1. **Define State**: What parameters uniquely identify a subproblem? (e.g. \`dp[i][w]\` = max value using first $i$ items with weight limit $w$).
2. **Identify Recurrence Relation**: How does the current state relate to previous states?
3. **Establish Base Cases**: What are the trivial conditions? (e.g. \`dp[0] = 0\`).
4. **Determine Evaluation Order**: Ensure prerequisites are computed before the current cell is accessed.`,
        flashcards: [
          {
            front: 'What two properties must a problem have to be solvable using Dynamic Programming?',
            back: '1. Optimal Substructure (optimal solution built from optimal subproblems)\n2. Overlapping Subproblems (subproblems recur repeatedly)',
            topic: 'Algorithms'
          },
          {
            front: 'What is the primary difference between Memoization and Tabulation?',
            back: 'Memoization is Top-Down recursion with caching; Tabulation is Bottom-Up iterative table building.',
            topic: 'Algorithms'
          }
        ],
        practiceQuestion: {
          question: 'In the classic 0/1 Knapsack problem, what does "0/1" signify?',
          options: ['Binary search is used', 'Each item can either be taken completely or left behind', 'Items can be divided into fractional amounts', 'The runtime complexity is O(1)'],
          answerIndex: 1,
          explanation: '0/1 means an item is either included (1) or excluded (0); it cannot be subdivided fractionally.'
        }
      };
    }

    if (qLower.includes('torque') || qLower.includes('physics') || qLower.includes('rotat')) {
      return {
        explanation: `### Rotational Dynamics: Torque & Angular Momentum

**Real-World Analogy:**
When you try to push open a heavy door, pushing near the hinge is almost impossible. Pushing at the outer edge (far from the hinge) makes it easy! That rotational twisting force is **Torque**.

#### 1. Torque Formula
$$\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F} = r F \\sin(\\theta)$$
- $\\tau$: Torque (measured in $\\text{N}\\cdot\\text{m}$)
- $r$: Lever arm distance from pivot to point of applied force
- $F$: Magnitude of applied force
- $\\theta$: Angle between force vector and position vector

#### 2. Newton's 2nd Law for Rotation
Just as $F = ma$ for linear motion, for rotational motion:
$$\\tau = I \\alpha$$
- $I$: Moment of Inertia (rotational mass distribution)
- $\\alpha$: Angular acceleration ($d^2\\theta/dt^2$)

#### 3. Conservation of Angular Momentum ($L = I \\omega$)
If no external net torque acts on a system ($\\sum \\tau = 0$), total angular momentum is strictly conserved:
$$I_1 \\omega_1 = I_2 \\omega_2$$
*(This explains why figure skaters spin faster when pulling their arms inward!)*`,
        flashcards: [
          {
            front: 'What is the rotational analog of Newton\'s Second Law (F = ma)?',
            back: 'τ = I * α (Torque = Moment of Inertia * Angular Acceleration).',
            topic: 'Physics'
          },
          {
            front: 'Why does an ice skater spin faster when pulling their arms inward?',
            back: 'Pulling arms in decreases Moment of Inertia (I). Because angular momentum (L = I * ω) is conserved, angular velocity (ω) must increase.',
            topic: 'Physics'
          }
        ],
        practiceQuestion: {
          question: 'If you double the lever arm distance r from the pivot while applying the same perpendicular force F, what happens to torque?',
          options: ['Torque is halved', 'Torque stays the same', 'Torque doubles', 'Torque quadruples'],
          answerIndex: 2,
          explanation: 'Torque τ = r * F. With perpendicular force (sin 90° = 1), torque scales directly linearly with r. Doubling r doubles torque.'
        }
      };
    }

    // General fallback topic explanation
    return {
      explanation: `### StudyPilot Guide: ${query}

#### Conceptual Overview
When approaching **${query}**, the key is breaking down the subject into its core principles and operational mechanisms.

1. **Fundamental Definition**: Formulate a clear mental model. Identify what inputs enter the system, what transformations occur, and what outcomes are produced.
2. **Key Relationships**: Examine how this concept interacts with adjacent topics in your curriculum.
3. **Common Pitfalls**: Pay careful attention to boundary conditions, units of measurement, and sign conventions.
4. **Active Practice**: Rather than re-reading notes passively, test yourself on active recall and apply the ideas to unworked problems.`,
      flashcards: [
        {
          front: `Define the primary objective of: ${query}`,
          back: `The core objective is mastering the foundational principles, recognizing practical applications, and solving problems accurately.`,
          topic: 'General Topic Review'
        }
      ],
      practiceQuestion: {
        question: `Which study technique is scientifically proven to provide the highest long-term retention for ${query}?`,
        options: ['Passive re-reading of textbooks', 'Spaced retrieval practice & active recall', 'Highlighting entire lecture slides', 'Cramming the night before an exam'],
        answerIndex: 1,
        explanation: 'Cognitive science demonstrates that active retrieval practice spaced across intervals produces significantly higher retention and deeper conceptual mastery.'
      }
    };
  }

  fallbackFlashcards(topic) {
    return [
      {
        front: `What is the core principle behind ${topic}?`,
        back: `It establishes the fundamental theoretical framework and practical rules required to analyze and solve problems in this domain.`,
        topic: topic
      },
      {
        front: `What is a common pitfall or misconception when studying ${topic}?`,
        back: `Overlooking base assumptions, mixing up units, or attempting memorization without understanding underlying mechanics.`,
        topic: topic
      },
      {
        front: `How can you test your practical mastery of ${topic}?`,
        back: `By solving unguided practice problems and explaining the solution step-by-step to someone else without consulting notes.`,
        topic: topic
      }
    ];
  }

  extractFlashcardsFromText(text, fallbackTopic) {
    const cards = [];
    const qMatch = text.match(/(?:Flashcard|Q&A|Question):\s*(.+?)\s*(?:Answer|Back):\s*(.+?)(?=\n\n|$)/gi);
    if (qMatch) {
      for (const item of qMatch) {
        const parts = item.split(/(?:Answer|Back):\s*/i);
        if (parts.length >= 2) {
          const front = parts[0].replace(/(?:Flashcard|Q&A|Question):\s*/i, '').trim();
          const back = parts[1].trim();
          if (front && back) {
            cards.push({ front, back, topic: fallbackTopic });
          }
        }
      }
    }
    return cards;
  }
}

export const tutorAgent = new TutorAgent();
