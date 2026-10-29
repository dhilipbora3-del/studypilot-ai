import { Router } from 'express';
import { db } from '../db/database.js';
import { examAgent } from '../agents/examAgent.js';

const router = Router();

// GET /api/exams - List exams for current user
router.get('/', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const rows = db.prepare(`
      SELECT 
        e.*,
        s.name as subject_name,
        s.code as subject_code,
        s.color as subject_color
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ?
      ORDER BY e.exam_date ASC
    `).all(userId);

    const now = new Date();
    const exams = rows.map(r => {
      const examDate = new Date(r.exam_date);
      const daysRemaining = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
      return {
        ...r,
        days_remaining: daysRemaining,
        is_past: daysRemaining < 0,
        topics_covered: JSON.parse(r.topics_covered || '[]'),
        revision_milestones: JSON.parse(r.revision_milestones || '[]')
      };
    });

    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams', details: error.message });
  }
});

// POST /api/exams - Create a new exam
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { subject_id, title, exam_date, weight_percent = 20, target_score = 90, topics_covered = [], notes = '' } = req.body;

    if (!subject_id || !title || !exam_date) {
      return res.status(400).json({ error: 'Subject, title, and exam date are required' });
    }

    const topicsArr = Array.isArray(topics_covered) ? topics_covered : [topics_covered];
    const milestones = examAgent.generateRevisionMilestones(title, exam_date, topicsArr);

    const info = db.prepare(`
      INSERT INTO exams (user_id, subject_id, title, exam_date, weight_percent, target_score, topics_covered, revision_milestones, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, Number(subject_id), title.trim(), exam_date, Number(weight_percent) || 20, Number(target_score) || 90, JSON.stringify(topicsArr), JSON.stringify(milestones), notes.trim());

    const created = db.prepare('SELECT * FROM exams WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({
      success: true,
      exam: {
        ...created,
        topics_covered: JSON.parse(created.topics_covered || '[]'),
        revision_milestones: JSON.parse(created.revision_milestones || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exam', details: error.message });
  }
});

// POST /api/exams/:id/generate-revision
router.post('/:id/generate-revision', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ? AND user_id = ?').get(id, userId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const topics = JSON.parse(exam.topics_covered || '[]');
    const milestones = examAgent.generateRevisionMilestones(exam.title, exam.exam_date, topics);

    db.prepare('UPDATE exams SET revision_milestones = ? WHERE id = ? AND user_id = ?')
      .run(JSON.stringify(milestones), id, userId);

    res.json({ success: true, revision_milestones: milestones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate revision', details: error.message });
  }
});

// PUT /api/exams/:id/milestone/:index
router.put('/:id/milestone/:index', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id, index } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ? AND user_id = ?').get(id, userId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const milestones = JSON.parse(exam.revision_milestones || '[]');
    const idx = Number(index);
    if (idx >= 0 && idx < milestones.length) {
      milestones[idx].done = !milestones[idx].done;
      db.prepare('UPDATE exams SET revision_milestones = ? WHERE id = ? AND user_id = ?')
        .run(JSON.stringify(milestones), id, userId);
    }

    res.json({ success: true, revision_milestones: milestones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update milestone', details: error.message });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    db.prepare('DELETE FROM exams WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exam', details: error.message });
  }
});

export default router;
