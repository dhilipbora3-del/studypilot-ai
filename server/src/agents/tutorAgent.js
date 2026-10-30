import { callLLM } from './llmClient.js';

/**
 * AI Tutor Agent (Master Academic Engine)
 * Role: Explains concepts with intuitive analogies, rigorous breakdowns,
 * concrete worked examples, active recall flashcards, and conceptual practice questions.
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
Start your explanation with a header: "### ${headerEmoji}: [Concept Name]".

When explaining any topic, structure your response as follows:
### 🌟 Intuitive Mental Model & Real-World Analogy
- Begin with a vivid, relatable real-world analogy that makes the concept click instantly.
- Explain the formal definition in clear, engaging language.

### 🔍 Core Principles & Mechanism
- Break down the underlying mechanism or theory step-by-step.
- Present key equations, mathematical relationships, or code snippets with clear explanation of each variable/parameter.

### 💡 Concrete Worked Example
- Walk through a concrete numerical, code, or conceptual problem step-by-step with clear reasoning.

### ⚠️ Common Misconceptions & Exam Traps
- Highlight 2 specific mistakes or pitfalls students frequently make on exams and how to avoid them.

### 🃏 Active Recall Study Flashcards
Front: [High-yield conceptual question]
Back: [Precise, complete explanation]

Front: [Key equation, rule, or principle question]
Back: [Precise, complete explanation]

### 🎯 Conceptual Practice Question
Question: [Multiple choice question testing conceptual depth]
A) [Choice 1]
B) [Choice 2]
C) [Choice 3]
D) [Choice 4]
Correct Answer: [Correct choice]
Explanation: [Detailed reason why it is correct and why other choices are wrong]`;

    const userPrompt = `Topic or Question: "${studentQuery}"
Student Context: ${JSON.stringify(context.studentContext || {})}`;

    const llmResult = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      apiKey: context.apiKey,
      provider: context.provider,
      model: context.model
    });

    let explanation;
    let flashcards = [];
    let practiceQuestion = null;
    let provider = llmResult.provider;

    if (llmResult.success && llmResult.content) {
      explanation = llmResult.content;
      flashcards = this.extractFlashcardsFromText(explanation, studentQuery);
      practiceQuestion = this.extractPracticeQuestionFromText(explanation);
      provider = `${llmResult.provider}${llmResult.model ? ` (${llmResult.model})` : ''}`;
    } else {
      // High-Yield Deep Pedagogical Engine (covers all core academic domains)
      const pedagogicalResponse = this.generateDeepTutorResponse(studentQuery, context);
      explanation = pedagogicalResponse.explanation;
      flashcards = pedagogicalResponse.flashcards;
      practiceQuestion = pedagogicalResponse.practiceQuestion;
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

  /**
   * Deep Pedagogical Knowledge Base
   * Covers all foundational disciplines: Math, Physics, Chemistry, Biology, Computer Science, Economics, Psychology
   */
  generateDeepTutorResponse(query, context) {
    const q = query.toLowerCase();

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
* **Chain Rule**: $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$ *(differentiate the outer layer, keep inside unchanged, multiply by derivative of inside)*

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

    if (q.includes('bayes') || q.includes('probability') || q.includes('statistic') || q.includes('distribution')) {
      return {
        explanation: `### 📊 Probability & Statistics: Bayes' Theorem & Conditional Reasoning

### 🌟 Intuitive Mental Model & Real-World Analogy
Imagine a medical test for a rare disease that is 99% accurate. If you test positive, what is the probability you actually have the disease? Most people intuitively say 99%, but that is false! If only 1 in 10,000 people have the disease, the vast majority of positive tests are false positives among the 9,999 healthy people.
* **Prior Belief**: What was known before new data ($P(A)$).
* **Likelihood**: How consistent is the new evidence with the hypothesis ($P(B|A)$).
* **Posterior Belief**: Your updated confidence after incorporating the evidence ($P(A|B)$).

### 🔍 Core Principles & Mechanism
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$
Expanded using the Law of Total Probability:
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B|A)P(A) + P(B|\\neg A)P(\\neg A)}$$

### 💡 Concrete Worked Example
* Prior: $P(\\text{Disease}) = 0.001$ (0.1%), so $P(\\text{Healthy}) = 0.999$.
* Sensitivity (True Positive): $P(+|\\text{Disease}) = 0.99$.
* False Positive rate: $P(+|\\text{Healthy}) = 0.05$ (5%).
Calculate $P(\\text{Disease}|+)$:
$$P(+) = (0.99 \\times 0.001) + (0.05 \\times 0.999) = 0.00099 + 0.04995 = 0.05094$$
$$P(\\text{Disease}|+) = \\frac{0.00099}{0.05094} \\approx 1.94\\%$$
Even with a positive test, there is only a ~2% chance of actually having the disease!

### ⚠️ Common Misconceptions & Exam Traps
* **Base Rate Fallacy**: Neglecting the prior probability (base rate) when evaluating evidence.
* **Confusing $P(A|B)$ with $P(B|A)$**: The probability of having a fever given you have malaria is NOT the probability of having malaria given you have a fever.`,
        flashcards: [
          {
            front: 'State Bayes\' Theorem formula.',
            back: 'P(A|B) = [P(B|A) * P(A)] / P(B). Computes updated posterior probability from prior and likelihood.',
            topic: 'Probability & Statistics'
          },
          {
            front: 'What is the Base Rate Fallacy?',
            back: 'The cognitive error of judging conditional probability while ignoring the background prevalence (prior) of an event.',
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
    if (q.includes('newton') || q.includes('force') || q.includes('mechanic') || q.includes('gravity') || q.includes('momentum') || q.includes('torque') || q.includes('friction')) {
      return {
        explanation: `### 🚀 Classical Mechanics: Newton's Laws & Dynamics

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

    if (q.includes('electric') || q.includes('circuit') || q.includes('ohm') || q.includes('magnet') || q.includes('voltage') || q.includes('current')) {
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
* **Trap 1**: Believing current gets "consumed" as it passes through a resistor. Current (charge per second) is strictly conserved; it is electrical potential energy (voltage) that drops across the load.
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

    if (q.includes('quantum') || q.includes('thermo') || q.includes('entropy') || q.includes('wave') || q.includes('photon') || q.includes('photoelectric')) {
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
* **Trap 2**: Believing entropy cannot decrease locally. A refrigerator decreases entropy inside its chamber, but only by expelling more heat outside, ensuring the total universe entropy $\\Delta S_{total} > 0$.`,
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
* **Trap 2**: Forgetting that DNA replication (S phase of interphase) occurs **only once** before Meiosis, not between Meiosis I and Meiosis II.`,
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
          explanation: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase) catalyzes the crucial initial step of fixing atmospheric CO2 into organic carbon compounds in the stroma.'
        }
      };
    }

    if (q.includes('dna') || q.includes('gene') || q.includes('transcription') || q.includes('translation') || q.includes('crispr') || q.includes('rna')) {
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
    if (q.includes('bond') || q.includes('chemist') || q.includes('acid') || q.includes('base') || q.includes('ph') || q.includes('stoichiometr') || q.includes('mole')) {
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
    if (q.includes('recursion') || q.includes('sort') || q.includes('tree') || q.includes('graph') || q.includes('dynamic program') || q.includes('big-o') || q.includes('algorithm') || q.includes('hash')) {
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
#### 1. Anatomy of Every Recursive Function
\`\`\`python
def recursive_solve(problem_state):
    # 1. Base Case: Halts execution immediately on trivial scenario
    if is_base_case(problem_state):
        return base_result
    
    # 2. Recursive Step: Decompose into strictly smaller subproblems
    subproblem = reduce_problem(problem_state)
    return combine(recursive_solve(subproblem))
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
            front: 'What is the primary difference between Memoization (top-down) and Tabulation (bottom-up) in Dynamic Programming?',
            back: 'Memoization is top-down recursion with caching; Tabulation is bottom-up iteration filling an array starting from base cases.',
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
    if (q.includes('econom') || q.includes('supply') || q.includes('demand') || q.includes('inflation') || q.includes('market') || q.includes('elasticity')) {
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
    // 7. UNIVERSAL DYNAMIC PEDAGOGICAL ANALYZER
    // (High-intelligence dynamic breakdown for ANY custom query)
    // ==========================================
    return {
      explanation: `### 🎓 Comprehensive Study Guide: ${query}

### 🌟 Intuitive Mental Model & Real-World Analogy
To master **${query}**, anchor it to a concrete mental model:
Think of this concept like an intricate system of inputs, transformations, and measurable outputs. Every discipline operates on balance: when you alter one parameter, adjacent variables adapt according to fundamental boundary laws.
* **The Core Intuition**: Rather than memorizing surface terminology, visualize what is being transferred, converted, or reasoned about.
* **The Foundation**: Identify the foundational principles that allow this phenomenon to function consistently.

### 🔍 Core Principles & Mechanism
1. **Deconstruct the Core Definitions**:
   * Identify the governing definitions and initial boundary assumptions.
   * State the primary operational mechanism that produces the characteristic behavior.
2. **Mathematical / Structural Framework**:
   * Relate cause to effect: what variables dictate the magnitude, velocity, or outcome of the process?
   * Inspect the boundary conditions where the framework holds and where edge-case assumptions break down.
3. **Step-by-Step Analytical Process**:
   * Step 1: Identify all given parameters and state what target variable or conclusion must be found.
   * Step 2: Select the governing theorem or formula that connects the known state to the target.
   * Step 3: Execute step-by-step logical substitution with consistent dimensional units.

### 💡 Concrete Worked Application
When encountering a challenging problem on **${query}**:
1. Draw a clear diagram or construct an explicit variable table.
2. Separate external environmental noise from the core operational variables.
3. Verify your final deduction against physical intuition: does the sign, magnitude, and unit dimensional order of magnitude make sense?

### ⚠️ Common Misconceptions & Exam Traps
* **Passive Familiarity Trap**: Conflating recognition with mastery. Reading notes passively creates an illusion of competence; only unguided active problem-solving builds enduring neural recall.
* **Overlooking Boundary Conditions**: Applying foundational formulas to scenarios where the underlying assumptions (e.g., linearity, equilibrium, frictionlessness) are violated.`,
      flashcards: [
        {
          front: `State the fundamental principle governing: ${query}`,
          back: `It provides the theoretical framework and operational rules required to analyze and solve problems in this topic.`,
          topic: query
        },
        {
          front: `What is the most effective active learning strategy for mastering ${query}?`,
          back: `Retrieval practice: attempting unguided problem sets and explaining the conceptual solution step-by-step from memory.`,
          topic: query
        }
      ],
      practiceQuestion: {
        question: `Which learning methodology has been scientifically proven to produce the highest long-term retention when mastering ${query}?`,
        options: ['Passive re-reading of slides', 'Spaced retrieval practice & active testing', 'Highlighting textbook paragraphs', 'Cramming immediately prior to testing'],
        answerIndex: 1,
        explanation: 'Decades of cognitive science research demonstrate that active retrieval practice spaced across intervals strengthens synaptic connections, dramatically outperforming passive review.'
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
