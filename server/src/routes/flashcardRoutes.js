import { Router } from 'express';
import { db } from '../db/database.js';
import { tutorAgent } from '../agents/tutorAgent.js';

const router = Router();

// GET /api/flashcards - List all flashcards
router.get('/', (req, res) => {
  try {
    const { subject_id, dueOnly } = req.query;
    let query = `
      SELECT 
        f.*,
        s.name as subject_name,
        s.color as subject_color
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.id
    `;
    const params = [];
    const conditions = [];

    if (subject_id) {
      conditions.push('f.subject_id = ?');
      params.push(subject_id);
    }

    if (dueOnly === 'true') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push('(f.next_review_date IS NULL OR f.next_review_date <= ?)');
      params.push(today);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY f.box ASC, f.created_at DESC';
    const flashcards = db.prepare(query).all(...params);

    res.json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flashcards', details: error.message });
  }
});

// POST /api/flashcards - Add a flashcard manually
router.post('/', (req, res) => {
  try {
    const { subject_id, topic, front, back } = req.body;
    if (!front || !back) {
      return res.status(400).json({ error: 'Front and back are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const info = db.prepare(`
      INSERT INTO flashcards (subject_id, topic, front, back, box, next_review_date, review_count)
      VALUES (?, ?, ?, ?, 1, ?, 0)
    `).run(subject_id ? Number(subject_id) : null, topic || 'General', front.trim(), back.trim(), today);

    const created = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, flashcard: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create flashcard', details: error.message });
  }
});

// POST /api/flashcards/generate - Tutor Agent generates cards for a topic
router.post('/generate', async (req, res) => {
  try {
    const { subject_id, topic, count = 3 } = req.body;
    let subjectName = 'General Studies';
    if (subject_id) {
      const sub = db.prepare('SELECT name FROM subjects WHERE id = ?').get(subject_id);
      if (sub) subjectName = sub.name;
    }

    const result = await tutorAgent.generateFlashcards(topic, Number(count) || 3, { subject: subjectName });

    const insertStmt = db.prepare(`
      INSERT INTO flashcards (subject_id, topic, front, back, box, next_review_date, review_count)
      VALUES (?, ?, ?, ?, 1, ?, 0)
    `);

    const today = new Date().toISOString().split('T')[0];
    const savedCards = [];

    for (const card of result.cards) {
      const info = insertStmt.run(subject_id ? Number(subject_id) : null, card.topic || topic, card.front, card.back, today);
      savedCards.push(db.prepare('SELECT * FROM flashcards WHERE id = ?').get(info.lastInsertRowid));
    }

    res.status(201).json({
      success: true,
      flashcards: savedCards,
      agentTrace: {
        agent: tutorAgent.name,
        role: tutorAgent.role,
        executionTimeMs: result.executionTimeMs
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
  }
});

// PUT /api/flashcards/:id/review - Update spaced repetition interval
router.put('/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body; // 'again', 'hard', 'good', 'easy'

    const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    let newBox = card.box || 1;
    let daysToAdd = 1;

    switch (rating) {
      case 'again':
        newBox = 1;
        daysToAdd = 0; // review same day
        break;
      case 'hard':
        newBox = Math.max(1, newBox);
        daysToAdd = 1;
        break;
      case 'good':
        newBox = Math.min(5, newBox + 1);
        daysToAdd = Math.pow(2, newBox); // 2, 4, 8, 16, 32 days
        break;
      case 'easy':
        newBox = Math.min(5, newBox + 2);
        daysToAdd = Math.pow(2, newBox) * 1.5;
        break;
      default:
        daysToAdd = 1;
    }

    const nextDate = new Date(Date.now() + Math.round(daysToAdd) * 86400000).toISOString().split('T')[0];
    const newCount = (card.review_count || 0) + 1;

    db.prepare(`
      UPDATE flashcards
      SET box = ?, next_review_date = ?, review_count = ?
      WHERE id = ?
    `).run(newBox, nextDate, newCount, id);

    res.json({ success: true, box: newBox, next_review_date: nextDate, review_count: newCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record review', details: error.message });
  }
});

// DELETE /api/flashcards/:id - Delete flashcard
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM flashcards WHERE id = ?').run(id);
    res.json({ success: true, message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flashcard', details: error.message });
  }
});

export default router;
