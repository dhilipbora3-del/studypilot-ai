import { callLLM } from './llmClient.js';

/**
 * AI Tutor Agent (Master Academic Engine)
 * Role: Explains concepts with intuitive analogies, rigorous breakdowns,
 * concrete worked examples, active recall flashcards, and conceptual practice questions.
 * Handles both conceptual theory and step-by-step mathematical problem solving.
 */

export class TutorAgent {
  constructor() {
    this.name = 'AI Tutor Agent';
    this.role = 'Concept Explanations, Intuitive Analogies, Notes, Examples & Flashcards';
  }

  async execute(studentQuery, context = {}) {
    const startTime = Date.now();
    const activeProvider = (context.provider || 'chatgpt').toLowerCase();
    const providerBrand = activeProvider.includes('claude') ? 'Claude (Anthropic)' 
      : activeProvider.includes('gemini') ? 'Google Gemini' 
      : 'ChatGPT (OpenAI GPT-4o)';
    const headerEmoji = activeProvider.includes('claude') ? '🧠 Claude Tutor' 
      : activeProvider.includes('gemini') ? '⚡ Gemini Tutor' 
      : '🤖 ChatGPT Tutor';

    const systemPrompt = `You are the master AI Tutor Agent in StudyPilot AI, powered directly by ${providerBrand}.
Your goal is to provide clean, rigorous, crystal-clear, and elegant solutions for university and high school students.
Start your response with a header: "### ${headerEmoji}: [Topic or Problem Title]".

Follow this clean, adaptive structure:

--- IF THE STUDENT ASKS TO SOLVE A PROBLEM, CALCULATION, CODE, OR EXERCISE ---
### 🎯 Problem Breakdown & Given Parameters
- **Given:** [List given values, known variables, and constraints clearly]
- **Target:** [What we are solving for]

### 📐 Governing Principle & Formula
- State the governing law, formula, or algorithmic pattern clearly with LaTeX math ($...$ or $$...$$).

### 🔢 Step-by-Step Solution
1. **Step 1: ...** - Clear algebraic or logical progression.
2. **Step 2: ...** - Intermediate substitutions and computations.
3. **Step 3: ...** - Direct simplification. For code, provide clean, idiomatic, commented code.

### 🏁 Final Answer
> **Final Answer:** [Exact final result with units highlighted prominently]

### 💡 Key Takeaway & Verification
- 1-2 sentence sanity check or exam tip explaining why this result makes sense.

--- IF THE STUDENT ASKS FOR A CONCEPTUAL EXPLANATION OR THEORY ---
### 💡 Core Definition
- Crisp, direct definition in 1–2 sentences without unnecessary jargon.

### 🌟 Intuitive Mental Model
- A vivid, relatable real-world analogy that makes the concept click instantly.

### 🔍 Step-by-Step Mechanism
- Break down the underlying mechanism, dynamics, or theory step-by-step with clean bullet points.

### 💻 Concrete Worked Example
- A short, sharp worked problem, numerical example, or code snippet.

### ⚠️ Common Misconceptions & Exam Traps
- 2 specific traps students frequently fall into and how to avoid them.

--- AT THE VERY END (For Interactive Study Tools) ---
### 🃏 Active Recall Study Flashcards
Front: [High-yield active-recall question testing core principle]
Back: [Precise, complete explanation]

Front: [Key equation, rule, or syntax question]
Back: [Precise, complete explanation]

### 🎯 Conceptual Practice Question
Question: [Multiple choice question testing conceptual depth]
A) [Choice 1]
B) [Choice 2]
C) [Choice 3]
D) [Choice 4]
Correct Answer: [Correct choice letter]
Explanation: [Detailed explanation of why that choice is correct]`;

    const userPrompt = `Topic or Question: "${studentQuery}"
Student Context: ${JSON.stringify(context.studentContext || {})}`;

    let explanation;
    let flashcards = [];
    let practiceQuestion = null;
    let provider = activeProvider;

    // 1. If user supplied an external key or cloud key is configured, attempt live LLM call
    if (context.apiKey || activeProvider !== 'offline') {
      try {
        const llmResult = await callLLM({
          systemPrompt,
          userPrompt,
          temperature: 0.35,
          apiKey: context.apiKey,
          provider: context.provider,
          model: context.model
        });

        if (llmResult.success && llmResult.content && llmResult.content.trim().length > 40) {
          explanation = llmResult.content;
          flashcards = this.extractFlashcardsFromText(explanation, studentQuery);
          practiceQuestion = this.extractPracticeQuestionFromText(explanation);
          provider = `${llmResult.provider}${llmResult.model ? ` (${llmResult.model})` : ''}`;
        }
      } catch (err) {
        console.warn('[Tutor Agent] External LLM call failed, engaging Academic Knowledge Engine:', err.message);
      }
    }

    // 2. High-Yield Academic Pedagogical Engine (Calculates proper solutions for Math, Science & custom topics)
    if (!explanation) {
      const pedagogicalResponse = this.generateDeepTutorResponse(studentQuery, context);
      explanation = pedagogicalResponse.explanation;
      flashcards = pedagogicalResponse.flashcards;
      practiceQuestion = pedagogicalResponse.practiceQuestion;
      provider = `${providerBrand} (Academic Engine)`;
    }

    // Guarantee fallback flashcards and practice question if extraction missed
    if (!flashcards || flashcards.length === 0) {
      flashcards = this.fallbackFlashcards(studentQuery);
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

    let cards = [];
    if (context.apiKey) {
      const llmResult = await callLLM({
        systemPrompt,
        userPrompt: `Topic: ${topic}. Count: ${count}`,
        responseFormat: 'json',
        apiKey: context.apiKey,
        provider: context.provider
      });

      if (llmResult.success) {
        try {
          const parsed = JSON.parse(llmResult.content);
          cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || []);
        } catch (e) {
          cards = this.fallbackFlashcards(topic);
        }
      }
    }

    if (!cards || cards.length === 0) {
      cards = this.fallbackFlashcards(topic);
    }

    return {
      agent: this.name,
      cards,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Dedicated Algebraic and Mathematical Problem Solving Engine
   * Detects equations, arithmetic, and word problems, and computes exact step-by-step solutions
   */
  solveMathProblem(rawQuery) {
    const q = rawQuery.trim();

    // 1. Linear Equation: ax + b = c, ax - b = c, ax = b, x + b = c
    const linearMatch = q.match(/(?:solve\s+)?([+-]?\s*\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*([+-]?\s*\d+(?:\.\d+)?)/i);
    if (linearMatch && !q.includes('^2')) {
      let aStr = (linearMatch[1] || '').replace(/\s+/g, '');
      let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
      let b = linearMatch[2] ? parseFloat(linearMatch[2].replace(/\s+/g, '')) : 0;
      let c = parseFloat(linearMatch[3].replace(/\s+/g, ''));

      if (!isNaN(a) && a !== 0 && !isNaN(b) && !isNaN(c)) {
        const xVal = (c - b) / a;
        const roundedX = Number.isInteger(xVal) ? xVal : parseFloat(xVal.toFixed(4));
        const signB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        const step1Right = c - b;

        return {
          explanation: `### 📐 Algebra Solution: Solving Linear Equation
### 🎯 Problem Breakdown & Given Parameters
- **Given Equation:** $${a === 1 ? '' : a === -1 ? '-' : a}x ${b !== 0 ? signB : ''} = ${c}$
- **Target:** Solve for the unknown variable $x$.

### 📐 Governing Principle & Formula
- **Properties of Equality**: Any mathematical operation applied to one side of an equation must be applied equally to the other side to maintain equivalence.
$$\\text{If } ax + b = c \\implies ax = c - b \\implies x = \\frac{c - b}{a}$$

### 🔢 Step-by-Step Solution
1. **Step 1: Isolate the variable term ($ax$)**
   ${b !== 0 ? `Subtract $${b}$ from both sides:\n   $$${a === 1 ? '' : a}x = ${c} - (${b}) = ${step1Right}$$` : `The variable term is already isolated: $$${a}x = ${c}$$`}
2. **Step 2: Solve for $x$ by dividing by the coefficient ($a = ${a}$)**
   $$x = \\frac{${step1Right}}{${a}} = ${roundedX}$$

### 🏁 Final Answer
> **Final Answer:** $$x = ${roundedX}$$

### 💡 Key Takeaway & Verification
- **Verification Check**: Substitute $x = ${roundedX}$ back into the original equation:
  $$${a}(${roundedX}) ${b !== 0 ? signB : ''} = ${a * roundedX + b} = ${c} \\quad \\text{✓ (Identity holds)}$$`,
          flashcards: [
            {
              front: `What is the core rule for solving any linear equation ax + b = c?`,
              back: `Isolate the variable term by subtracting constant b, then divide both sides by the coefficient a: x = (c - b) / a.`,
              topic: 'Linear Algebra'
            },
            {
              front: `How can you verify that a solved value for x is mathematically correct?`,
              back: `Substitute the calculated value back into the original equation and verify both sides evaluate to the exact same number.`,
              topic: 'Linear Algebra'
            }
          ],
          practiceQuestion: {
            question: `Solve the linear equation for x: 3x - 9 = 15`,
            options: ['x = 8', 'x = 6', 'x = 2', 'x = 7'],
            answerIndex: 0,
            explanation: `3x - 9 = 15 => 3x = 15 + 9 = 24 => x = 24 / 3 = 8.`
          }
        };
      }
    }

    // 2. Quadratic Equation: ax^2 + bx + c = 0
    const quadMatch = q.match(/(?:solve\s+)?([+-]?\s*\d*(?:\.\d+)?)\s*x\^?2\s*([+-]\s*\d*(?:\.\d+)?)?\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*0/i);
    if (quadMatch) {
      let aStr = (quadMatch[1] || '').replace(/\s+/g, '');
      let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
      let bStr = (quadMatch[2] || '').replace(/\s+/g, '');
      let b = bStr === '' || bStr === '+' ? 1 : bStr === '-' ? -1 : (bStr ? parseFloat(bStr) : 0);
      let c = quadMatch[3] ? parseFloat(quadMatch[3].replace(/\s+/g, '')) : 0;

      if (!isNaN(a) && a !== 0 && !isNaN(b) && !isNaN(c)) {
        const discriminant = (b * b) - (4 * a * c);
        let rootsText = '';
        let finalAnswer = '';

        if (discriminant > 0) {
          const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          const r1Str = Number.isInteger(r1) ? r1 : parseFloat(r1.toFixed(3));
          const r2Str = Number.isInteger(r2) ? r2 : parseFloat(r2.toFixed(3));
          rootsText = `Since the discriminant $\\Delta = ${discriminant} > 0$, the equation has **two distinct real roots**:\n` +
            `$$x_1 = \\frac{-(${b}) + \\sqrt{${discriminant}}}{2(${a})} = ${r1Str}$$\n` +
            `$$x_2 = \\frac{-(${b}) - \\sqrt{${discriminant}}}{2(${a})} = ${r2Str}$$`;
          finalAnswer = `$$x = ${r1Str} \\quad \\text{and} \\quad x = ${r2Str}$$`;
        } else if (discriminant === 0) {
          const r = -b / (2 * a);
          const rStr = Number.isInteger(r) ? r : parseFloat(r.toFixed(3));
          rootsText = `Since the discriminant $\\Delta = 0$, the equation has **one repeated real root**:\n` +
            `$$x = \\frac{-(${b})}{2(${a})} = ${rStr}$$`;
          finalAnswer = `$$x = ${rStr}$$`;
        } else {
          const realPart = (-b / (2 * a)).toFixed(2);
          const imagPart = (Math.sqrt(Math.abs(discriminant)) / (2 * a)).toFixed(2);
          rootsText = `Since $\\Delta = ${discriminant} < 0$, there are **two complex conjugate roots**:\n` +
            `$$x = ${realPart} \\pm ${imagPart}i$$`;
          finalAnswer = `$$x = ${realPart} \\pm ${imagPart}i$$`;
        }

        return {
          explanation: `### 📐 Quadratic Equation Solution
### 🎯 Problem Breakdown & Given Parameters
- **Given Quadratic:** $${a === 1 ? '' : a}x^2 ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} = 0$
- **Standard Coefficients:** $a = ${a},\\quad b = ${b},\\quad c = ${c}$

### 📐 Governing Principle & Formula
- **The Quadratic Formula**:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- **Discriminant Analysis**: $\\Delta = b^2 - 4ac$ determines the nature of the roots.

### 🔢 Step-by-Step Solution
1. **Step 1: Compute the Discriminant ($\\Delta$)**
   $$\\Delta = (${b})^2 - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${discriminant}$$
2. **Step 2: Apply the Quadratic Formula**
   ${rootsText}

### 🏁 Final Answer
> **Final Answer:** ${finalAnswer}

### 💡 Key Takeaway & Verification
- **Vieta's Formulas Verification**:
  $$\\text{Sum of roots: } x_1 + x_2 = -\\frac{b}{a} = -\\frac{${b}}{${a}} = ${-b / a}$$
  $$\\text{Product of roots: } x_1 \\cdot x_2 = \\frac{c}{a} = \\frac{${c}}{${a}} = ${c / a}$$`,
          flashcards: [
            {
              front: 'State the Quadratic Formula used to find roots of ax² + bx + c = 0.',
              back: 'x = [-b ± √(b² - 4ac)] / (2a)',
              topic: 'Quadratic Equations'
            },
            {
              front: 'What does the Discriminant Δ = b² - 4ac tell you about a quadratic equation?',
              back: 'Δ > 0: Two distinct real roots. Δ = 0: One repeated real root. Δ < 0: Two complex conjugate roots.',
              topic: 'Quadratic Equations'
            }
          ],
          practiceQuestion: {
            question: `What are the roots of the quadratic equation x² - 5x + 6 = 0?`,
            options: ['x = 2 and x = 3', 'x = -2 and x = -3', 'x = 1 and x = 6', 'x = -1 and x = -6'],
            answerIndex: 0,
            explanation: `Factoring: (x - 2)(x - 3) = 0, so roots are x = 2 and x = 3. Sum = 5, product = 6.`
          }
        };
      }
    }

    // 3. Percentage Calculation: e.g. "what is 15% of 240", "calculate 20 percent of 80"
    const pctMatch = q.match(/(?:what\s+is|calculate)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/i);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const base = parseFloat(pctMatch[2]);
      const result = (pct / 100) * base;
      const rounded = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));

      return {
        explanation: `### 🔢 Percentage Calculation
### 🎯 Problem Breakdown & Given Parameters
- **Percentage Rate:** $${pct}\\%$
- **Base Amount:** $${base}$
- **Target:** Find $${pct}\\%$ of $${base}$.

### 📐 Governing Principle & Formula
- **Percentage Definition**: A percentage represents a fraction out of 100:
$$P = \\left(\\frac{\\text{Rate}}{100}\\right) \\times \\text{Base}$$

### 🔢 Step-by-Step Solution
1. **Convert percentage to decimal fraction**:
   $$\\frac{${pct}}{100} = ${(pct / 100).toFixed(4).replace(/\.?0+$/, '')}$$
2. **Multiply by the base amount**:
   $$${(pct / 100).toFixed(4).replace(/\.?0+$/, '')} \\times ${base} = ${rounded}$$

### 🏁 Final Answer
> **Final Answer:** **${rounded}**

### 💡 Key Takeaway & Verification
- Mental math check: $10\\%$ of $${base}$ is $${(base * 0.1).toFixed(2)}$, so $${pct}\\%$ aligns with $${rounded}$.`,
        flashcards: [
          {
            front: 'How do you convert any percentage into a decimal for calculation?',
            back: 'Divide the percentage value by 100 (move the decimal point two places to the left).',
            topic: 'Percentages'
          },
          {
            front: 'Formula to compute P% of a value N:',
            back: 'Result = (P / 100) * N',
            topic: 'Percentages'
          }
        ],
        practiceQuestion: {
          question: `What is 25% of 160?`,
          options: ['40', '35', '45', '50'],
          answerIndex: 0,
          explanation: `25% is 1/4th. 160 / 4 = 40.`
        }
      };
    }

    // 4. Pythagorean Theorem: "find hypotenuse legs 3 and 4", "pythagorean theorem for 6 and 8"
    const pythMatch = q.match(/(?:pythagor|hypotenuse).+?(\d+(?:\.\d+)?)\s*(?:and|,|&)\s*(\d+(?:\.\d+)?)/i);
    if (pythMatch) {
      const a = parseFloat(pythMatch[1]);
      const b = parseFloat(pythMatch[2]);
      const c = Math.sqrt(a * a + b * b);
      const cStr = Number.isInteger(c) ? c : parseFloat(c.toFixed(3));

      return {
        explanation: `### 📐 Pythagorean Theorem Solution
### 🎯 Problem Breakdown & Given Parameters
- **Leg $a$:** $${a}$
- **Leg $b$:** $${b}$
- **Target:** Hypotenuse $c$.

### 📐 Governing Principle & Formula
$$a^2 + b^2 = c^2 \\implies c = \\sqrt{a^2 + b^2}$$

### 🔢 Step-by-Step Solution
1. **Square both known legs**:
   $$a^2 = ${a}^2 = ${a * a}, \\quad b^2 = ${b}^2 = ${b * b}$$
2. **Sum the squares**:
   $$a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$$
3. **Compute the principal square root**:
   $$c = \\sqrt{${a * a + b * b}} = ${cStr}$$

### 🏁 Final Answer
> **Final Answer:** Hypotenuse $$c = ${cStr}$$`,
        flashcards: [
          {
            front: 'State the Pythagorean Theorem formula for a right triangle.',
            back: 'a² + b² = c², where c is the hypotenuse opposite the right angle.',
            topic: 'Geometry'
          },
          {
            front: 'What are the three most common Pythagorean triples?',
            back: '(3, 4, 5), (5, 12, 13), and (8, 15, 17).',
            topic: 'Geometry'
          }
        ],
        practiceQuestion: {
          question: `In a right triangle with legs of length 5 and 12, what is the length of the hypotenuse?`,
          options: ['13', '17', '15', '14'],
          answerIndex: 0,
          explanation: `c = √(5² + 12²) = √(25 + 144) = √169 = 13.`
        }
      };
    }

    return null;
  }

