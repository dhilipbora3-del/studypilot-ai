import { Router } from 'express';
import { db } from '../db/database.js';
import { assignmentAgent } from '../agents/assignmentAgent.js';

const router = Router();

// GET /api/assignments - List assignments for current user
router.get('/', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const rows = db.prepare(`
      SELECT 
        a.*,
        s.name as subject_name,
        s.code as subject_code,
        s.color as subject_color
      FROM assignments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.user_id = ?
      ORDER BY 
        CASE a.status 
          WHEN 'urgent' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'in_progress' THEN 3 
          ELSE 4 
        END,
        a.due_date ASC
    `).all(userId);

    const assignments = rows.map(r => {
      const subtasks = JSON.parse(r.subtasks || '[]');
      const completedSubtasks = subtasks.filter(t => t.completed).length;
      const calculatedPriority = assignmentAgent.calculatePriority(r.due_date);

      return {
        ...r,
        subtasks,
        subtasks_count: subtasks.length,
        completed_subtasks_count: completedSubtasks,
        calculated_priority: calculatedPriority
      };
    });

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
  }
});

// POST /api/assignments - Create a new assignment
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { subject_id, title, description = '', due_date, priority = 'medium', estimated_minutes = 60, autoBreakdown = false } = req.body;
    
    if (!subject_id || !title || !due_date) {
      return res.status(400).json({ error: 'Subject, title, and due date are required' });
    }

    let subtasks = [];
    if (autoBreakdown) {
      const breakdownResult = await assignmentAgent.breakdownAssignment({ title, description, estimated_minutes, due_date });
      subtasks = breakdownResult.subtasks;
    }

    const calculatedPriority = priority || assignmentAgent.calculatePriority(due_date);

    const info = db.prepare(`
      INSERT INTO assignments (user_id, subject_id, title, description, due_date, priority, status, estimated_minutes, subtasks)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(userId, Number(subject_id), title.trim(), description.trim(), due_date, calculatedPriority, Number(estimated_minutes) || 60, JSON.stringify(subtasks));

    const created = db.prepare(`
      SELECT a.*, s.name as subject_name, s.color as subject_color
      FROM assignments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({
      success: true,
      assignment: {
        ...created,
        subtasks: JSON.parse(created.subtasks || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment', details: error.message });
  }
});

// POST /api/assignments/:id/breakdown - Generate AI subtasks for an assignment
router.post('/:id/breakdown', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND user_id = ?').get(id, userId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const breakdownResult = await assignmentAgent.breakdownAssignment(assignment);
    
    db.prepare('UPDATE assignments SET subtasks = ? WHERE id = ? AND user_id = ?')
      .run(JSON.stringify(breakdownResult.subtasks), id, userId);

    res.json({
      success: true,
      subtasks: breakdownResult.subtasks,
      calculatedPriority: breakdownResult.calculatedPriority
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to breakdown assignment', details: error.message });
  }
});

// PUT /api/assignments/:id/subtask/:subtaskId - Toggle a subtask
router.put('/:id/subtask/:subtaskId', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id, subtaskId } = req.params;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND user_id = ?').get(id, userId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    let subtasks = JSON.parse(assignment.subtasks || '[]');
    subtasks = subtasks.map(t => {
      if (t.id === Number(subtaskId)) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const isAllDone = subtasks.length > 0 && subtasks.every(t => t.completed);
    const newStatus = isAllDone ? 'completed' : (subtasks.some(t => t.completed) ? 'in_progress' : assignment.status);

    db.prepare('UPDATE assignments SET subtasks = ?, status = ? WHERE id = ? AND user_id = ?')
      .run(JSON.stringify(subtasks), newStatus, id, userId);

    res.json({ success: true, subtasks, status: newStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle subtask', details: error.message });
  }
});

// PUT /api/assignments/:id - Update assignment details / status
router.put('/:id', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    const { title, description, due_date, priority, status, estimated_minutes } = req.body;

    db.prepare(`
      UPDATE assignments
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          due_date = COALESCE(?, due_date),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          estimated_minutes = COALESCE(?, estimated_minutes)
      WHERE id = ? AND user_id = ?
    `).run(title, description, due_date, priority, status, estimated_minutes, id, userId);

    const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    res.json({
      success: true,
      assignment: {
        ...updated,
        subtasks: JSON.parse(updated.subtasks || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment', details: error.message });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;
    db.prepare('DELETE FROM assignments WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment', details: error.message });
  }
});

export default router;
