import { Router } from 'express';
import { db } from '../db/database.js';
import { assignmentAgent } from '../agents/assignmentAgent.js';

const router = Router();

// GET /api/stats/dashboard - Student productivity analytics for current user
router.get('/dashboard', (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Study hours today and this week
    const todayRow = db.prepare(`
      SELECT SUM(duration_minutes) as total FROM study_sessions WHERE user_id = ? AND completed_at LIKE ?
    `).get(userId, `${todayStr}%`);
    const todayStudyMinutes = todayRow?.total || 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weeklyRow = db.prepare(`
      SELECT SUM(duration_minutes) as total FROM study_sessions WHERE user_id = ? AND completed_at >= ?
    `).get(userId, sevenDaysAgo);
    const weeklyStudyMinutes = weeklyRow?.total || 0;

    // 2. Study time per subject
    const subjectDistribution = db.prepare(`
      SELECT s.name, s.color, SUM(ss.duration_minutes) as minutes
      FROM study_sessions ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
      GROUP BY s.id
      ORDER BY minutes DESC
    `).all(userId);

    // 3. Assignment stats (Single source of truth via assignmentAgent.calculatePriority)
    const assignments = db.prepare(`
      SELECT id, due_date, priority, status FROM assignments WHERE user_id = ?
    `).all(userId);
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = totalAssignments - completedAssignments;
    const urgentAssignments = assignments.filter(a => 
      a.status !== 'completed' && (a.priority === 'urgent' || assignmentAgent.calculatePriority(a.due_date) === 'urgent')
    ).length;

    // 4. Nearest upcoming exam
    const nearestExam = db.prepare(`
      SELECT e.*, s.name as subject_name, s.color as subject_color
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ? AND e.exam_date >= ?
      ORDER BY e.exam_date ASC
      LIMIT 1
    `).get(userId, todayStr);

    let daysUntilNearestExam = null;
    if (nearestExam) {
      daysUntilNearestExam = Math.ceil((new Date(nearestExam.exam_date) - new Date()) / (1000 * 60 * 60 * 24));
    }

    // 5. Quiz performance
    const quizStats = db.prepare(`
      SELECT COUNT(*) as total_attempts, AVG(percentage) as average_percentage
      FROM quiz_attempts
      WHERE user_id = ?
    `).get(userId) || {};

    // 6. Timetable completion today
    const dayOfWeek = new Date().getDay();
    const todaySlots = db.prepare(`
      SELECT 
        COUNT(*) as total_slots,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_slots
      FROM timetable_slots
      WHERE user_id = ? AND (date = ? OR day_of_week = ?)
    `).get(userId, todayStr, dayOfWeek) || {};

    // 7. Study streak calculation
    const sessionDays = db.prepare(`
      SELECT DISTINCT substr(completed_at, 1, 10) as session_date
      FROM study_sessions
      WHERE user_id = ?
      ORDER BY session_date DESC
      LIMIT 30
    `).all(userId).map(r => r.session_date);

    let streak = 0;
    const checkDate = new Date();
    const hasToday = sessionDays.includes(todayStr);
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 30; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (sessionDays.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      success: true,
      stats: {
        todayStudyMinutes,
        weeklyStudyHours: Math.round((weeklyStudyMinutes / 60) * 10) / 10,
        pendingAssignments,
        completedAssignments,
        urgentAssignments,
        nearestExam: nearestExam ? {
          ...nearestExam,
          days_remaining: daysUntilNearestExam
        } : null,
        averageQuizScore: quizStats.average_percentage ? Math.round(quizStats.average_percentage) : 0,
        totalQuizAttempts: quizStats.total_attempts || 0,
        todaySlotsTotal: todaySlots.total_slots || 0,
        todaySlotsCompleted: todaySlots.completed_slots || 0,
        subjectDistribution,
        streakDays: streak
      }
    });
  } catch (error) {
    console.error('[Stats Routes Error /dashboard]', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

export default router;