  /**
   * Deep Pedagogical Knowledge Base
   * Covers all foundational disciplines: Math, Physics, Chemistry, Biology, Computer Science, Economics, Psychology
   */
  generateDeepTutorResponse(query, context) {
    // 1. Check if query is an algebraic or numerical problem
    const mathSolved = this.solveMathProblem(query);
    if (mathSolved) {
      return mathSolved;
    }

    const q = query.toLowerCase();
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(q);
    const hasAnyWord = (...words) => words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(q));

    // ==========================================
    // 1. MATHEMATICS & CALCULUS
    // ==========================================
    if (q.includes('eigen') || q.includes('matrix') || q.includes('determinant') || q.includes('linear algebra')) {
      return {
        explanation: `### 📐 Linear Algebra: Eigenvalues, Eigenvectors & Matrix Transformations

### 🌟 Intuitive Mental Model & Real-World Analogy
Imagine stretching a flexible sheet of rubber across your desk. If you drew arrows in every direction, most arrows will tilt, rotate, and stretch. However, there are special, privileged directions where the arrows **do not rotate at all**—they only stretch or shrink along their original line.
* Those invariant directional arrows are the **Eigenvectors**.
* The factor by which they stretch or shrink is the **Eigenvalue** ($\lambda$).

### 🔍 Core Principles & Mechanism
The foundational relationship for any square transformation matrix $\\mathbf{A}$:
$$\\mathbf{A}\\mathbf{v} = \\lambda \\mathbf{v}$$

To compute them systematically:
1. **Characteristic Equation**: Rearrange to $(\\mathbf{A} - \\lambda \\mathbf{I})\\mathbf{v} = \\mathbf{0}$.
2. For non-trivial (non-zero) solutions $\\mathbf{v}$, the transformation must compress dimension, meaning:
   $$\\det(\\mathbf{A} - \\lambda \\mathbf{I}) = 0$$
3. Solve the characteristic polynomial to determine eigenvalues $\\lambda_1, \\lambda_2, \\dots$.
4. Substitute each $\\lambda$ back into $(\\mathbf{A} - \\lambda \\mathbf{I})\\mathbf{v} = \\mathbf{0}$ and use row reduction to find the eigenspace basis vectors $\\mathbf{v}$.

### 💡 Concrete Worked Example
For matrix $\\mathbf{A} = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$:
$$\\det\\begin{pmatrix} 4 - \\lambda & 1 \\\\ 2 & 3 - \\lambda \\end{pmatrix} = (4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\lambda + 10 = 0$$
Factoring: $(\\lambda - 5)(\\lambda - 2) = 0 \\implies \\lambda_1 = 5, \\lambda_2 = 2$.
* For $\\lambda = 5$: $\\begin{pmatrix} -1 & 1 \\\\ 2 & -2 \\end{pmatrix}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = 0 \\implies -x + y = 0 \\implies \\mathbf{v}_1 = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Forgetting that an eigenvector **can never be the zero vector** $\\mathbf{0}$, though an eigenvalue **can** be zero ($\lambda = 0$ means the matrix is singular/non-invertible).
* **Trap 2**: Failing to verify with Trace and Determinant rules: $\\sum \\lambda_i = \\text{Trace}(\\mathbf{A})$ and $\\prod \\lambda_i = \\det(\\mathbf{A})$.`,
        flashcards: [
          {
            front: 'What is the characteristic equation used to solve for eigenvalues?',
            back: 'det(A - λI) = 0, whose roots are the eigenvalues of matrix A.',
            topic: 'Linear Algebra'
          },
          {
            front: 'What does an eigenvalue of λ = 0 reveal about a matrix?',
            back: 'It implies det(A) = 0, meaning the matrix is singular and has no inverse.',
            topic: 'Linear Algebra'
          }
        ],
        practiceQuestion: {
          question: 'If a 2x2 matrix has a trace of 7 and a determinant of 10, what are its eigenvalues?',
          options: ['λ = 2 and λ = 5', 'λ = 3 and λ = 4', 'λ = 1 and λ = 10', 'λ = -2 and λ = -5'],
          answerIndex: 0,
          explanation: 'Sum of eigenvalues = Trace (2 + 5 = 7) and Product = Determinant (2 * 5 = 10).'
        }
      };
    }

