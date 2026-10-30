import { Router } from 'express';
import { managerAgent } from '../agents/managerAgent.js';
import { db } from '../db/database.js';

const router = Router();

// POST /api/chat - Process student request via Multi-Agent system for current user
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { message, dailyStudyHours, selectedAgent, apiKey, provider, model } = req.body;
    const headerKey = req.headers['x-llm-key'] || req.headers['x-gemini-key'] || req.headers['x-api-key'];
    const headerProvider = req.headers['x-llm-provider'];
    const headerModel = req.headers['x-llm-model'];
    const activeKey = apiKey || headerKey;
    const activeProvider = provider || headerProvider;
    const activeModel = model || headerModel;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Save student message in DB
    db.prepare('INSERT INTO chat_logs (user_id, role, content, agent_traces) VALUES (?, ?, ?, ?)')
      .run(userId, 'user', message, '[]');

    // Run Manager Agent orchestration with user context
    const agentResult = await managerAgent.processRequest(message, { 
      dailyStudyHours, 
      userId,
      selectedAgent,
      apiKey: activeKey,
      provider: activeProvider,
      model: activeModel
    });

    // Save assistant response + full agent trace in DB
    db.prepare('INSERT INTO chat_logs (user_id, role, content, agent_traces, metadata) VALUES (?, ?, ?, ?, ?)')
      .run(
        userId,
        'assistant',
        agentResult.message,
        JSON.stringify(agentResult.agentTraces),
        JSON.stringify(agentResult.structuredData || {})
      );

    return res.json({
      success: true,
      message: agentResult.message,
      agentTraces: agentResult.agentTraces,
      reviewSummary: agentResult.reviewSummary,
      structuredData: agentResult.structuredData,
      activeAgents: agentResult.activeAgents,
      totalExecutionTimeMs: agentResult.totalExecutionTimeMs
    });
  } catch (error) {
    console.error('[Chat Route Error]', error);
    return res.status(500).json({
      error: 'Failed to process student request',
      details: error.message
    });
  }
});

// GET /api/chat/history - Retrieve recent chat messages for current user
router.get('/history', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const rows = db.prepare('SELECT * FROM chat_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT 50').all(userId);
    const history = rows.map(r => ({
      id: r.id,
      role: r.role,
      content: r.content,
      agentTraces: JSON.parse(r.agent_traces || '[]'),
      metadata: JSON.parse(r.metadata || '{}'),
      createdAt: r.created_at
    }));
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// DELETE /api/chat/history - Clear chat history for current user
router.delete('/history', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    db.prepare('DELETE FROM chat_logs WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history', details: error.message });
  }
});

export default router;
