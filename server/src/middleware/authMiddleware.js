import { verifyToken } from '../utils/auth.js';
import { db } from '../db/database.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check if demo user exists for fallback
    const demo = db.prepare('SELECT id, name, email FROM users ORDER BY id ASC LIMIT 1').get();
    if (demo) {
      req.user = demo;
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  const user = db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  req.user = user;
  next();
}
