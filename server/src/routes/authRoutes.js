import { Router } from 'express';
import { db, seedStarterCurriculum } from '../db/database.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register - Register a new student account
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);

    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash);

    const newUser = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);

    // Initialize personal starter curriculum for this new user
    seedStarterCurriculum(newUser.id, newUser.name);

    const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name });

    res.status(201).json({
      success: true,
      token,
      user: newUser,
      message: 'Account created successfully with personal starter curriculum!'
    });
  } catch (error) {
    console.error('[Auth Register Error]', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// POST /api/auth/login - Log in to student account
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// GET /api/auth/me - Get currently authenticated user profile
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
