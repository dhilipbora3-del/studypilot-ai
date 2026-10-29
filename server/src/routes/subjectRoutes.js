import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/subjects - List all subjects with topic counts and mastery stats
router.get('/', (req, res) => {
  try {
    const subjects = db.prepare(`
      SELECT 
        s.*,
        COUNT(t.id) as total_topics,
        SUM(CASE WHEN t.status = 'mastered' THEN 1 ELSE 0 END) as mastered_topics,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_topics
      FROM subjects s
      LEFT JOIN topics t ON s.id = t.subject_id
      GROUP BY s.id
      ORDER BY s.confidence_level ASC, s.name ASC
    `).all();

    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects', details: error.message });
  }
});

// POST /api/subjects - Create a new subject
router.post('/', (req, res) => {
  try {
    const { name, code, color = 'indigo', icon = 'BookOpen', target_grade = 'A', confidence_level = 3 } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const info = db.prepare(`
      INSERT INTO subjects (name, code, color, icon, target_grade, confidence_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), code?.trim() || '', color, icon, target_grade, Number(confidence_level) || 3);

    const created = db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, subject: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subject', details: error.message });
  }
});

// PUT /api/subjects/:id - Update subject
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, color, icon, target_grade, confidence_level } = req.body;

    db.prepare(`
      UPDATE subjects
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          color = COALESCE(?, color),
          icon = COALESCE(?, icon),
          target_grade = COALESCE(?, target_grade),
          confidence_level = COALESCE(?, confidence_level)
      WHERE id = ?
    `).run(name, code, color, icon, target_grade, confidence_level ? Number(confidence_level) : undefined, id);

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    res.json({ success: true, subject: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject', details: error.message });
  }
});

// DELETE /api/subjects/:id - Delete subject
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject', details: error.message });
  }
});

// GET /api/subjects/:id/topics - List topics for a specific subject
router.get('/:id/topics', (req, res) => {
  try {
    const { id } = req.params;
    const topics = db.prepare('SELECT * FROM topics WHERE subject_id = ? ORDER BY id ASC').all(id);
    res.json({ success: true, topics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics', details: error.message });
  }
});

// POST /api/subjects/:id/topics - Add a topic
router.post('/:id/topics', (req, res) => {
  try {
    const { id } = req.params;
    const { name, difficulty = 'medium', notes = '', status = 'in_progress' } = req.body;
    if (!name) return res.status(400).json({ error: 'Topic name is required' });

    const info = db.prepare(`
      INSERT INTO topics (subject_id, name, status, difficulty, notes, last_reviewed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), status, difficulty, notes, new Date().toISOString().split('T')[0]);

    const created = db.prepare('SELECT * FROM topics WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, topic: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add topic', details: error.message });
  }
});

// PUT /api/topics/:topicId - Update a topic
router.put('/topics/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;
    const { name, status, difficulty, notes } = req.body;

    db.prepare(`
      UPDATE topics
      SET name = COALESCE(?, name),
          status = COALESCE(?, status),
          difficulty = COALESCE(?, difficulty),
          notes = COALESCE(?, notes),
          last_reviewed = ?
      WHERE id = ?
    `).run(name, status, difficulty, notes, new Date().toISOString().split('T')[0], topicId);

    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    res.json({ success: true, topic: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic', details: error.message });
  }
});

// DELETE /api/topics/:topicId - Delete a topic
router.delete('/topics/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;
    db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic', details: error.message });
  }
});

export default router;