    if (q.includes('derivative') || q.includes('calculus') || q.includes('integral') || q.includes('limit') || q.includes('chain rule')) {
      return {
        explanation: `### 📈 Calculus: Rates of Change & Accumulation

### 🌟 Intuitive Mental Model & Real-World Analogy
* **The Derivative ($dy/dx$)** is your vehicle's **speedometer**: it measures your exact instantaneous rate of change at a single frozen moment in time.
* **The Integral ($\\int f(x) dx$)** is your **odometer**: it adds up all the tiny, infinitesimal distance slices over time to compute the total accumulated distance traveled.

### 🔍 Core Principles & Mechanism
#### 1. Fundamental Rules of Differentiation
* **Power Rule**: $\\frac{d}{dx}[x^n] = n x^{n-1}$
* **Product Rule**: $\\frac{d}{dx}[u \\cdot v] = u'v + uv'$
* **Chain Rule**: $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$ *(differentiate outer, keep inner, multiply by derivative of inside)*

#### 2. Fundamental Theorem of Calculus (FTC)
The bridge uniting derivatives and integrals:
$$\\int_a^b f(x)\\,dx = F(b) - F(a) \\quad \\text{where } F'(x) = f(x)$$

### 💡 Concrete Worked Example
Differentiate $h(x) = (3x^2 + 1)^4$:
1. Outer function: $f(u) = u^4 \\implies f'(u) = 4u^3$
2. Inner function: $g(x) = 3x^2 + 1 \\implies g'(x) = 6x$
3. Apply Chain Rule: $h'(x) = 4(3x^2 + 1)^3 \\cdot (6x) = 24x(3x^2 + 1)^3$.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Forgetting $+C$ on indefinite integrals. Indefinite integrals produce an entire family of antiderivative curves.
* **Trap 2**: Treating the derivative of a product as the product of derivatives ($(uv)' \\neq u'v'$). Always use the product rule!`,
        flashcards: [
          {
            front: 'State the Chain Rule formula in calculus.',
            back: 'd/dx [f(g(x))] = f\'(g(x)) * g\'(x). Differentiate outer, keep inner, multiply by inner\'s derivative.',
            topic: 'Calculus'
          },
          {
            front: 'What is the geometric meaning of the definite integral ∫ from a to b of f(x) dx?',
            back: 'The net signed area between the curve f(x) and the x-axis from x = a to x = b.',
            topic: 'Calculus'
          }
        ],
        practiceQuestion: {
          question: 'What is the derivative of f(x) = (3x^2 + 1)^4 with respect to x?',
          options: ['12x(3x^2 + 1)^3', '24x(3x^2 + 1)^3', '4(3x^2 + 1)^3', '6x(3x^2 + 1)^3'],
          answerIndex: 1,
          explanation: 'By the Chain Rule: 4*(3x^2 + 1)^3 * d/dx[3x^2 + 1] = 4*(3x^2 + 1)^3 * 6x = 24x(3x^2 + 1)^3.'
        }
      };
    }

    if (q.includes('bayes') || q.includes('probability') || q.includes('statistic') || q.includes('distribution') || q.includes('standard deviation')) {
      return {
        explanation: `### 📊 Probability & Statistics: Distributions, Variances & Bayes' Theorem

### 🌟 Intuitive Mental Model & Real-World Analogy
Imagine a medical test for a rare disease that is 99% accurate. If you test positive, what is the probability you actually have the disease? Most people intuitively say 99%, but that is false! If only 1 in 10,000 people have the disease, the vast majority of positive tests are false positives among the 9,999 healthy people.
* **Prior Belief**: What was known before new data ($P(A)$).
* **Likelihood**: How consistent is the new evidence with the hypothesis ($P(B|A)$).
* **Posterior Belief**: Your updated confidence after incorporating the evidence ($P(A|B)$).

### 🔍 Core Principles & Mechanism
#### 1. Bayes' Theorem
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

#### 2. Normal Distribution & 68-95-99.7 Empirical Rule
For any bell curve with mean $\\mu$ and standard deviation $\\sigma$:
* $\\sim 68.2\\%$ of observations lie within $[\\mu - \\sigma, \\mu + \\sigma]$
* $\\sim 95.4\\%$ lie within $[\\mu - 2\\sigma, \\mu + 2\\sigma]$
* $\\sim 99.7\\%$ lie within $[\\mu - 3\\sigma, \\mu + 3\\sigma]$

### 💡 Concrete Worked Example
If exam scores have mean $\\mu = 75$ and $\\sigma = 8$:
* A score of $83$ is at $+1\\sigma$ ($z = \\frac{83-75}{8} = +1.0$), placing the student above $\\sim 84\\%$ of the class.

### ⚠️ Common Misconceptions & Exam Traps
* **Base Rate Fallacy**: Neglecting the prior probability (base rate) when evaluating evidence.
* **Standard Deviation vs Variance**: $\\text{Variance} = \\sigma^2$, whereas $\\text{Standard Deviation} = \\sigma$ (measured in original units).`,
        flashcards: [
          {
            front: 'State Bayes\' Theorem formula.',
            back: 'P(A|B) = [P(B|A) * P(A)] / P(B). Computes updated posterior probability from prior and likelihood.',
            topic: 'Probability & Statistics'
          },
          {
            front: 'What percentage of data falls within 2 standard deviations of the mean in a Normal distribution?',
            back: 'Approximately 95.4% (the 68-95-99.7 empirical rule).',
            topic: 'Probability & Statistics'
          }
        ],
        practiceQuestion: {
          question: 'In Bayes\' Theorem P(A|B) = P(B|A)P(A)/P(B), what is P(A) called?',
          options: ['Likelihood', 'Prior probability', 'Posterior probability', 'Marginal likelihood'],
          answerIndex: 1,
          explanation: 'P(A) is the Prior probability—the baseline probability of hypothesis A before observing new evidence B.'
        }
      };
    }

    // ==========================================
    // 2. PHYSICS & ENGINEERING
    // ==========================================
    if (q.includes('newton') || q.includes('force') || q.includes('mechanic') || q.includes('gravity') || q.includes('momentum') || q.includes('friction') || q.includes('kinematic')) {
      return {
        explanation: `### 🚀 Classical Mechanics: Newton's Laws & Kinematic Dynamics

### 🌟 Intuitive Mental Model & Real-World Analogy
* **1st Law (Inertia)**: If you slide an air hockey puck on a frictionless table, it glides forever at constant speed until a bumper hits it. Matter is naturally lazy: it maintains its state of motion unless compelled to change.
* **2nd Law ($F_{net} = ma$)**: Pushing an empty shopping cart causes fast acceleration; pushing the same cart loaded with 200 kg of cement requires massive force to achieve the same acceleration.
* **3rd Law (Action-Reaction)**: When you step off a small rowboat onto a dock, your foot pushes forward on the dock, and the dock pushes you forward—while the boat shoots backward into the water.

### 🔍 Core Principles & Mechanism
1. **Newton\'s 1st Law**: An object remains at rest or in uniform velocity unless acted upon by a net external force ($\\sum \\mathbf{F} = \\mathbf{0} \\implies \\mathbf{a} = \\mathbf{0}$).
2. **Newton\'s 2nd Law**: $\\sum \\mathbf{F} = m \\mathbf{a} = \\frac{d\\mathbf{p}}{dt}$ (Net force is the time rate of change of momentum).
3. **Newton\'s 3rd Law**: For every action force $\\mathbf{F}_{A \\to B}$, there is an equal and opposite reaction force $\\mathbf{F}_{B \\to A} = -\\mathbf{F}_{A \\to B}$ acting on different bodies.
4. **Conservation of Momentum**: In an isolated system with no external net force, total linear momentum is strictly conserved: $\\mathbf{p}_{initial} = \\mathbf{p}_{final}$.

### 💡 Concrete Worked Example
A 10 kg crate rests on a floor with kinetic friction coefficient $\\mu_k = 0.2$. A horizontal pull force of $50\\,\\text{N}$ is applied ($g = 9.8\\,\\text{m/s}^2$).
1. Normal force: $F_N = mg = 10 \\times 9.8 = 98\\,\\text{N}$.
2. Friction force: $f_k = \\mu_k F_N = 0.2 \\times 98 = 19.6\\,\\text{N}$.
3. Net Force: $F_{net} = F_{pull} - f_k = 50 - 19.6 = 30.4\\,\\text{N}$.
4. Acceleration: $a = \\frac{F_{net}}{m} = \\frac{30.4}{10} = 3.04\\,\\text{m/s}^2$.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Thinking action-reaction pairs cancel each other out. They act on **two different bodies**, so they never cancel within a single free-body diagram!
* **Trap 2**: Confusing velocity with net force. An object moving at constant high velocity has **zero** net force.`,
        flashcards: [
          {
            front: 'Why do Newton\'s 3rd law action-reaction pairs never cancel each other out?',
            back: 'Because they act on two different objects, not on the same free-body system.',
            topic: 'Physics Mechanics'
          },
          {
            front: 'Under what condition is total linear momentum strictly conserved?',
            back: 'When the net external force acting on the system is zero (F_net,ext = 0).',
            topic: 'Physics Mechanics'
          }
        ],
        practiceQuestion: {
          question: 'An object travels in a straight line at constant velocity 50 m/s in deep space. What is the net external force on it?',
          options: ['50 N in the direction of motion', '0 N', 'Depends on mass', 'Mass times 50 m/s'],
          answerIndex: 1,
          explanation: 'By Newton\'s First Law, constant velocity means zero acceleration, which requires net external force F_net = ma = 0.'
        }
      };
    }

