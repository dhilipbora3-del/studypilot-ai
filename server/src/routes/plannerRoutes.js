import { Router } from 'express';
import { db } from '../db/database.js';
import { plannerAgent } from '../agents/plannerAgent.js';
import { reviewAgent } from '../agents/reviewAgent.js';

const router = Router();

// GET /api/planner/slots - Retrieve timetable slots for current user
router.get('/slots', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { date } = req.query;
    let query = `
      SELECT 
        ts.*,
        s.name as subject_name,
        s.code as subject_code,
        s.color as subject_color
      FROM timetable_slots ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.user_id = ?
    `;
    const params = [userId];

    if (date) {
      query += ` AND (ts.date = ? OR ts.day_of_week = ?)`;
      const dayOfWeek = new Date(date).getDay();
      params.push(date, dayOfWeek);
    }

    query += ` ORDER BY ts.start_time ASC`;
    const slots = db.prepare(query).all(...params);

    // Run Review Agent validation on returned schedule
    const review = reviewAgent.verifyScheduleConflicts(slots);

    res.json({ success: true, slots, review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable slots', details: error.message });
  }
});

// POST /api/planner/generate - Study Planner Agent generates schedule for user's subjects
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { date, daysCount = 1, dailyStudyHours = 4, startHour = 9, preferredBlockMinutes = 50, breakMinutes = 10 } = req.body;

    const userSubjects = db.prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY confidence_level ASC').all(userId);
    const userAssignments = db.prepare('SELECT * FROM assignments WHERE user_id = ? AND status != "completed" ORDER BY due_date ASC').all(userId);
    const userExams = db.prepare('SELECT * FROM exams WHERE user_id = ? ORDER BY exam_date ASC').all(userId);

    const plan = await plannerAgent.generateSchedule({
      date: date || new Date().toISOString().split('T')[0],
      daysCount: Number(daysCount) || 1,
      dailyStudyHours: Number(dailyStudyHours) || 4,
      startHour: Number(startHour) || 9,
      preferredBlockMinutes: Number(preferredBlockMinutes) || 50,
      breakMinutes: Number(breakMinutes) || 10,
      subjects: userSubjects,
      assignments: userAssignments,
      exams: userExams
    });

    const review = await reviewAgent.review({
      query: `Generate ${daysCount}-day schedule with ${dailyStudyHours} hours/day`,
      agentType: 'planner',
      data: { schedule: plan.slots }
    });

    res.json({ success: true, plan, review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate schedule', details: error.message });
  }
});

// POST /api/planner/save-slots - Persist slots for current user
router.post('/save-slots', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { slots = [], replaceExisting = true } = req.body;

    if (replaceExisting && slots.length > 0) {
      const datesToClear = [...new Set(slots.map(s => s.date).filter(Boolean))];
      for (const d of datesToClear) {
        db.prepare('DELETE FROM timetable_slots WHERE user_id = ? AND date = ?').run(userId, d);
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO timetable_slots (user_id, day_of_week, date, start_time, end_time, subject_id, topic, type, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    for (const slot of slots) {
      insertStmt.run(
        userId,
        slot.day_of_week ?? new Date(slot.date || Date.now()).getDay(),
        slot.date || new Date().toISOString().split('T')[0],
        slot.start_time,
        slot.end_time,
        slot.subject_id || null,
        slot.topic || 'Focused Study',
        slot.type || 'study'
      );
    }

    res.json({ success: true, message: `Successfully saved ${slots.length} schedule slots` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save slots', details: error.message });
  }
});

// PUT /api/planner/slot/:id/toggle - Toggle slot completion
router.put('/slot/:id/toggle', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const current = db.prepare('SELECT is_completed FROM timetable_slots WHERE id = ? AND user_id = ?').get(id, userId);
    if (!current) return res.status(404).json({ error: 'Slot not found' });

    const newCompleted = current.is_completed ? 0 : 1;
    db.prepare('UPDATE timetable_slots SET is_completed = ? WHERE id = ? AND user_id = ?').run(newCompleted, id, userId);

    res.json({ success: true, is_completed: newCompleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle slot', details: error.message });
  }
});

// DELETE /api/planner/slot/:id - Delete a slot
router.delete('/slot/:id', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    db.prepare('DELETE FROM timetable_slots WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot', details: error.message });
  }
});

export default router;
