/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { generateTokens, authenticate, JWT_REFRESH } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { body } = require('express-validator');

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:    { type: string, example: "user@example.com" }
 *               password: { type: string, minLength: 8, example: "Password123!" }
 *               firstName:{ type: string, example: "John" }
 *               lastName: { type: string, example: "Doe" }
 *               phone:    { type: string, example: "+91-9876543210" }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error or email taken }
 *       409: { description: Email already registered }
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 }),
  ],
  validateBody,
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_TAKEN' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const { rows } = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, verification_token, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending_verification')
        RETURNING id, email, first_name, last_name, role, status
      `, [email, passwordHash, firstName, lastName, phone || null, verificationToken]);

      const user = rows[0];

      // In production: send verification email
      // For QA testing, we expose the token in response (dev mode)
      const devData = process.env.NODE_ENV !== 'production'
        ? { verificationToken, verificationUrl: `http://localhost:5000/api/auth/verify-email/${verificationToken}` }
        : {};

      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
        ...devData,
      });
    } catch (err) { next(err); }
  }
);

// ─── Verify Email ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 */
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { rows } = await query(
      `UPDATE users SET email_verified = true, status = 'active', verification_token = null
       WHERE verification_token = $1 AND status = 'pending_verification'
       RETURNING id, email`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired verification token', code: 'INVALID_TOKEN' });
    }

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) { next(err); }
});

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:  { type: string }
 *                 refreshToken: { type: string }
 *                 user:         { type: object }
 *       401: { description: Invalid credentials }
 *       403: { description: Account locked or banned }
 */
router.post('/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validateBody,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const { rows } = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (!rows.length) {
        return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      }

      const user = rows[0];

      // Account lockout (QA test scenario: lock after 5 failed attempts)
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return res.status(403).json({
          error: `Account locked. Try again in ${minutesLeft} minute(s).`,
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.locked_until,
        });
      }

      if (user.status === 'banned') {
        return res.status(403).json({ error: 'Account has been banned', code: 'ACCOUNT_BANNED' });
      }

      if (user.status === 'pending_verification') {
        return res.status(403).json({ error: 'Please verify your email first', code: 'EMAIL_NOT_VERIFIED' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        // Increment login attempts
        const attempts = (user.login_attempts || 0) + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

        await query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
          [attempts, lockUntil, user.id]
        );

        if (attempts >= 5) {
          return res.status(403).json({ error: 'Account locked for 30 minutes due to too many failed attempts', code: 'ACCOUNT_LOCKED' });
        }

        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: 5 - attempts,
        });
      }

      // Reset login attempts
      await query(
        'UPDATE users SET login_attempts = 0, locked_until = null, last_login = NOW() WHERE id = $1',
        [user.id]
      );

      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token
      await query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [user.id, refreshToken, req.ip, req.headers['user-agent']]
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id, email: user.email,
          firstName: user.first_name, lastName: user.last_name,
          role: user.role, avatar: user.avatar_url,
        },
      });
    } catch (err) { next(err); }
  }
);

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required', code: 'MISSING_TOKEN' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' });
    }

    const { rows } = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND revoked = false AND expires_at > NOW()',
      [refreshToken, decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Refresh token revoked or expired', code: 'TOKEN_REVOKED' });
    }

    const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (!userRows.length) return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });

    const tokens = generateTokens(userRows[0]);

    // Rotate refresh token
    await query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [decoded.id, tokens.refreshToken]
    );

    res.json(tokens);
  } catch (err) { next(err); }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked = true WHERE token = $1 AND user_id = $2', [refreshToken, req.user.id]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validateBody,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const { rows } = await query(
        `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3 RETURNING id`,
        [resetToken, expires, email]
      );

      // Always return success (prevent email enumeration)
      const devData = rows.length && process.env.NODE_ENV !== 'production'
        ? { resetToken, resetUrl: `http://localhost:3000/reset-password/${resetToken}` }
        : {};

      res.json({ message: 'If this email exists, a reset link has been sent.', ...devData });
    } catch (err) { next(err); }
  }
);

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)],
  validateBody,
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const hash = await bcrypt.hash(password, 12);

      const { rows } = await query(
        `UPDATE users SET password_hash = $1, reset_token = null, reset_token_expires = null
         WHERE reset_token = $2 AND reset_token_expires > NOW()
         RETURNING id`,
        [hash, token]
      );

      if (!rows.length) {
        return res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_TOKEN' });
      }

      // Revoke all refresh tokens
      await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [rows[0].id]);

      res.json({ message: 'Password reset successfully. Please login with your new password.' });
    } catch (err) { next(err); }
  }
);

// ─── Social Login Simulation ──────────────────────────────────────────────────
router.post('/social-login', async (req, res, next) => {
  try {
    const { provider, token: socialToken, email, name } = req.body;

    if (!['google', 'facebook', 'github'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
    }

    // Simulate social token validation
    if (!socialToken || socialToken === 'invalid_token') {
      return res.status(401).json({ error: 'Invalid social token', code: 'INVALID_SOCIAL_TOKEN' });
    }

    const [firstName, ...lastParts] = (name || 'Social User').split(' ');
    const lastName = lastParts.join(' ') || 'User';

    // Upsert user
    const { rows } = await query(`
      INSERT INTO users (email, first_name, last_name, social_provider, social_id, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, 'active', true)
      ON CONFLICT (email) DO UPDATE
        SET last_login = NOW(), social_provider = EXCLUDED.social_provider
      RETURNING *
    `, [email, firstName, lastName, provider, `${provider}_${Date.now()}`]);

    const { accessToken, refreshToken } = generateTokens(rows[0]);
    res.json({ accessToken, refreshToken, user: { id: rows[0].id, email: rows[0].email, role: rows[0].role } });
  } catch (err) { next(err); }
});

// ─── Get Current User ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