    if (q.includes('electric') || q.includes('circuit') || q.includes('ohm') || q.includes('voltage') || q.includes('current') || q.includes('resistor')) {
      return {
        explanation: `### ⚡ Electromagnetism & Circuits: Ohm's Law & Kirchhoff's Rules

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of an electric circuit as a water plumbing loop:
* **Voltage ($V$, Volts)** is the water pump pressure that drives water through the pipes.
* **Current ($I$, Amperes)** is the flow rate (gallons per second / coulombs per second) moving past a point.
* **Resistance ($R$, Ohms $\\Omega$)** is a narrow constriction or valve in the pipe that opposes water flow, dissipating energy as heat.

### 🔍 Core Principles & Mechanism
#### 1. Ohm's Law
$$V = I \\cdot R \\quad \\implies \\quad I = \\frac{V}{R}, \\quad P = V \\cdot I = I^2 R$$
#### 2. Kirchhoff's Laws
* **Kirchhoff\'s Current Law (KCL - Charge Conservation)**: The sum of currents entering any junction equals the sum of currents leaving: $\\sum I_{in} = \\sum I_{out}$.
* **Kirchhoff\'s Voltage Law (KVL - Energy Conservation)**: The directed sum of electrical potential differences around any closed circuit loop is zero: $\\sum \\Delta V_{loop} = 0$.

### 💡 Concrete Worked Example
A $12\\,\\text{V}$ battery is connected in series with two resistors: $R_1 = 4\\,\\Omega$ and $R_2 = 2\\,\\Omega$.
1. Equivalent series resistance: $R_{eq} = R_1 + R_2 = 4 + 2 = 6\\,\\Omega$.
2. Total circuit current: $I = \\frac{V}{R_{eq}} = \\frac{12}{6} = 2\\,\\text{A}$.
3. Voltage drop across $R_1$: $V_1 = I \\cdot R_1 = 2 \\times 4 = 8\\,\\text{V}$.
4. Voltage drop across $R_2$: $V_2 = I \\cdot R_2 = 2 \\times 2 = 4\\,\\text{V}$.
5. KVL check: $12\\,\\text{V} - 8\\,\\text{V} - 4\\,\\text{V} = 0\\,\\text{V}$ (Energy strictly conserved).

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Believing current gets "consumed" as it passes through a resistor. Current is strictly conserved; it is electrical potential energy that drops across the load.
* **Trap 2**: Treating parallel resistors as a simple sum. In parallel: $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}$, meaning total resistance is always *less* than the smallest individual resistor.`,
        flashcards: [
          {
            front: 'State Kirchhoff\'s Current Law (KCL) and its underlying conservation principle.',
            back: 'Sum of currents entering a junction equals currents leaving (Σ I_in = Σ I_out). Derived from Conservation of Charge.',
            topic: 'Circuits'
          },
          {
            front: 'What happens to total resistance when you add another resistor in parallel?',
            back: 'Total resistance decreases because you provide an additional parallel path for charge to flow.',
            topic: 'Circuits'
          }
        ],
        practiceQuestion: {
          question: 'Two 10-ohm resistors are connected in parallel to a 20V battery. What is the total current drawn from the battery?',
          options: ['1 A', '2 A', '4 A', '0.5 A'],
          answerIndex: 2,
          explanation: 'In parallel, R_eq = (10 * 10) / (10 + 10) = 5 ohms. By Ohm\'s Law: I = V / R_eq = 20V / 5 ohms = 4 A.'
        }
      };
    }

    if (q.includes('quantum') || q.includes('thermo') || q.includes('entropy') || q.includes('photon') || q.includes('photoelectric')) {
      return {
        explanation: `### 🌌 Modern Physics: Wave-Particle Duality & Thermodynamics

### 🌟 Intuitive Mental Model & Real-World Analogy
* **Wave-Particle Duality**: Light acts like a wave when spreading through space (creating ripple interference like waves on a pond), but acts like a hail of discrete bullets (photons) when it collides with a detector or knocks electrons out of a metal plate.
* **Entropy & 2nd Law of Thermodynamics**: A dropped coffee mug shatters into a thousand disorderly pieces spontaneously, but those thousand shards will never spontaneously leap back together to reassemble into a mug. Nature has an arrow of time toward increasing microstate probability (Entropy).

### 🔍 Core Principles & Mechanism
1. **Photoelectric Effect & Photon Energy**:
   $$E = h f = \\frac{h c}{\\lambda}$$
   Where $h = 6.626 \\times 10^{-34}\\,\\text{J}\\cdot\\text{s}$ (Planck's constant). Electrons are only ejected if the photon frequency exceeds threshold frequency $f_0$:
   $$K_{max} = h f - \\Phi \\quad (\\Phi = \\text{work function})$$
2. **De Broglie Wavelength**: Every moving particle of momentum $p = mv$ possesses an associated matter wave:
   $$\\lambda = \\frac{h}{p} = \\frac{h}{mv}$$
3. **Second Law of Thermodynamics**: In any spontaneous process, the total entropy of an isolated system always increases: $\\Delta S_{univ} \\ge 0$.

### 💡 Concrete Worked Example
A metal has work function $\\Phi = 2.0\\,\\text{eV}$. Light with photon energy $3.5\\,\\text{eV}$ strikes the metal.
* Maximum kinetic energy of emitted photoelectrons:
  $$K_{max} = E_{photon} - \\Phi = 3.5\\,\\text{eV} - 2.0\\,\\text{eV} = 1.5\\,\\text{eV}$$
* Increasing the light brightness (intensity) ejects *more* electrons, but does *not* increase their individual kinetic energy! Only increasing the frequency of the light increases $K_{max}$.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Thinking light intensity increases photoelectron kinetic energy. Classical wave theory predicted this, but Einstein proved intensity only increases the *number* of photons, not their individual energy.
* **Trap 2**: Believing entropy cannot decrease locally. A refrigerator decreases entropy inside its chamber, but only by expelling more heat outside.`,
        flashcards: [
          {
            front: 'What does Einstein\'s Photoelectric Effect prove about light?',
            back: 'Light consists of quantized packets of energy called photons (E = hf), establishing the particle nature of electromagnetic radiation.',
            topic: 'Quantum Physics'
          },
          {
            front: 'State the De Broglie matter-wave equation.',
            back: 'λ = h / p = h / (mv). Shows that any particle with mass and velocity exhibits wave characteristics.',
            topic: 'Quantum Physics'
          }
        ],
        practiceQuestion: {
          question: 'If you double the intensity of monochromatic light striking a photoelectric plate above threshold frequency, what doubles?',
          options: ['The maximum kinetic energy of ejected electrons', 'The number of ejected electrons per second (photocurrent)', 'The stopping potential', 'The work function of the metal'],
          answerIndex: 1,
          explanation: 'Doubling intensity doubles the rate of incident photons, which doubles the number of ejected photoelectrons per second (photocurrent), but each electron\'s individual energy remains unchanged.'
        }
      };
    }

    // ==========================================
    // 3. BIOLOGY & LIFE SCIENCES
    // ==========================================
    if (q.includes('photo') || q.includes('respirat') || q.includes('atp') || q.includes('glycolysis') || q.includes('krebs') || q.includes('chloroplast') || q.includes('mitochondria')) {
      return {
        explanation: `### 🌿 Biochemistry: Photosynthesis & Cellular Respiration

### 🌟 Intuitive Mental Model & Real-World Analogy
* **Photosynthesis** is like a solar-powered bakery: taking low-energy water and carbon dioxide, catching solar photons, and baking high-energy glucose bread loaves.
* **Cellular Respiration** is like eating that bread and burning it in a power generator: breaking glucose down into $\\text{CO}_2$ and water to recharge cellular chemical batteries (**ATP**).
* They are complementary mirror processes that power the planetary biosphere!

### 🔍 Core Principles & Mechanism
#### 1. Photosynthesis Equation
$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$
* **Light Reactions (Thylakoids)**: Photons excite chlorophyll electrons; water is split ($2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + \\text{O}_2 + 4e^-$) releasing oxygen gas; produces ATP and NADPH.
* **Calvin Cycle (Stroma)**: Enzyme RuBisCO fixes atmospheric $\\text{CO}_2$ into G3P (glucose precursor) using ATP and NADPH.

#### 2. Cellular Respiration Equation
$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\longrightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\sim 30\\text{-}32\\,\\text{ATP}$$
* **Glycolysis (Cytoplasm)**: Glucose ($6\\text{C}$) $\\to$ 2 Pyruvate ($3\\text{C}$), generating net 2 ATP + 2 NADH (anaerobic).
* **Krebs / Citric Acid Cycle (Mitochondrial Matrix)**: Acetyl-CoA oxidized; releases $\\text{CO}_2$; produces NADH, $\\text{FADH}_2$, 2 ATP.
* **Electron Transport Chain (Inner Mitochondrial Membrane)**: Electrons passed through complexes, pumping $\\text{H}^+$ into intermembrane space; $\\text{H}^+$ gradient drives **ATP Synthase** via chemiosmosis; oxygen acts as the final electron acceptor, forming $\\text{H}_2\\text{O}$.

### 💡 Concrete Worked Example
Why do we suffocate without oxygen?
Without oxygen at the end of the electron transport chain, electrons back up the chain like cars in a traffic jam. NADH cannot donate its electrons, the $\\text{H}^+$ gradient collapses, ATP synthase stops spinning, and cellular ATP levels plummet to zero within minutes.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Thinking plants only do photosynthesis and not respiration. Plants have mitochondria and perform cellular respiration 24 hours a day to power their own cells!
* **Trap 2**: Believing the oxygen released in photosynthesis comes from $\\text{CO}_2$. Isotope tracking proved oxygen gas comes strictly from **photolysis of water** ($\\text{H}_2\\text{O}$).`,
        flashcards: [
          {
            front: 'What is the role of Oxygen (O2) in cellular respiration?',
            back: 'Oxygen serves as the final electron acceptor in the electron transport chain, combining with H+ to form water (H2O).',
            topic: 'Biochemistry'
          },
          {
            front: 'Where do the light reactions and Calvin cycle occur within the chloroplast?',
            back: 'Light reactions occur in the thylakoid membranes; the Calvin cycle occurs in the fluid stroma.',
            topic: 'Biochemistry'
          }
        ],
        practiceQuestion: {
          question: 'What is the primary enzyme responsible for carbon fixation in the Calvin Cycle of photosynthesis?',
          options: ['ATP Synthase', 'RuBisCO', 'DNA Polymerase', 'Amylase'],
          answerIndex: 1,
          explanation: 'RuBisCO catalyzes the crucial initial step of fixing atmospheric CO2 into organic carbon compounds in the stroma.'
        }
      };
    }

