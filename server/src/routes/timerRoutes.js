import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/timer/sessions - Retrieve recent study sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT 
        ss.*,
        s.name as subject_name,
        s.color as subject_color
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      ORDER BY ss.completed_at DESC
      LIMIT 30
    `).all();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMinutes = db.prepare(`
      SELECT SUM(duration_minutes) as total
      FROM study_sessions
      WHERE completed_at LIKE ?
    `).get(`${todayStr}%`).total || 0;

    res.json({ success: true, sessions, todayMinutes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

// POST /api/timer/log - Record completed study session
router.post('/log', (req, res) => {
  try {
    const { subject_id, duration_minutes, mode = 'pomodoro', notes = '' } = req.body;

    if (!duration_minutes || Number(duration_minutes) <= 0) {
      return res.status(400).json({ error: 'Valid duration in minutes required' });
    }

    const info = db.prepare(`
      INSERT INTO study_sessions (subject_id, duration_minutes, mode, notes)
      VALUES (?, ?, ?, ?)
    `).run(subject_id ? Number(subject_id) : null, Number(duration_minutes), mode, notes.trim());

    const created = db.prepare(`
      SELECT ss.*, s.name as subject_name, s.color as subject_color
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({ success: true, session: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log session', details: error.message });
  }
});

export default router;
