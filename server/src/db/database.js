import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'studypilot.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for better concurrency and integrity
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      subject_id INTEGER,
      topic TEXT,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      subject_id INTEGER,
      duration_minutes INTEGER NOT NULL,
      mode TEXT DEFAULT 'pomodoro',
      notes TEXT DEFAULT '',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      agent_traces TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
  if (count > 0) return;

  console.log('[Database] Seeding initial student subjects and data...');

  // Seed subjects
  const insertSub = db.prepare(`
    INSERT INTO subjects (name, code, color, icon, target_grade, confidence_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertSub.run('Computer Science: Algorithms', 'CS-201', 'indigo', 'Code2', 'A', 4).lastInsertRowid;
  const s2 = insertSub.run('Calculus & Linear Algebra', 'MATH-102', 'emerald', 'FunctionSquare', 'A-', 3).lastInsertRowid;
  const s3 = insertSub.run('Physics: Classical Mechanics', 'PHYS-101', 'amber', 'Atom', 'B+', 2).lastInsertRowid;
  const s4 = insertSub.run('World History & Civilizations', 'HIST-110', 'rose', 'Globe', 'A', 5).lastInsertRowid;

  // Seed topics
  const insertTopic = db.prepare(`
    INSERT INTO topics (subject_id, name, status, difficulty, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTopic.run(s1, 'Binary Search Trees & AVL Trees', 'mastered', 'medium', 'Height balance factor: -1, 0, or 1. Rotations LL, RR, LR, RL.');
  insertTopic.run(s1, 'Dynamic Programming & Memoization', 'in_progress', 'hard', 'Optimal substructure and overlapping subproblems.');
  insertTopic.run(s1, 'Graph Traversals (BFS & DFS)', 'mastered', 'easy', 'BFS uses queue (shortest path unweighted), DFS uses stack/recursion.');

  insertTopic.run(s2, 'Eigenvalues and Eigenvectors', 'in_progress', 'hard', 'det(A - lambda*I) = 0. Trace is sum, determinant is product.');
  insertTopic.run(s2, 'Integration Techniques (Parts & Substitution)', 'mastered', 'medium', 'Integral of u dv = uv - integral v du.');

  insertTopic.run(s3, 'Rotational Dynamics & Torque', 'in_progress', 'hard', 'Tau = I * alpha. Moment of inertia depends on mass distribution.');
  insertTopic.run(s3, 'Conservation of Momentum and Energy', 'mastered', 'medium', 'Elastic vs inelastic collisions.');

  insertTopic.run(s4, 'Industrial Revolution & Social Impact', 'mastered', 'medium', 'Urbanization, rise of factories, steam power, labor movements.');

  // Helper date function
  const now = new Date();
  const formatFutureDate = (daysAhead) => {
    const d = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // Seed assignments
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (subject_id, title, description, due_date, priority, status, estimated_minutes, subtasks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAssignment.run(
    s1,
    'Algorithm Problem Set 4: Dynamic Programming',
    'Implement Longest Common Subsequence (LCS) and 0/1 Knapsack in Python with time complexity analysis.',
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
    s2,
    'Linear Algebra Lab: Matrix Diagonalization',
    'Compute characteristic polynomials, find eigenvectors and verify P^-1 * A * P = D.',
    formatFutureDate(4),
    'high',
    'pending',
    90,
    JSON.stringify([
      { id: 1, title: 'Solve characteristic equation for 3x3 matrices', completed: false },
      { id: 2, title: 'Determine eigenspaces and basis vectors', completed: false },
      { id: 3, title: 'Construct change-of-basis matrix P', completed: false }
    ])
  );

  insertAssignment.run(
    s3,
    'Physics Lab Report: Gyroscopic Precession',
    'Analyze angular momentum vector cross products and calculate precession frequency.',
    formatFutureDate(7),
    'medium',
    'pending',
    75,
    JSON.stringify([
      { id: 1, title: 'Tabulate experimental flywheel spin rates', completed: false },
      { id: 2, title: 'Plot torque vs precession rate', completed: false },
      { id: 3, title: 'Discuss systematic error margins', completed: false }
    ])
  );

  // Seed exams
  const insertExam = db.prepare(`
    INSERT INTO exams (subject_id, title, exam_date, weight_percent, target_score, topics_covered, revision_milestones, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExam.run(
    s2,
    'Calculus & Linear Algebra Midterm Exam',
    formatFutureDate(5),
    30,
    92,
    JSON.stringify(['Eigenvalues', 'Matrix Diagonalization', 'Multiple Integrals', 'Vector Fields']),
    JSON.stringify([
      { dayOffset: -4, task: 'Complete past exam 2024 problem set', done: false },
      { dayOffset: -2, task: 'Intensive flashcard review on diagonalization theorems', done: false },
      { dayOffset: -1, task: 'Timed mock exam & formula sheet memorization', done: false }
    ]),
    'Formula sheet permitted: 1 single-sided page. Calculator allowed (non-programmable).'
  );

  insertExam.run(
    s1,
    'Algorithms Final Exam',
    formatFutureDate(18),
    40,
    95,
    JSON.stringify(['Greedy Algorithms', 'Dynamic Programming', 'Graph Theory', 'NP-Completeness']),
    JSON.stringify([
      { dayOffset: -10, task: 'Revise Greedy vs DP choice criteria', done: false },
      { dayOffset: -5, task: 'Dijkstra, Bellman-Ford & Floyd-Warshall review', done: false },
      { dayOffset: -2, task: 'Mock test under 2-hour exam conditions', done: false }
    ]),
    'Closed book exam. Focus on pseudocode correctness and invariant proofs.'
  );

  // Seed initial flashcards
  const insertCard = db.prepare(`
    INSERT INTO flashcards (subject_id, topic, front, back, box, next_review_date, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCard.run(
    s1,
    'Dynamic Programming',
    'What are the two core prerequisites for solving a problem with Dynamic Programming?',
    '1. Optimal Substructure: Optimal solution to the problem contains optimal solutions to subproblems.\n2. Overlapping Subproblems: The same subproblems are solved repeatedly.',
    2,
    formatFutureDate(1),
    3
  );

  insertCard.run(
    s1,
    'Trees',
    'What is the maximum height difference allowed between subtrees in an AVL Tree?',
    'The balance factor must be in the range {-1, 0, 1}. If it deviates, single or double rotations (LL, RR, LR, RL) are executed.',
    3,
    formatFutureDate(3),
    5
  );

  insertCard.run(
    s2,
    'Linear Algebra',
    'What does it mean for a square matrix A to have an eigenvalue lambda = 0?',
    'The matrix A is singular (non-invertible), det(A) = 0, and the null space contains non-trivial vectors (nullity > 0).',
    1,
    formatFutureDate(0),
    1
  );

  insertCard.run(
    s3,
    'Mechanics',
    'State the relationship between Torque and Angular Momentum.',
    'Torque (tau) is the time derivative of angular momentum (L): tau = dL/dt. When net torque is zero, angular momentum is conserved.',
    2,
    formatFutureDate(2),
    2
  );

  // Seed study sessions
  const insertSession = db.prepare(`
    INSERT INTO study_sessions (subject_id, duration_minutes, mode, notes, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSession.run(s1, 50, 'pomodoro', 'Completed memoization table for LCS problem', new Date(Date.now() - 86400000).toISOString());
  insertSession.run(s2, 45, 'deep_work', 'Reviewed characteristic equation proofs', new Date(Date.now() - 172800000).toISOString());
  insertSession.run(s3, 30, 'pomodoro', 'Moment of inertia integration practice', new Date(Date.now() - 259200000).toISOString());

  // Seed sample quiz
  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (subject_id, topic, title, questions)
    VALUES (?, ?, ?, ?)
  `);

  const sampleQuestions = [
    {
      id: 1,
      question: 'Which of the following sorting algorithms has an average and worst-case time complexity of O(n log n)?',
      options: ['Quicksort', 'Merge Sort', 'Bubble Sort', 'Insertion Sort'],
      answerIndex: 1,
      explanation: 'Merge Sort consistently divides the array in half and merges in linear time, guaranteeing O(n log n) in all cases (worst, average, and best).'
    },
    {
      id: 2,
      question: 'In dynamic programming, top-down approach is also commonly known as:',
      options: ['Tabulation', 'Memoization', 'Greedy recursion', 'Branch and bound'],
      answerIndex: 1,
      explanation: 'Top-down dynamic programming solves problems recursively while caching/memoizing already-computed results.'
    },
    {
      id: 3,
      question: 'What is the time complexity to find an element in a balanced Binary Search Tree with n nodes?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
      explanation: 'Because the tree is balanced, each comparison cuts the search space approximately in half, yielding O(log n).'
    }
  ];

  insertQuiz.run(s1, 'Algorithms Fundamentals', 'CS-201 Rapid Diagnostic Quiz', JSON.stringify(sampleQuestions));

  // Seed timetable slots for today
  const insertSlot = db.prepare(`
    INSERT INTO timetable_slots (day_of_week, date, start_time, end_time, subject_id, topic, type, is_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();

  insertSlot.run(dayOfWeek, todayStr, '09:00', '10:15', s1, 'Dynamic Programming Knapsack', 'assignment', 1);
  insertSlot.run(dayOfWeek, todayStr, '10:30', '11:45', s2, 'Eigenvalues & Characteristic Equation', 'study', 0);
  insertSlot.run(dayOfWeek, todayStr, '14:00', '15:15', s3, 'Rotational Inertia Problem Solving', 'revision', 0);
  insertSlot.run(dayOfWeek, todayStr, '16:00', '16:45', s4, 'Industrial Revolution Flashcards', 'study', 0);

  console.log('[Database] Seed data successfully populated.');
}