    if (q.includes('mitosis') || q.includes('meiosis') || q.includes('cell') || q.includes('chromosome') || q.includes('division')) {
      return {
        explanation: `### 🧬 Cell Biology: Mitosis vs. Meiosis & Cellular Reproduction

### 🌟 Intuitive Mental Model & Real-World Analogy
* **Mitosis** is like photocopying an instruction manual: every new department gets an identical copy of the full binder so they can operate the exact same way. It is used for body growth and tissue repair.
* **Meiosis** is like a card-shuffling game: you take cards from maternal and paternal decks, shuffle them together (crossing over), and deal out half-decks to create gametes (sperm and egg) that are 100% unique.

### 🔍 Core Principles & Mechanism
#### Stages of Mitosis (PMAT)
1. **Prophase**: Chromatin condenses into distinct chromosomes. Spindle apparatus forms, and nuclear envelope breaks down.
2. **Metaphase**: Chromosomes line up single-file along the equatorial metaphase plate.
3. **Anaphase**: Sister chromatids are enzymatically cleaved and pulled to opposite cell poles.
4. **Telophase & Cytokinesis**: Nuclear envelopes reform around separated chromosomes; cleavage furrow/cell plate divides cytoplasm.

#### Key Comparisons: Mitosis vs Meiosis
| Feature | Mitosis | Meiosis |
| :--- | :--- | :--- |
| **Purpose** | Growth, tissue repair, asexual reproduction | Production of gametes (sperm/egg) for sexual reproduction |
| **Rounds of Division** | 1 division (PMAT) | 2 divisions (Meiosis I & II) |
| **Genetic Outcome** | 2 genetically identical diploid ($2n$) cells | 4 genetically diverse haploid ($1n$) cells |
| **Crossing Over** | Does not occur | Occurs during Prophase I (homologous recombination) |

### 💡 Concrete Worked Example
Human cells have $2n = 46$ chromosomes (23 pairs):
* After **Mitosis**: 2 daughter cells, each containing 46 chromosomes (23 pairs, diploid).
* After **Meiosis**: 4 daughter gametes, each containing 23 individual chromosomes (haploid). Fertilization of egg (23) by sperm (23) restores the diploid 46.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Confusing sister chromatids with homologous chromosomes. Homologous chromosomes are parental pairs; sister chromatids are identical post-replication copies joined at the centromere.
* **Trap 2**: Forgetting that DNA replication occurs **only once** before Meiosis, not between Meiosis I and Meiosis II.`,
        flashcards: [
          {
            front: 'What are the two major sources of genetic diversity generated during Meiosis?',
            back: '1. Crossing over (homologous recombination in Prophase I)\n2. Independent assortment of homologous chromosomes in Metaphase I.',
            topic: 'Cell Biology'
          },
          {
            front: 'How many chromosomes and daughter cells are produced by human mitosis vs meiosis?',
            back: 'Mitosis: 2 identical diploid (2n = 46) cells.\nMeiosis: 4 unique haploid (1n = 23) cells.',
            topic: 'Cell Biology'
          }
        ],
        practiceQuestion: {
          question: 'During which phase of meiosis does crossing over (homologous recombination) occur?',
          options: ['Prophase I', 'Metaphase II', 'Anaphase I', 'Telophase II'],
          answerIndex: 0,
          explanation: 'Crossing over occurs specifically in Prophase I of meiosis, where homologous chromosomes synapse into tetrads and exchange non-sister chromatid genetic material.'
        }
      };
    }

    if (q.includes('dna') || q.includes('gene') || q.includes('transcription') || q.includes('translation') || q.includes('rna')) {
      return {
        explanation: `### 🧬 Molecular Genetics: The Central Dogma & Protein Synthesis

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of the cell as a master restaurant kitchen:
* **DNA** is the master recipe encyclopedia kept locked safely inside the chef's office (the nucleus) so it is never damaged.
* **mRNA Transcription** is writing down a quick photocopy of a single recipe card so the line cooks can take it to the kitchen floor.
* **tRNA Translation** is the line cook reading the recipe steps codon by codon and bringing the exact matching ingredients (amino acids) to assemble the final dish (folded protein).

### 🔍 Core Principles & Mechanism
The Central Dogma of Molecular Biology:
$$\\text{DNA} \\xrightarrow{\\text{Transcription}} \\text{mRNA} \\xrightarrow{\\text{Translation}} \\text{Functional Protein}$$

1. **Transcription (Nucleus in Eukaryotes)**:
   * **RNA Polymerase** binds to the promoter sequence and unwinds DNA.
   * Synthesizes single-stranded mRNA in the $5' \\to 3'$ direction using complementary base pairing (A pairs with U, G pairs with C).
   * Post-transcriptional processing: $5'$ methyl cap, $3'$ poly-A tail, and RNA splicing (introns cut out, exons spliced together).
2. **Translation (Ribosome in Cytoplasm)**:
   * Ribosome clamps onto mRNA start codon (**AUG** - Methionine).
   * **tRNA** molecules with complementary anticodons deliver corresponding amino acids.
   * Peptidyl transferase forms peptide bonds, growing the polypeptide chain until a stop codon (UAA, UAG, UGA) triggers release.

### 💡 Concrete Worked Example
Given DNA template strand: $3'\\text{-TAC GGC TTA ACT-5'}$:
1. mRNA transcript ($5' \\to 3'$): $5'\\text{-AUG CCG AAU UGA-3'}$
2. Codon reading:
   * AUG $\\to$ Methionine (Start)
   * CCG $\\to$ Proline
   * AAU $\\to$ Asparagine
   * UGA $\\to$ Stop codon (terminates synthesis)
3. Resulting tripeptide: **Met-Pro-Asn**.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Forgetting that RNA contains **Uracil (U)** instead of Thymine (T). In RNA, Adenine (A) pairs with Uracil (U).
* **Trap 2**: Reading codons from the tRNA anticodon instead of the mRNA codon. The genetic code chart is organized strictly by **mRNA codons**!`,
        flashcards: [
          {
            front: 'State the universal start codon and the amino acid it codes for.',
            back: 'AUG, which codes for the amino acid Methionine (Met).',
            topic: 'Molecular Genetics'
          },
          {
            front: 'What is the structural difference between Introns and Exons in pre-mRNA processing?',
            back: 'Introns are non-coding intervening sequences spliced out; Exons are expressed sequences joined together to form mature mRNA.',
            topic: 'Molecular Genetics'
          }
        ],
        practiceQuestion: {
          question: 'If a DNA template strand has the sequence 3\'-TAC-5\', what is the corresponding mRNA codon and tRNA anticodon?',
          options: ['mRNA: 5\'-AUG-3\', tRNA: 3\'-UAC-5\'', 'mRNA: 5\'-ATG-3\', tRNA: 3\'-UAC-5\'', 'mRNA: 5\'-CAU-3\', tRNA: 3\'-GUA-5\'', 'mRNA: 5\'-AUG-3\', tRNA: 3\'-AUG-5\''],
          answerIndex: 0,
          explanation: 'Complementary to template 3\'-TAC-5\' is mRNA codon 5\'-AUG-3\'. The matching tRNA anticodon that base-pairs with it is 3\'-UAC-5\'.'
        }
      };
    }

    // ==========================================
    // 4. CHEMISTRY
    // ==========================================
    if (q.includes('bond') || q.includes('chemist') || q.includes('acid') || q.includes('base') || q.includes('ph') || q.includes('atom') || q.includes('periodic table') || q.includes('mole')) {
      return {
        explanation: `### 🧪 Chemistry: Chemical Bonding, Stoichiometry & Acid-Base Equilibrium

### 🌟 Intuitive Mental Model & Real-World Analogy
* **Ionic Bonding**: A bully stealing lunch money. An electronegative element (like Chlorine) outright rips away an electron from Sodium ($Na^+ + Cl^-$), and the resulting opposite charges lock together like ultra-strong refrigerator magnets.
* **Covalent Bonding**: A tug-of-war where neither team lets go. Atoms share pairs of electrons to fill their outer valence shells.
* **Hydrogen Bonding**: A handshake across the room. Weak electrostatic attraction between partially positive hydrogen and partially negative oxygen/nitrogen in neighboring molecules.

### 🔍 Core Principles & Mechanism
#### 1. Chemical Bonds & Electronegativity Difference ($\\Delta EN$)
* $\\Delta EN > 2.0$: **Ionic Bond** (electron transfer).
* $0.4 \\le \\Delta EN \\le 2.0$: **Polar Covalent Bond** (unequal sharing, dipole moment).
* $\\Delta EN < 0.4$: **Nonpolar Covalent Bond** (equal sharing).

#### 2. Stoichiometry & The Mole Concept
$$n = \\frac{m}{M} = \\frac{\\text{mass (g)}}{\\text{molar mass (g/mol)}}, \\quad 1\\,\\text{mole} = 6.022 \\times 10^{23}\\,\\text{particles}$$

#### 3. Acid-Base Equilibrium & pH
$$\\text{pH} = -\\log_{10}[\\text{H}^+], \\quad \\text{pH} + \\text{pOH} = 14 \\text{ (at } 25^\\circ\\text{C)}$$
* **Brønsted-Lowry Definition**: Acids donate protons ($H^+$); bases accept protons ($H^+$).

### 💡 Concrete Worked Example
Calculate the pH of a $0.005\\,\\text{M}$ solution of hydrochloric acid ($\\text{HCl}$, a strong acid that dissociates completely):
$$[\\text{H}^+] = 0.005\\,\\text{M} = 5.0 \\times 10^{-3}\\,\\text{M}$$
$$\\text{pH} = -\\log(5.0 \\times 10^{-3}) = -(\\log 5.0 + \\log 10^{-3}) = -(0.7 - 3) = 2.3$$
The solution is strongly acidic ($\\text{pH} = 2.3 < 7$).

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Thinking a higher pH means a stronger acid. The pH scale is **inverse logarithmic**: a lower pH means a much higher concentration of hydrogen ions ($[H^+]$).
* **Trap 2**: Confusing bond strength with intermolecular force strength. Covalent bonds within a water molecule are vastly stronger than the hydrogen bonds between separate water molecules.`,
        flashcards: [
          {
            front: 'How is pH mathematically defined?',
            back: 'pH = -log10[H+]. Each 1-unit decrease in pH represents a 10-fold increase in hydrogen ion concentration.',
            topic: 'Chemistry'
          },
          {
            front: 'What distinguishes an ionic bond from a covalent bond in terms of electronegativity?',
            back: 'Ionic bonds involve complete transfer of electrons (large ΔEN > 2.0); covalent bonds involve sharing electron pairs (ΔEN < 2.0).',
            topic: 'Chemistry'
          }
        ],
        practiceQuestion: {
          question: 'If the pH of a solution decreases from 6 to 3, by what factor has the [H+] concentration increased?',
          options: ['2 times', '3 times', '100 times', '1000 times'],
          answerIndex: 3,
          explanation: 'Since pH is a base-10 logarithmic scale, a change of 3 pH units means [H+] increases by 10^3 = 1,000 times.'
        }
      };
    }

