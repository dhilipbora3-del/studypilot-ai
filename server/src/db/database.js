import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'studypilot.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      code TEXT,
      color TEXT DEFAULT 'indigo',
      icon TEXT DEFAULT 'BookOpen',
      target_grade TEXT DEFAULT 'A',
      confidence_level INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      difficulty TEXT DEFAULT 'medium',
      notes TEXT DEFAULT '',
      last_reviewed TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      subject_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      estimated_minutes INTEGER DEFAULT 60,
      subtasks TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      subject_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      weight_percent INTEGER DEFAULT 25,
      target_score INTEGER DEFAULT 90,
      topics_covered TEXT DEFAULT '[]',
      revision_milestones TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timetable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      day_of_week INTEGER,
      date TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id INTEGER,
      topic TEXT DEFAULT '',
      type TEXT DEFAULT 'study',
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      subject_id INTEGER,
      topic TEXT,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      quiz_id INTEGER,
      subject_id INTEGER,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      answers TEXT NOT NULL,
      weak_topics TEXT DEFAULT '[]',
      review_feedback TEXT DEFAULT '',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      subject_id INTEGER,
      topic TEXT,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      box INTEGER DEFAULT 1,
      next_review_date TEXT,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      subject_id INTEGER,
      duration_minutes INTEGER NOT NULL,
      mode TEXT DEFAULT 'pomodoro',
      notes TEXT DEFAULT '',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      agent_traces TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  migrateUserColumns();
  seedInitialData();
}

function migrateUserColumns() {
  const tables = [
    'subjects',
    'assignments',
    'exams',
    'timetable_slots',
    'quizzes',
    'quiz_attempts',
    'flashcards',
    'study_sessions',
    'chat_logs'
  ];

  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER DEFAULT 1;`);
    } catch (e) {
      // Column already exists, ignore
    }
  }
}

function seedInitialData() {
  // Check if initial user exists
  let defaultUser = db.prepare('SELECT * FROM users WHERE email = ?').get('alex@university.edu');
  
  if (!defaultUser) {
    console.log('[Database] Creating default student account...');
    const hashed = hashPassword('password123');
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, avatar)
      VALUES (?, ?, ?, ?)
    `).run('Alex Chen', 'alex@university.edu', hashed, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    defaultUser = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  const subjectsCount = db.prepare('SELECT COUNT(*) as count FROM subjects WHERE user_id = ?').get(defaultUser.id).count;
  if (subjectsCount > 0) return;

  console.log(`[Database] Seeding initial curriculum for user: ${defaultUser.name}...`);
  seedStarterCurriculum(defaultUser.id, defaultUser.name);
}

