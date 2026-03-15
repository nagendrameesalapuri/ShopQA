const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET  = process.env.JWT_SECRET  || 'shopqa_super_secret_jwt_key_change_in_prod';
const JWT_REFRESH = process.env.JWT_REFRESH || 'shopqa_refresh_secret_key_change_in_prod';

// ─── Token Generation ─────────────────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '15m',
  });

  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  return { accessToken, refreshToken };
};

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required', code: 'MISSING_TOKEN' });
    }

    const token = authHeader.slice(7);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const { rows } = await query(
      'SELECT id, email, role, status, first_name, last_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const user = rows[0];

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Account is locked', code: 'ACCOUNT_LOCKED' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned', code: 'ACCOUNT_BANNED' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Optional Auth (for guest cart etc) ──────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { rows } = await query('SELECT id, email, role, status FROM users WHERE id = $1', [decoded.id]);
      if (rows.length && rows[0].status === 'active') req.user = rows[0];
    } catch { /* ignore */ }
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Role Guard ───────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
  }
  next();
};

const requireAdmin = requireRole('admin');

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, generateTokens, JWT_SECRET, JWT_REFRESH };