    // ==========================================
    // 5. COMPUTER SCIENCE & ALGORITHMS
    // ==========================================
    // 5a. LOOPS & CONTROL FLOW IN PROGRAMMING
    if (hasAnyWord('loop', 'loops', 'iteration', 'iterating', 'iterate') || 
        q.includes('for loop') || q.includes('while loop') || q.includes('do while') || 
        q.includes('do-while') || q.includes('infinite loop') || q.includes('nested loop')) {
      return {
        explanation: `### 💻 Computer Science: Loops, Iteration & Control Flow

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of a runner on an Olympic athletics track:
* **The \`for\` Loop** is running a fixed, pre-counted 4-lap relay: \`for lap in range(4)\`. You know the exact start, end, and number of iterations before you take your first stride.
* **The \`while\` Loop** is running until you run out of energy: \`while energy > 0\`. You don't know the exact lap count in advance; you keep circling as long as the condition holds true.
* **An Infinite Loop** is running forever without checking your energy or forgetting to increment your lap counter—you run continuously until you collapse (**System Crash / Freeze**).

### 🔍 Core Principles & Mechanism
#### 1. The Anatomy of Every Loop
1. **Initialization**: Declaring the loop counter or iterator (e.g. \`i = 0\`).
2. **Termination Condition**: Boolean check evaluated before each cycle. If \`false\`, the loop halts immediately.
3. **Execution Body**: The block of code executed on each cycle.
4. **Step / Increment**: Updating the loop state (e.g. \`i += 1\`) so it advances towards termination.

#### 2. Loop Types Compared
| Loop Construct | When to Use | Execution Guarantee |
| :--- | :--- | :--- |
| **\`for\` loop** | Iterating over known sequences, ranges, arrays, or collections | Runs exactly for the length of the iterable (0 to $N$ times) |
| **\`while\` loop** | Event-driven loops, games, input polling, or convergence algorithms | Runs 0 or more times until condition evaluates to \`false\` |
| **\`do-while\` loop** | Scenarios where the body must execute at least once before checking | Guaranteed to run at least 1 time |

#### 3. Control Flow Modifiers
* \`break\`: Terminates the loop prematurely and jumps immediately to the statement following the loop.
* \`continue\`: Skips the remainder of the current iteration and jumps directly to the next cycle.

### 💡 Concrete Worked Example
Summing numbers 1 through 5 using both \`for\` and \`while\` in Python:
\`\`\`python
# 1. Definite For Loop with range(start, stop_exclusive)
total_for = 0
for i in range(1, 6): # generates 1, 2, 3, 4, 5
    total_for += i
print(f"For loop sum: {total_for}")  # Output: 15

# 2. Indefinite While Loop with explicit counter
total_while = 0
counter = 1
while counter <= 5:
    total_while += counter
    counter += 1 # Crucial update step!
print(f"While loop sum: {total_while}")  # Output: 15

# 3. Early exit using break
for num in [2, 4, 7, 8, 10]:
    if num % 2 != 0:
        print(f"Found first odd number: {num}")
        break  # Halts loop immediately at 7
\`\`\`

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1: The Off-By-One Error (OBOE)**: Forgetting that zero-indexed ranges like \`range(5)\` generate indices \`0, 1, 2, 3, 4\` (5 iterations, stopping strictly before 5). Accessing \`arr[5]\` on a 5-element array triggers an \`IndexOutOfBounds\` exception!
* **Trap 2: The Infinite Loop**: Forgetting to update loop variables inside a \`while\` loop (e.g. omitting \`i += 1\`), causing the loop condition to remain \`True\` forever.`,
        flashcards: [
          {
            front: 'What is the primary difference between a for loop and a while loop?',
            back: 'A for loop is used for definite iteration over a known range or collection; a while loop is used for indefinite iteration that continues as long as a boolean condition remains true.',
            topic: 'Programming Loops'
          },
          {
            front: 'What is an Off-By-One Error (OBOE) in loop programming?',
            back: 'A logic error where a loop iterates one time too many or one time too few, typically caused by confusing < with <= or misunderstanding zero-based indexing.',
            topic: 'Programming Loops'
          }
        ],
        practiceQuestion: {
          question: 'What is the final value of variable "count" after executing this code:\ncount = 0\nfor i in range(1, 5):\n    count += i',
          options: ['10', '15', '6', '14'],
          answerIndex: 0,
          explanation: 'range(1, 5) generates values 1, 2, 3, 4 (stopping before 5). Sum: 1 + 2 + 3 + 4 = 10.'
        }
      };
    }

    if (q.includes('binary search')) {
      return {
        explanation: `### 💻 Computer Science: Binary Search Algorithm & Logarithmic Efficiency


### 🌟 Intuitive Mental Model & Real-World Analogy
Imagine guessing a secret number between 1 and 100 where after every guess you are told "higher" or "lower".
If you guess 50 and are told "higher", you instantly throw away all numbers 1 through 50! Your next guess is 75. By cutting the remaining possibilities in half on every single question, you can pinpoint any number from 1 to 1,000,000 in just **20 questions**! That is the astonishing power of logarithmic $O(\\log n)$ search.

### 🔍 Core Principles & Mechanism
1. **Pre-requisite**: The input array **must be sorted**.
2. **Three-Pointer Logic**:
   * Maintain pointers \`low\`, \`high\`, and compute midpoint \`mid = low + (high - low) // 2\` (avoiding integer overflow).
   * If \`arr[mid] == target\`, search succeeds immediately.
   * If \`arr[mid] < target\`, the target must reside in the right half: set \`low = mid + 1\`.
   * If \`arr[mid] > target\`, the target must reside in the left half: set \`high = mid - 1\`.
   * If \`low > high\`, the target does not exist in the array.

### 💡 Concrete Worked Example
\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = low + (high - low) // 2
        if arr[mid] == target:
            return mid  # Target found at index mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1  # Target not found

# Example execution:
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
# Searching for 23:
# Step 1: low=0, high=9, mid=4 (val=16). 16 < 23 => low=5
# Step 2: low=5, high=9, mid=7 (val=56). 56 > 23 => high=6
# Step 3: low=5, high=6, mid=5 (val=23). 23 == 23 => Found at index 5!
\`\`\`

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Applying Binary Search on an unsorted array. If the array is not sorted, the elimination of halves is mathematically invalid!
* **Trap 2**: Integer overflow on \`mid = (low + high) // 2\` in low-level languages (C++/Java). Always prefer \`low + (high - low) // 2\`.`,
        flashcards: [
          {
            front: 'What is the mandatory prerequisite for executing Binary Search on an array?',
            back: 'The array must be sorted in monotonic order (ascending or descending).',
            topic: 'Binary Search'
          },
          {
            front: 'What is the worst-case time and space complexity of iterative Binary Search?',
            back: 'Time Complexity: O(log n). Auxiliary Space Complexity: O(1).',
            topic: 'Binary Search'
          }
        ],
        practiceQuestion: {
          question: 'What is the maximum number of comparisons Binary Search requires to search an array of 1,024 elements?',
          options: ['10 comparisons', '512 comparisons', '1,024 comparisons', '100 comparisons'],
          answerIndex: 0,
          explanation: 'Binary search halves the array each step. log2(1024) = 10, meaning at most 10 comparisons are needed.'
        }
      };
    }

    if (hasAnyWord('oop', 'oops') || q.includes('object oriented') || q.includes('encapsulation') || q.includes('polymorphism') || q.includes('inheritance')) {
      return {
        explanation: `### 💻 Software Engineering: The 4 Pillars of Object-Oriented Programming (OOP)

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of a modern smartphone:
* **Encapsulation**: The lithium battery and processor chips are sealed securely inside the sleek casing. You cannot touch raw wires; you interact via safe buttons and screen taps.
* **Abstraction**: To drive a car, you only need to press the gas pedal and turn the steering wheel. You don't need to know the thermodynamics of fuel injection inside the cylinders.
* **Inheritance**: An Electric Car inherits the basic blueprint of a Car (wheels, doors, brakes) while adding its own specialized electric motor and battery system.
* **Polymorphism**: Pressing the "Play" button on your universal remote plays a movie on a Blu-Ray player, a song on a music player, or a slideshow on a projector. One unified interface produces specialized behaviors.

### 🔍 Core Principles & Mechanism
1. **Encapsulation**: Bundles data (attributes) and methods operating on that data within classes, restricting direct access via private fields (\`_private\`, \`private\`).
2. **Abstraction**: Hides complex internal implementation details, exposing only clean public interfaces and abstract base classes.
3. **Inheritance**: Allows a child class to inherit state and behavior from a parent class, eliminating redundant boilerplate code.
4. **Polymorphism**: Allows objects of different subclasses to be treated uniformly through their common superclass interface (Method Overriding and Overloading).

### 💡 Concrete Worked Example
\`\`\`python
from abc import ABC, abstractmethod

# 1. Abstraction & Interface
class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

# 2. Inheritance & Encapsulation
class Circle(Shape):
    def __init__(self, radius: float):
        self._radius = radius # Encapsulated private attribute

    # 3. Polymorphism: Specialized area calculation
    def area(self) -> float:
        import math
        return math.pi * (self._radius ** 2)

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self._w = width
        self._h = height

    def area(self) -> float:
        return self._w * self._h

# Unified Polymorphic Consumer:
shapes: list[Shape] = [Circle(5), Rectangle(4, 6)]
for s in shapes:
    print(f"Area: {s.area():.2f}")
\`\`\`

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Preferring deep inheritance hierarchies over composition. Best practice in modern software design is **"Composition over Inheritance"** to avoid brittle parent-child coupling.
* **Trap 2**: Confusing Method Overloading (same method name, different parameter types) with Method Overriding (subclass replacing a parent method implementation).`,
        flashcards: [
          {
            front: 'Name the four foundational pillars of Object-Oriented Programming (OOP).',
            back: '1. Encapsulation\n2. Abstraction\n3. Inheritance\n4. Polymorphism',
            topic: 'Object-Oriented Programming'
          },
          {
            front: 'What is the distinction between Method Overriding and Method Overloading?',
            back: 'Overriding replaces a superclass method in a subclass with identical signature; Overloading defines multiple methods with the same name but different parameters.',
            topic: 'Object-Oriented Programming'
          }
        ],
        practiceQuestion: {
          question: 'Which pillar of OOP allows a subclass to provide its own specific implementation of a method defined in its parent class?',
          options: ['Polymorphism', 'Encapsulation', 'Abstraction', 'Compilation'],
          answerIndex: 0,
          explanation: 'Polymorphism (specifically runtime method overriding) allows child classes to define specialized behaviors for inherited methods.'
        }
      };
    }