export function seedStarterCurriculum(userId, studentName = 'Student') {
  // Seed subjects
  const insertSub = db.prepare(`
    INSERT INTO subjects (user_id, name, code, color, icon, target_grade, confidence_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertSub.run(userId, 'Computer Science: Algorithms', 'CS-201', 'indigo', 'Code2', 'A', 4).lastInsertRowid;
  const s2 = insertSub.run(userId, 'Calculus & Linear Algebra', 'MATH-102', 'emerald', 'FunctionSquare', 'A-', 3).lastInsertRowid;
  const s3 = insertSub.run(userId, 'Physics: Classical Mechanics', 'PHYS-101', 'amber', 'Atom', 'B+', 2).lastInsertRowid;
  const s4 = insertSub.run(userId, 'World History & Civilizations', 'HIST-110', 'rose', 'Globe', 'A', 5).lastInsertRowid;

  // Seed topics
  const insertTopic = db.prepare(`
    INSERT INTO topics (subject_id, name, status, difficulty, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTopic.run(s1, 'Binary Search Trees & AVL Trees', 'mastered', 'medium', 'Balance factor: -1, 0, or 1.');
  insertTopic.run(s1, 'Dynamic Programming & Memoization', 'in_progress', 'hard', 'Optimal substructure and overlapping subproblems.');
  insertTopic.run(s1, 'Graph Traversals (BFS & DFS)', 'mastered', 'easy', 'BFS queue vs DFS recursion.');

  insertTopic.run(s2, 'Eigenvalues and Eigenvectors', 'in_progress', 'hard', 'det(A - lambda*I) = 0.');
  insertTopic.run(s2, 'Integration Techniques', 'mastered', 'medium', 'Integration by parts and substitution.');

  insertTopic.run(s3, 'Rotational Dynamics & Torque', 'in_progress', 'hard', 'Tau = I * alpha. Moment of inertia.');
  insertTopic.run(s3, 'Conservation of Momentum and Energy', 'mastered', 'medium', 'Elastic vs inelastic collisions.');

  insertTopic.run(s4, 'Industrial Revolution & Impact', 'mastered', 'medium', 'Steam power, urbanization, labor movements.');

  const now = new Date();
  const formatFutureDate = (daysAhead) => {
    const d = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // Seed assignments
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (user_id, subject_id, title, description, due_date, priority, status, estimated_minutes, subtasks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAssignment.run(
    userId,
    s1,
    'Algorithm Problem Set 4: Dynamic Programming',
    'Implement Longest Common Subsequence and 0/1 Knapsack with complexity proofs.',
    formatFutureDate(2),
    'urgent',
    'in_progress',
    120,
    JSON.stringify([
      { id: 1, title: 'Formulate recurrence relation for LCS', completed: true },
      { id: 2, title: 'Write bottom-up table implementation', completed: true },
      { id: 3, title: 'Code 0/1 Knapsack with memoization', completed: false },
      { id: 4, title: 'Write big-O complexity explanations', completed: false }
    ])
  );

  insertAssignment.run(
    userId,
    s2,
    'Linear Algebra Lab: Matrix Diagonalization',
    'Compute characteristic polynomials, find eigenvectors and verify P^-1 * A * P = D.',
    formatFutureDate(4),
    'high',
    'pending',
    90,
    JSON.stringify([
      { id: 1, title: 'Solve characteristic equation for 3x3 matrices', completed: false },
      { id: 2, title: 'Determine eigenspaces and basis vectors', completed: false }
    ])
  );

  // Seed exam
  const insertExam = db.prepare(`
    INSERT INTO exams (user_id, subject_id, title, exam_date, weight_percent, target_score, topics_covered, revision_milestones, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExam.run(
    userId,
    s2,
    'Calculus & Linear Algebra Midterm Exam',
    formatFutureDate(5),
    30,
    92,
    JSON.stringify(['Eigenvalues', 'Matrix Diagonalization', 'Multiple Integrals']),
    JSON.stringify([
      { dayOffset: -4, task: 'Complete past exam problem set', done: false },
      { dayOffset: -2, task: 'Flashcard review on diagonalization theorems', done: false },
      { dayOffset: -1, task: 'Timed mock exam & formula sheet memorization', done: false }
    ]),
    'Formula sheet permitted: 1 page. Calculator allowed.'
  );

  // Seed flashcards
  const insertCard = db.prepare(`
    INSERT INTO flashcards (user_id, subject_id, topic, front, back, box, next_review_date, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCard.run(
    userId,
    s1,
    'Dynamic Programming',
    'What two properties must a problem have to be solvable using Dynamic Programming?',
    '1. Optimal Substructure: Optimal solution contains optimal subproblem solutions.\n2. Overlapping Subproblems: Same subproblems recurring.',
    2,
    formatFutureDate(1),
    2
  );

  insertCard.run(
    userId,
    s2,
    'Linear Algebra',
    'What does det(A - λI) = 0 compute in linear algebra?',
    'The characteristic polynomial, whose roots are the eigenvalues (λ) of matrix A.',
    1,
    formatFutureDate(0),
    1
  );

  // Seed timetable slots for today
  const insertSlot = db.prepare(`
    INSERT INTO timetable_slots (user_id, day_of_week, date, start_time, end_time, subject_id, topic, type, is_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();

  insertSlot.run(userId, dayOfWeek, todayStr, '09:00', '10:15', s1, 'Dynamic Programming Knapsack', 'assignment', 1);
  insertSlot.run(userId, dayOfWeek, todayStr, '10:30', '11:45', s2, 'Eigenvalues & Characteristic Equation', 'study', 0);
  insertSlot.run(userId, dayOfWeek, todayStr, '14:00', '15:15', s3, 'Rotational Dynamics Problem Solving', 'revision', 0);

  // Seed study session
  db.prepare(`
    INSERT INTO study_sessions (user_id, subject_id, duration_minutes, mode, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, s1, 45, 'pomodoro', 'Dynamic programming memoization study');
}
