import { Router } from 'express';
import { db } from '../db/database.js';
import { examAgent } from '../agents/examAgent.js';
import { reviewAgent } from '../agents/reviewAgent.js';

const router = Router();

// GET /api/quizzes - List quizzes for current user
router.get('/', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const rows = db.prepare(`
      SELECT 
        q.*,
        s.name as subject_name,
        s.code as subject_code,
        s.color as subject_color,
        (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as attempts_count,
        (SELECT MAX(percentage) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as best_score
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.user_id = ?
      ORDER BY q.created_at DESC
    `).all(userId, userId, userId);

    const quizzes = rows.map(r => ({
      ...r,
      questions: JSON.parse(r.questions || '[]')
    }));

    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes', details: error.message });
  }
});

// GET /api/quizzes/:id - Get a specific quiz
router.get('/:id', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const row = db.prepare(`
      SELECT q.*, s.name as subject_name, s.color as subject_color
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.id = ? AND q.user_id = ?
    `).get(id, userId);

    if (!row) return res.status(404).json({ error: 'Quiz not found' });

    res.json({
      success: true,
      quiz: {
        ...row,
        questions: JSON.parse(row.questions || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz', details: error.message });
  }
});

// POST /api/quizzes/generate - Exam Agent generates a new mock quiz
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { subject_id, topic, count = 4, difficulty = 'medium' } = req.body;
    let subjectName = 'General Studies';

    if (subject_id) {
      const sub = db.prepare('SELECT name FROM subjects WHERE id = ? AND user_id = ?').get(subject_id, userId);
      if (sub) subjectName = sub.name;
    }

    const examResult = await examAgent.generateMockTest({
      subjectName,
      topic: topic || `${subjectName} Review`,
      count: Number(count) || 4,
      difficulty
    });

    const title = `${subjectName}: ${topic || 'Practice Mock Test'}`;
    const info = db.prepare(`
      INSERT INTO quizzes (user_id, subject_id, topic, title, questions)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, subject_id ? Number(subject_id) : null, topic || 'General', title, JSON.stringify(examResult.questions));

    const savedQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(info.lastInsertRowid);

    res.status(201).json({
      success: true,
      quiz: {
        ...savedQuiz,
        questions: examResult.questions
      },
      agentTrace: {
        agent: examAgent.name,
        role: examAgent.role,
        executionTimeMs: examResult.executionTimeMs
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});

// POST /api/quizzes/:id/submit - Evaluate answers deterministically
router.post('/:id/submit', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const { answers = {} } = req.body;

    const quizRow = db.prepare('SELECT * FROM quizzes WHERE id = ? AND user_id = ?').get(id, userId);
    if (!quizRow) return res.status(404).json({ error: 'Quiz not found' });

    const questions = JSON.parse(quizRow.questions || '[]');

    const evaluation = examAgent.evaluateAnswers(questions, answers);

    const reviewData = {
      score: evaluation.score,
      total: evaluation.totalQuestions,
      percentage: evaluation.percentage
    };
    const reviewResult = reviewAgent.verifyArithmetic(reviewData);

    db.prepare(`
      INSERT INTO quiz_attempts (user_id, quiz_id, subject_id, score, total_questions, percentage, answers, weak_topics, review_feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      Number(id),
      quizRow.subject_id,
      evaluation.score,
      evaluation.totalQuestions,
      evaluation.percentage,
      JSON.stringify(answers),
      JSON.stringify(evaluation.weakTopics),
      evaluation.feedback
    );

    res.json({
      success: true,
      evaluation,
      reviewAgentStamp: {
        agent: reviewAgent.name,
        passed: reviewResult.passed,
        message: reviewResult.message
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate quiz', details: error.message });
  }
});

// GET /api/quizzes/stats/summary
router.get('/stats/summary', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const totalAttempts = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?').get(userId).count;
    const avgScore = db.prepare('SELECT AVG(percentage) as avg FROM quiz_attempts WHERE user_id = ?').get(userId).avg || 0;
    const recentAttempts = db.prepare(`
      SELECT qa.*, q.title as quiz_title
      FROM quiz_attempts qa
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = ?
      ORDER BY qa.completed_at DESC
      LIMIT 5
    `).all(userId);

    res.json({
      success: true,
      totalAttempts,
      averagePercentage: Math.round(avgScore * 10) / 10,
      recentAttempts: recentAttempts.map(a => ({
        ...a,
        weak_topics: JSON.parse(a.weak_topics || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz stats', details: error.message });
  }
});

export default router;