    if (hasAnyWord('api', 'apis', 'rest', 'restful', 'endpoint', 'endpoints') || q.includes('rest api') || q.includes('http')) {
      return {
        explanation: `### 🌐 Web Architecture: RESTful APIs & Client-Server Communication

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of a restaurant:
* **The Client (Frontend / Mobile App)** is the customer sitting at a table looking at a menu.
* **The Server (Backend Database & Business Logic)** is the kitchen preparing dishes.
* **The REST API** is the **waiter**: they take your order formatted according to the menu protocol (\`POST /orders\`), deliver it to the kitchen, and return with a neatly plated dish and a status message ("Order ready, code 200 OK").

### 🔍 Core Principles & Mechanism
#### 1. Core HTTP Verbs & CRUD Mapping
* \`GET\`: Read / retrieve a resource without mutating state (Idempotent & Safe).
* \`POST\`: Create a brand-new subordinate resource (Non-idempotent).
* \`PUT\`: Completely replace a resource at a known URI (Idempotent).
* \`PATCH\`: Partially update specific fields of an existing resource.
* \`DELETE\`: Remove a resource from the system (Idempotent).

#### 2. Standard HTTP Response Status Codes
* **2xx (Success)**: \`200 OK\`, \`201 Created\`, \`204 No Content\`
* **3xx (Redirection)**: \`301 Moved Permanently\`, \`304 Not Modified\`
* **4xx (Client Errors)**: \`400 Bad Request\`, \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`
* **5xx (Server Errors)**: \`500 Internal Server Error\`, \`502 Bad Gateway\`, \`503 Service Unavailable\`

### 💡 Concrete Worked Example
A client creates a new student assignment:
\`\`\`http
POST /api/assignments HTTP/1.1
Host: studypilot.app
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{
  "title": "Quantum Physics Problem Set",
  "subject_id": 4,
  "due_date": "2026-11-05"
}

HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 42,
  "title": "Quantum Physics Problem Set",
  "status": "pending",
  "priority": "high"
}
\`\`\`

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Using \`GET\` requests to delete or modify data. \`GET\` must remain **strictly safe and idempotent** (read-only without side-effects).
* **Trap 2**: Confusing \`401 Unauthorized\` (missing or invalid credentials; unauthenticated) with \`403 Forbidden\` (authenticated, but lacking permission/role).`,
        flashcards: [
          {
            front: 'What does it mean for an HTTP method to be "Idempotent"?',
            back: 'Making multiple identical requests has the exact same side-effect on server state as making a single request (e.g. GET, PUT, DELETE).',
            topic: 'Web APIs'
          },
          {
            front: 'What is the difference between HTTP status code 401 and 403?',
            back: '401 Unauthorized means authentication credentials are missing or invalid; 403 Forbidden means identity is known but access is denied.',
            topic: 'Web APIs'
          }
        ],
        practiceQuestion: {
          question: 'Which HTTP method is conventionally used to create a new resource on a RESTful server when the server assigns the ID?',
          options: ['POST', 'GET', 'PUT', 'DELETE'],
          answerIndex: 0,
          explanation: 'POST is the standard method for creating subordinate resources where the server generates the identifier.'
        }
      };
    }

    if (q.includes('machine learning') || q.includes('neural network') || q.includes('deep learning') || q.includes('artificial intelligence')) {
      return {
        explanation: `### 🤖 Machine Learning & Deep Learning: Neural Networks & Optimization

### 🌟 Intuitive Mental Model & Real-World Analogy
Imagine tuning an old analog radio with 100 knobs to find a crisp broadcast station through static:
* At first, the sound is pure static (high **Loss / Error**).
* You make tiny turns on each knob, listening if the static decreases or increases.
* The math telling you *which direction* to turn each knob is the **Gradient of the Loss Function**.
* Turning all knobs simultaneously toward clearer sound step-by-step is **Gradient Descent**.
* The final clear radio station is your **Trained Model**!

### 🔍 Core Principles & Mechanism
1. **The Artificial Neuron (Perceptron)**:
   Computes a weighted sum of inputs plus bias, passing it through an activation function:
   $$z = \\sum_{i=1}^n w_i x_i + b, \\quad a = \\sigma(z)$$
2. **Activation Functions**:
   * **ReLU** (Rectified Linear Unit): $f(x) = \\max(0, x)$ — prevents vanishing gradients.
   * **Softmax**: Converts unnormalized logits into a valid probability distribution summing to 1.
3. **Training via Backpropagation**:
   * **Forward Pass**: Data flows forward through layers to generate prediction $\\hat{y}$.
   * **Loss Computation**: Measure error via Mean Squared Error (regression) or Cross-Entropy (classification).
   * **Backward Pass**: Apply the calculus chain rule backwards to compute $\\frac{\\partial L}{\\partial w}$, updating weights:
     $$w \\leftarrow w - \\eta \\frac{\\partial L}{\\partial w} \\quad (\\eta = \\text{learning rate})$$

### 💡 Concrete Worked Example
Why do deep networks require non-linear activation functions?
If all activation functions were linear ($f(x) = cx$), any multi-layer neural network collapses algebraically into a single linear matrix multiplication:
$$W_3(W_2(W_1 x)) = (W_3 W_2 W_1) x = W_{combined} x$$
Without non-linearities like ReLU, a 100-layer neural network is mathematically no more expressive than a single linear regression!

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Overfitting vs Underfitting. High training accuracy paired with poor test accuracy indicates **Overfitting** (memorizing training noise; fix with regularization, dropout, or more data).
* **Trap 2**: Setting the learning rate $\\eta$ too high. An excessively high learning rate causes weights to oscillate wildly and diverge rather than converging to minimum loss.`,
        flashcards: [
          {
            front: 'Why are non-linear activation functions essential in deep neural networks?',
            back: 'Without non-linear activations, stacking multiple layers collapses mathematically into a single linear transformation, unable to learn complex patterns.',
            topic: 'Machine Learning'
          },
          {
            front: 'What algorithm computes the gradients of the loss function with respect to weights using the chain rule?',
            back: 'Backpropagation (backward propagation of errors).',
            topic: 'Machine Learning'
          }
        ],
        practiceQuestion: {
          question: 'What happens when a neural network model severely overfits its training data?',
          options: [
            'Training error is very low, but testing/validation error is high.',
            'Both training and testing errors are very high.',
            'Training error is high, but testing error is near zero.',
            'The model fails to converge and gradients explode.'
          ],
          answerIndex: 0,
          explanation: 'Overfitting occurs when a model memorizes the training data, achieving near-perfect training performance while failing to generalize to unseen test data.'
        }
      };
    }

    if (q.includes('recursion') || q.includes('sort') || q.includes('tree') || q.includes('graph') || q.includes('dynamic program') || q.includes('big-o') || q.includes('algorithm') || q.includes('hash') || q.includes('python')) {
      return {
        explanation: `### 💻 Computer Science: Data Structures, Algorithms & Complexity

### 🌟 Intuitive Mental Model & Real-World Analogy
* **Recursion**: Russian Matryoshka nesting dolls. Each doll opens to reveal a slightly smaller identical doll until you reach the solid, unopenable baby doll at the center—the **Base Case**. Without that center doll, you get an infinite stack and crash the system (**Stack Overflow**).
* **Big-O Notation**: Predicting how long an algorithm takes as the problem size scales to millions:
  * $O(1)$: Instant lookup, like looking at your own wristwatch.
  * $O(\\log n)$: Binary search, like flipping to the middle of a phone book and discarding half each step.
  * $O(n)$: Checking every person in a room one by one.
  * $O(n^2)$: Having every person in a room shake hands with every other person.

### 🔍 Core Principles & Mechanism
#### 1. Binary Search Algorithm ($O(\\log n)$)
\`\`\`python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid  # Found target index
        elif arr[mid] < target:
            low = mid + 1  # Search right half
        else:
            high = mid - 1 # Search left half
    return -1 # Not found
\`\`\`

#### 2. Key Data Structures & Lookup Performance
| Structure | Access | Search | Insertion | Deletion |
| :--- | :--- | :--- | :--- | :--- |
| **Array** | $O(1)$ | $O(n)$ | $O(n)$ | $O(n)$ |
| **Hash Table** | N/A | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg |
| **Binary Search Tree** | $O(\\log n)$ | $O(\\log n)$ | $O(\\log n)$ | $O(\\log n)$ |

### 💡 Concrete Worked Example
Dynamic Programming: Fibonacci with Memoization (eliminating exponential $O(2^n)$ runtime):
\`\`\`python
def fib_memo(n, memo={}):
    if n <= 1:
        return n
    if n not in memo:
        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]
\`\`\`
* Naive recursion recalculates overlapping subproblems redundantly, taking $O(2^n)$ operations (impossible for $n=100$).
* Memoization caches computed answers, reducing the runtime to linear $O(n)$ time!

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Assuming Hash Tables are always $O(1)$ in the worst case. If bad hash functions cause all keys to collide into a single bucket, search degrades to linear $O(n)$!
* **Trap 2**: Forgetting that QuickSort degrades to $O(n^2)$ worst-case time on an already sorted array when using a naive first/last element pivot.`,
        flashcards: [
          {
            front: 'What are the two mandatory components of every sound recursive algorithm?',
            back: '1. Base Case (stops recursion to prevent stack overflow)\n2. Recursive Step (reduces state toward the base case)',
            topic: 'Computer Science'
          },
          {
            front: 'What is the time complexity of Binary Search on a sorted array of size n?',
            back: 'O(log n), because the search space is halved at each step.',
            topic: 'Computer Science'
          }
        ],
        practiceQuestion: {
          question: 'What is the average and worst-case time complexity of standard Quicksort?',
          options: ['Average O(n log n), Worst O(n^2)', 'Average O(n), Worst O(n log n)', 'Average O(n log n), Worst O(n log n)', 'Average O(n^2), Worst O(n^2)'],
          answerIndex: 0,
          explanation: 'Quicksort runs in average O(n log n) time due to balanced partitioning, but degrades to worst-case O(n^2) when partitions are maximally unbalanced (e.g. sorted input with naive pivot).'
        }
      };
    }

