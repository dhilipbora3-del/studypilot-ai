import { Router } from 'express';
import { isLLMConfigured, testAPIKey } from '../agents/llmClient.js';

const router = Router();

// GET /api/agents/status - System status of the 6 agents
router.get('/status', (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const llmActive = isLLMConfigured();

  const agents = [
    {
      id: 'manager',
      name: 'Manager Agent',
      role: 'Orchestrator & Synthesizer',
      description: 'Understands student requests, delegates tasks to relevant specialized agents, passes context between them, and coordinates Review Agent validation.',
      status: 'active',
      capabilities: ['Intent Deconstruction', 'Multi-Agent Delegation', 'Context Passing', 'Result Synthesis']
    },
    {
      id: 'tutor',
      name: 'AI Tutor Agent',
      role: 'Pedagogical Explanation & Concept Mastery',
      description: 'Explains complex topics in intuitive language using real-world analogies, step-by-step examples, flashcards, and conceptual practice questions.',
      status: 'active',
      capabilities: ['Intuitive Explanations', 'Analogy Formulation', 'Flashcard Generation', 'Active Recall Practice']
    },
    {
      id: 'planner',
      name: 'Study Planner Agent',
      role: 'Schedule & Timetable Optimizer',
      description: 'Creates realistic, conflict-free daily and weekly study schedules balanced by subject confidence, upcoming deadlines, and Pomodoro rest intervals.',
      status: 'active',
      capabilities: ['Deterministic Time Allocation', 'Conflict-Free Slots', 'Cognitive Rest Scheduling', 'Spaced Study']
    },
    {
      id: 'assignment',
      name: 'Assignment Agent',
      role: 'Task Breakdown & Problem Guidance',
      description: 'Tracks assignment deadlines, computes urgency priorities, decomposes large assignments into milestones, and provides guided problem solving.',
      status: 'active',
      capabilities: ['Deadline Proximity Scoring', 'Milestone Decomposition', 'Socratic Problem Guidance', 'Progress Checklists']
    },
    {
      id: 'exam',
      name: 'Exam Agent',
      role: 'Mock Tests & Weakness Diagnostics',
      description: 'Generates comprehensive mock quizzes, evaluates answers with exact deterministic scoring, identifies weak topics, and recommends revision.',
      status: 'active',
      capabilities: ['Mock Test Generation', 'Deterministic Scoring', 'Topic Weakness Diagnostics', 'Revision Milestones']
    },
    {
      id: 'review',
      name: 'Review Agent',
      role: 'Verification & Integrity Guardian',
      description: 'Runs deterministic audits on arithmetic calculations, schedule overlaps, fatigue risks, deadline validity, and academic integrity.',
      status: 'active',
      capabilities: ['Arithmetic Math Checks', 'Collision Detection', 'Date/Deadline Sanity', 'Academic Quality Stamp']
    }
  ];

  res.json({
    success: true,
    system: {
      llmActive,
      primaryProvider: geminiConfigured ? 'Gemini 1.5/2.0 API' : (openaiConfigured ? 'OpenAI GPT-4o-mini' : 'Deep Pedagogical Engine (Safe / Offline)'),
      geminiConfigured,
      openaiConfigured,
      groqConfigured,
      offlineFallbackReady: true,
      agentsCount: agents.length
    },
    agents
  });
});

// POST /api/agents/test-key - Test user-provided Gemini/OpenAI API key
router.post('/test-key', async (req, res) => {
  try {
    const { apiKey, provider = 'gemini' } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const testRes = await testAPIKey(apiKey.trim(), provider);
    res.json(testRes);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
