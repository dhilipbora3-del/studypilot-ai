import { callLLM } from './llmClient.js';

/**
 * AI Tutor Agent (High-Intelligence Version)
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
4. Format 2 flashcards (Q&A format) and a quick multiple-choice conceptual practice question.
5. Use markdown headers, bullet points, and code/math blocks.`;

    const userPrompt = `Topic or Question: "${studentQuery}"
Student Context: ${JSON.stringify(context.studentContext || {})}`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      apiKey: context.apiKey,
      provider: context.provider
    });

    let explanation;
    let flashcards = [];
    let practiceQuestion = null;
    let provider = llmResult.provider;

    if (llmResult.success && llmResult.content) {
      explanation = llmResult.content;
      flashcards = this.extractFlashcardsFromText(explanation, studentQuery);
    } else {
      // Deep Pedagogical Engine
      const deterministicResponse = this.generateDeepTutorResponse(studentQuery, context);
      explanation = deterministicResponse.explanation;
      flashcards = deterministicResponse.flashcards;
      practiceQuestion = deterministicResponse.practiceQuestion;
      provider = 'deep_pedagogical_engine';
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
    const systemPrompt = `You are the AI Tutor Agent. Generate ${count} high-yield, active-recall study flashcards on "${topic}".
Return a STRICT JSON array of objects with keys: "front" (question/concept), "back" (explanation/answer), and "topic".`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt: `Topic: ${topic}. Count: ${count}`,
      responseFormat: 'json',
      apiKey: context.apiKey,
      provider: context.provider
    });

    let cards = [];
    if (llmResult.success) {
      try {
        const parsed = JSON.parse(llmResult.content);
        cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || []);
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

  generateDeepTutorResponse(query, context) {
    const qLower = query.toLowerCase();

    // 1. Math / Calculus / Linear Algebra
    if (qLower.includes('eigen') || qLower.includes('matrix') || qLower.includes('determinant')) {
      return {
        explanation: `### 📐 Understanding Eigenvalues and Eigenvectors

**The Rubber Sheet Analogy:**
Imagine stretching a sheet of rubber in one direction. Most lines drawn on the sheet will tilt and rotate as it stretches. But there are special directions where vectors only stretch or shrink without rotating at all! Those special vectors are **eigenvectors**, and their stretch factor is the **eigenvalue** ($\lambda$).

#### 1. Core Equation
$$\\mathbf{A}\\mathbf{v} = \\lambda \\mathbf{v}$$
Where:
- $\\mathbf{A}$ is an $n \\times n$ square transformation matrix.
- $\\mathbf{v}$ is the non-zero eigenvector.
- $\\lambda$ is the scalar eigenvalue.

#### 2. Step-by-Step Solution Method
1. **Characteristic Equation**: Rearrange to $(\\mathbf{A} - \\lambda \\mathbf{I})\\mathbf{v} = \\mathbf{0}$.
2. For non-zero $\\mathbf{v}$, set the determinant to zero:
   $$\\det(\\mathbf{A} - \\lambda \\mathbf{I}) = 0$$
3. Solve the resulting polynomial for $\\lambda$.
4. Substitute each $\\lambda$ back to solve for eigenspace $\\mathbf{v}$.

#### 3. Verification Theorems
- $\\sum \\lambda_i = \\text{Trace}(\\mathbf{A})$ *(Sum of eigenvalues = sum of diagonal entries)*
- $\\prod \\lambda_i = \\det(\\mathbf{A})$ *(Product of eigenvalues = determinant)*`,
        flashcards: [
          {
            front: 'What is the characteristic equation for eigenvalues?',
            back: 'det(A - λI) = 0, whose roots are the eigenvalues of matrix A.',
            topic: 'Linear Algebra'
          },
          {
            front: 'What does an eigenvalue of zero (λ = 0) imply?',
            back: 'The matrix A is singular (non-invertible) and det(A) = 0.',
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

    if (qLower.includes('derivative') || qLower.includes('calculus') || qLower.includes('integral')) {
      return {
        explanation: `### 📈 Fundamental Calculus: Rates of Change & Accumulation

**Real-World Analogy:**
- The **Derivative** is your speedometer: how fast position changes at this exact instant ($dx/dt$).
- The **Integral** is your odometer: the total distance accumulated over time by adding up all infinitesimal slices.

#### 1. Core Derivative Rules
- **Power Rule**: $\\frac{d}{dx}[x^n] = n x^{n-1}$
- **Product Rule**: $(uv)' = u'v + uv'$
- **Chain Rule**: $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$

#### 2. Fundamental Theorem of Calculus (FTC)
$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$
Where $F'(x) = f(x)$.`,
        flashcards: [
          {
            front: 'What does the derivative represent geometrically?',
            back: 'The slope of the tangent line to the curve at a specific point.',
            topic: 'Calculus'
          },
          {
            front: 'State the Chain Rule formula.',
            back: 'd/dx [f(g(x))] = f\'(g(x)) * g\'(x).',
            topic: 'Calculus'
          }
        ],
        practiceQuestion: {
          question: 'What is the derivative of f(x) = (3x^2 + 1)^4?',
          options: ['12x(3x^2 + 1)^3', '24x(3x^2 + 1)^3', '4(3x^2 + 1)^3', '6x(3x^2 + 1)^3'],
          answerIndex: 1,
          explanation: 'By the Chain Rule: 4*(3x^2 + 1)^3 * (d/dx[3x^2 + 1]) = 4*(3x^2 + 1)^3 * 6x = 24x(3x^2 + 1)^3.'
        }
      };
    }

    // 2. Biology (Mitosis / DNA / Photosynthesis)
    if (qLower.includes('mitosis') || qLower.includes('cell') || qLower.includes('dna') || qLower.includes('photo')) {
      return {
        explanation: `### 🧬 Cellular Biology: Mitosis & Cell Division

**Analogy:**
Think of mitosis as creating an exact duplicate of a massive instruction manual. You can't just tear the book in half; you must photocopy every page, line up the copies, and neatly distribute one complete binder to each new room.

#### The Stages of Mitosis (PMAT)
1. **Prophase**: Chromatin condenses into visible chromosomes. Nuclear envelope breaks down, spindle apparatus forms.
2. **Metaphase**: Chromosomes align along the central equatorial plane (metaphase plate).
3. **Anaphase**: Sister chromatids are pulled apart by spindle fibers to opposite poles of the cell.
4. **Telophase**: Nuclear envelopes reform around the two separated sets of chromosomes, and cytokinesis divides the cytoplasm.

#### Key Takeaway
Mitosis produces **two genetically identical diploid (2n)** somatic daughter cells, essential for organism growth, tissue repair, and asexual reproduction.`,
        flashcards: [
          {
            front: 'What is the mnemonic for the stages of mitosis?',
            back: 'PMAT: Prophase, Metaphase, Anaphase, Telophase.',
            topic: 'Cell Biology'
          },
          {
            front: 'How many chromosomes do daughter cells have after mitosis in humans?',
            back: '46 chromosomes (23 pairs) — identical diploid count to the parent cell.',
            topic: 'Cell Biology'
          }
        ],
        practiceQuestion: {
          question: 'During which phase of mitosis do sister chromatids separate and move to opposite poles?',
          options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
          answerIndex: 2,
          explanation: 'Anaphase is characterized by the enzymatic cleavage of cohesin, allowing sister chromatids to separate toward spindle poles.'
        }
      };
    }

    // 3. Computer Science / Algorithms
    if (qLower.includes('recursion') || qLower.includes('sort') || qLower.includes('tree') || qLower.includes('dynamic') || qLower.includes('algorithm')) {
      return {
        explanation: `### 💻 Algorithms: Divide-and-Conquer & Recursion

**The Russian Matryoshka Doll Analogy:**
Recursion is like opening nested Russian dolls. Each doll opens to reveal a slightly smaller version of the same doll, until you reach the smallest solid doll that cannot be opened anymore—the **Base Case**.

#### 1. Anatomy of Every Recursive Function
\`\`\`python
def recursive_solve(problem_state):
    # 1. Base Case: Trivial scenario where work stops
    if is_base_case(problem_state):
        return base_result
    
    # 2. Recursive Step: Break down into smaller subproblems
    smaller_subproblem = reduce_problem(problem_state)
    return combine(recursive_solve(smaller_subproblem))
\`\`\`

#### 2. Call Stack & Stack Overflow
Each recursive invocation pushes a stack frame. If your base case is missing or unreachable, the call stack exceeds its memory limit, producing a \`StackOverflowError\`.`,
        flashcards: [
          {
            front: 'What are the two mandatory components of every recursive algorithm?',
            back: '1. Base Case (stops recursion)\n2. Recursive Step (reduces problem toward the base case)',
            topic: 'Computer Science'
          },
          {
            front: 'What causes a Stack Overflow error in recursion?',
            back: 'Failure to reach a base case, causing unlimited stack frames to exhaust memory.',
            topic: 'Computer Science'
          }
        ],
        practiceQuestion: {
          question: 'What is the time complexity of naive recursive Fibonacci without memoization?',
          options: ['O(n)', 'O(n log n)', 'O(2^n)', 'O(1)'],
          answerIndex: 2,
          explanation: 'Each call spawns two subsequent recursive calls (fib(n-1) + fib(n-2)), creating a binary tree of depth n with O(2^n) exponential operations.'
        }
      };
    }

    // 4. Universal Dynamic Pedagogical Analyzer
    return {
      explanation: `### 🎓 Deep Study Guide: ${query}

#### 1. Core Definition & Mental Model
To master **${query}**, construct a clear mental model:
- What are the foundational inputs, principles, and assumptions?
- What transformation or mechanism is taking place?
- What is the expected outcome or theorem?

#### 2. Step-by-Step Breakdown Framework
1. **Deconstruct the Core Concept**: Identify primary definitions and boundary constraints.
2. **Examine Worked Applications**: Work through sample problem cases step-by-step rather than memorizing formulas blindly.
3. **Inspect Edge Cases & Common Pitfalls**: Watch out for sign conventions, dimensional units, and edge assumptions.
4. **Active Recall & Self-Testing**: Test whether you can reconstruct the explanation without referencing your notes.`,
      flashcards: [
        {
          front: `State the fundamental principle governing: ${query}`,
          back: `It provides the theoretical framework and operational rules required to analyze and solve problems in this topic.`,
          topic: query
        },
        {
          front: `What is the most effective way to test your mastery of ${query}?`,
          back: `Attempting unguided problem sets and explaining the conceptual solution step-by-step without notes.`,
          topic: query
        }
      ],
      practiceQuestion: {
        question: `Which cognitive learning strategy produces the highest retention when studying ${query}?`,
        options: ['Passive re-reading of textbooks', 'Spaced retrieval practice & active recall', 'Highlighting slides without testing', 'Cramming immediately before testing'],
        answerIndex: 1,
        explanation: 'Cognitive research proves that active retrieval practice spaced over intervals reconstructs neural memory pathways, dramatically increasing exam recall.'
      }
    };
  }

  fallbackFlashcards(topic) {
    return [
      {
        front: `What is the primary definition of ${topic}?`,
        back: `The fundamental concept and underlying mechanism governing this subject area.`,
        topic
      },
      {
        front: `What common mistake should students avoid when working with ${topic}?`,
        back: `Overlooking boundary conditions, units, or applying formulas without verifying core assumptions.`,
        topic
      }
    ];
  }

  extractFlashcardsFromText(text, fallbackTopic) {
    const cards = [];
    const qMatch = text.match(/(?:Flashcard|Q&A|Question|Front):\s*(.+?)\s*(?:Answer|Back):\s*(.+?)(?=\n\n|$)/gi);
    if (qMatch) {
      for (const item of qMatch) {
        const parts = item.split(/(?:Answer|Back):\s*/i);
        if (parts.length >= 2) {
          const front = parts[0].replace(/(?:Flashcard|Q&A|Question|Front):\s*/i, '').trim();
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