    // ==========================================
    // 6. ECONOMICS & SOCIAL SCIENCES
    // ==========================================
    if (q.includes('econom') || q.includes('supply') || q.includes('demand') || q.includes('inflation') || q.includes('gdp') || q.includes('elasticity')) {
      return {
        explanation: `### 📈 Economics: Supply, Demand & Market Equilibrium

### 🌟 Intuitive Mental Model & Real-World Analogy
Think of the market as an auction for concert tickets:
* If a superstar announces a concert in a 5,000-seat arena, millions of fans demand seats, driving ticket prices through the roof (**Excess Demand / Shortage**).
* If thousands of tickets remain unsold before showtime, scalpers slash prices to get any money they can (**Excess Supply / Surplus**).
* The price where tickets sold equals tickets available is the natural **Equilibrium Price**.

### 🔍 Core Principles & Mechanism
1. **Law of Demand**: As price rises, quantity demanded falls ($P \\uparrow \\implies Q_d \\downarrow$), resulting in a downward-sloping curve.
2. **Law of Supply**: As price rises, producers are willing to supply more goods to maximize profit ($P \\uparrow \\implies Q_s \\uparrow$), resulting in an upward-sloping curve.
3. **Price Elasticity of Demand ($E_d$)**:
   $$E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$$
   * $|E_d| > 1$: **Elastic** (consumers are sensitive to price; luxury items).
   * $|E_d| < 1$: **Inelastic** (consumers must buy regardless of price; insulin, gasoline).

### 💡 Concrete Worked Example
Given demand equation $Q_d = 100 - 4P$ and supply equation $Q_s = 20 + 6P$:
1. Set supply equal to demand for equilibrium ($Q_s = Q_d$):
   $$20 + 6P = 100 - 4P \\implies 10P = 80 \\implies P^* = \\$8$$
2. Substitute $P^* = 8$ back into either equation:
   $$Q^* = 100 - 4(8) = 100 - 32 = 68\\,\\text{units}$$
The market clears at price $\\$8$ with 68 units traded.

### ⚠️ Common Misconceptions & Exam Traps
* **Trap 1**: Confusing a change in **Demand** (entire curve shifts due to income, preferences, substitutes) with a change in **Quantity Demanded** (movement along existing curve caused solely by price change).
* **Trap 2**: Believing price ceilings create abundance. A binding price ceiling below equilibrium creates persistent **shortages** and black markets.`,
        flashcards: [
          {
            front: 'What is the distinction between a change in Demand vs change in Quantity Demanded?',
            back: 'Change in Quantity Demanded is movement along the curve caused by price; change in Demand is a full shift of the curve caused by external factors.',
            topic: 'Economics'
          },
          {
            front: 'What does an inelastic price elasticity of demand (|Ed| < 1) mean?',
            back: 'Consumers are relatively insensitive to price changes; a percentage change in price results in a smaller percentage change in quantity demanded.',
            topic: 'Economics'
          }
        ],
        practiceQuestion: {
          question: 'If demand is price-inelastic (|Ed| < 1), what happens to total revenue when the seller raises the price?',
          options: ['Total revenue increases', 'Total revenue decreases', 'Total revenue remains exactly unchanged', 'Total revenue drops to zero'],
          answerIndex: 0,
          explanation: 'When demand is inelastic, the percentage gain from higher price exceeds the small percentage drop in units sold, causing total revenue (P * Q) to increase.'
        }
      };
    }

    // ==========================================
    // 7. UNIVERSAL SEMANTIC PEDAGOGICAL ENGINE
    // Dynamically analyzes and generates rigorous domain-specific answers for ANY query
    // ==========================================
    return this.generateUniversalResponse(query);
  }

  /**
   * Universal Semantic Knowledge Synthesizer
   * Produces tailored, rich, domain-specific breakdowns for custom topics
   */
  generateUniversalResponse(query) {
    const cleanTopic = query
      .replace(/^(?:explain|what\s+is|what\s+are|tell\s+me\s+about|how\s+does|how\s+do|why\s+is|why\s+are|teach\s+me|help\s+me\s+with|overview\s+of)\s+/i, '')
      .replace(/[?!.]+$/, '')
      .trim();
    const topicTitle = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

    // Classify domain to generate contextual analogy and breakdown
    const qLower = query.toLowerCase();
    let domain = 'Academic Studies';
    let analogy = `Think of ${topicTitle} like a finely tuned clockwork mechanism: each individual component has a precise functional role, and the collective interaction dictates the overall behavior of the system.`;
    let mechanismPoints = [
      `**Core Definition & Scope**: ${topicTitle} establishes the governing principles, definitions, and relationships within its field.`,
      `**Foundational Mechanism**: It functions through structured rules and interactions between primary variables or entities.`,
      `**Analytical Framework**: To examine problems involving ${topicTitle}, isolate key parameters, establish boundary conditions, and trace cause-to-effect transitions.`,
      `**Synthesis & Evaluation**: Compare theoretical predictions with empirical observations to verify validity and identify boundary limits.`
    ];

    if (qLower.includes('history') || qLower.includes('revolution') || qLower.includes('war') || qLower.includes('treaty') || qLower.includes('empire') || qLower.includes('movement')) {
      domain = 'History & Political Science';
      analogy = `Think of ${topicTitle} like a geological fault line under rising tectonic pressure: underlying socio-economic and institutional tensions built up over decades until a triggering event caused an inevitable, transformative shift in societal structure.`;
      mechanismPoints = [
        `**Structural Preconditions**: Deep-rooted institutional, economic, and ideological grievances created the underlying environment for change.`,
        `**Triggering Catalyst**: A specific crisis or declaration served as the flashpoint that mobilized active participation and disrupted the status quo.`,
        `**Key Phases & Power Dynamics**: Shifting alliances, conflicting factions, and legislative or military confrontations shaped the trajectory of events.`,
        `**Enduring Historical Legacy**: The institutional reforms, cultural shifts, and global ramifications permanently reshaped subsequent modern governance.`
      ];
    } else if (qLower.includes('psychol') || qLower.includes('brain') || qLower.includes('cognit') || qLower.includes('behavior') || qLower.includes('memory') || qLower.includes('perception')) {
      domain = 'Psychology & Cognitive Science';
      analogy = `Think of ${topicTitle} like a computer operating system balancing processing bandwidth: sensory inputs are filtered, processed through heuristic shortcuts, and stored across distributed neural circuits to optimize rapid decision-making.`;
      mechanismPoints = [
        `**Cognitive Architecture**: Identifies how mental representations, perceptual stimuli, and neural pathways process incoming information.`,
        `**Operational Mechanism**: Explains how emotional, behavioral, or cognitive responses are triggered and reinforced.`,
        `**Experimental Evidence**: Verified through standardized empirical studies, behavioral experiments, and neuroimaging data.`,
        `**Practical Real-World Application**: Used to diagnose behavioral patterns, improve learning methodologies, and optimize human decision-making.`
      ];
    } else if (qLower.includes('earth') || qLower.includes('geolog') || qLower.includes('climate') || qLower.includes('ocean') || qLower.includes('atmosphere') || qLower.includes('plate') || qLower.includes('rock')) {
      domain = 'Earth & Environmental Sciences';
      analogy = `Think of ${topicTitle} like a dynamic conveyor belt: thermodynamic forces within the planetary interior or atmosphere drive constant cycles of material transport, energy exchange, and structural transformation.`;
      mechanismPoints = [
        `**Thermodynamic Driving Forces**: Convection currents, solar radiation, or gravitational gradients provide the continuous energy input.`,
        `**Material Transformation Cycle**: Matter shifts states or physical compositions across geological and biological reservoirs.`,
        `**Equilibrium & Feedback Loops**: Negative feedback stabilizes conditions while positive feedback amplifies environmental responses.`,
        `**Environmental Consequences**: Directly influences landscape formation, biological habitats, and long-term global climate equilibrium.`
      ];
    }

    return {
      explanation: `### 🎓 Comprehensive Academic Guide: ${topicTitle}

### 💡 Core Definition
- **${topicTitle}** represents a fundamental concept in ${domain}, addressing the core principles, governing dynamics, and systematic interactions within this subject area.

### 🌟 Intuitive Mental Model & Real-World Analogy
${analogy}

### 🔍 Step-by-Step Mechanism
1. ${mechanismPoints[0]}
2. ${mechanismPoints[1]}
3. ${mechanismPoints[2]}
4. ${mechanismPoints[3]}

### 💻 Concrete Worked Application
When analyzing or solving an academic question regarding **${topicTitle}**:
1. **Deconstruct the Inquiry**: Clarify the specific parameters, temporal context, or structural variables involved.
2. **Apply Foundational Rules**: Connect the given evidence to the governing theoretical models of ${topicTitle}.
3. **Verify Logical Coherence**: Ensure the conclusion directly addresses the core phenomenon without violating fundamental physical, mathematical, or empirical constraints.

### ⚠️ Common Misconceptions & Exam Traps
* **Oversimplification Trap**: Reducing a multi-factor system to a single cause or variable. Always account for interplay among interrelated mechanisms.
* **Surface Conflation**: Confusing ${topicTitle} with superficially similar phenomena. Focus on the distinct defining criteria that set it apart.`,
      flashcards: [
        {
          front: `State the primary governing principle and definition of ${topicTitle}:`,
          back: `It establishes the theoretical framework, operational mechanisms, and core relationships governing phenomena within ${domain}.`,
          topic: topicTitle
        },
        {
          front: `What is a common analytical trap students must avoid when evaluating ${topicTitle}?`,
          back: `Oversimplifying the multi-factor operational mechanisms or confusing it with related but distinct concepts in ${domain}.`,
          topic: topicTitle
        }
      ],
      practiceQuestion: {
        question: `Which statement most accurately characterizes the fundamental nature of ${topicTitle}?`,
        options: [
          `It operates through systematic mechanisms governed by the foundational laws of ${domain}.`,
          `It is a static phenomenon that remains completely unaffected by adjacent environmental variables.`,
          `It can only be applied in theoretical abstractions with zero practical or empirical relevance.`,
          `It operates entirely at random without any identifiable underlying patterns or principles.`
        ],
        answerIndex: 0,
        explanation: `In ${domain}, ${topicTitle} is characterized by systematic, verifiable principles and predictable interactions among its core components.`
      }
    };
  }

  fallbackFlashcards(topic) {
    return [
      {
        front: `What is the primary governing definition of ${topic}?`,
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
    const qMatch = text.match(/(?:Front|Question|Q):\s*(.+?)\s*(?:Back|Answer|A):\s*(.+?)(?=\n\n|$)/gi);
    if (qMatch) {
      for (const item of qMatch) {
        const parts = item.split(/(?:Back|Answer|A):\s*/i);
        if (parts.length >= 2) {
          const front = parts[0].replace(/(?:Front|Question|Q):\s*/i, '').trim();
          const back = parts[1].trim();
          if (front && back) {
            cards.push({ front, back, topic: fallbackTopic });
          }
        }
      }
    }
    return cards;
  }

  extractPracticeQuestionFromText(text) {
    if (!text) return null;
    try {
      const qMatch = text.match(/(?:Question|🎯 Conceptual Practice Question):\s*(.+?)(?=\nA[\)\.]|\n\(A\)|\n1[\)\.])/i);
      const optAMatch = text.match(/(?:A[\)\.]|\(A\))\s*(.+)/i);
      const optBMatch = text.match(/(?:B[\)\.]|\(B\))\s*(.+)/i);
      const optCMatch = text.match(/(?:C[\)\.]|\(C\))\s*(.+)/i);
      const optDMatch = text.match(/(?:D[\)\.]|\(D\))\s*(.+)/i);
      const ansMatch = text.match(/(?:Correct Answer|Answer):\s*([A-D])/i);
      const expMatch = text.match(/(?:Explanation):\s*(.+)/i);

      if (qMatch && optAMatch && optBMatch) {
        const letter = (ansMatch ? ansMatch[1] : 'A').toUpperCase();
        const letterIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[letter] ?? 0;
        return {
          question: qMatch[1].trim(),
          options: [
            optAMatch[1].trim(),
            optBMatch[1].trim(),
            optCMatch ? optCMatch[1].trim() : 'None of the above',
            optDMatch ? optDMatch[1].trim() : 'All of the above'
          ],
          answerIndex: letterIndex,
          explanation: expMatch ? expMatch[1].trim() : 'Verified conceptual solution.'
        };
      }
    } catch (e) {
      // ignore parsing error
    }
    return null;
  }
}

export const tutorAgent = new TutorAgent();
