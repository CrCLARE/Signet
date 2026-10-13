 /**
 * Signet - User authentication
 * Registration, login, and requireAuth middleware
 */

import { json, uuid, hashPassword, readJson, getBearerToken, constantTimeEqual } from './utils.js';
import { signJwt, verifyJwt } from './jwt.js';

// ============================================================
// Configuration
// ============================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_MAX = 32;
const PASSWORD_MIN = 8;
const DEFAULT_TOKEN_TTL = 30 * 24 * 3600; // 30 days

// ============================================================
// POST /api/auth/register
// ============================================================

export async function register(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { email, nickname, password } = body;

  // Validation
  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: 'Invalid email format' }, 400);
  }
  if (!nickname || nickname.length > NICKNAME_MAX) {
    return json({ error: `Nickname must be 1-${NICKNAME_MAX} characters` }, 400);
  }
  if (!password || password.length < PASSWORD_MIN) {
    return json({ error: `Password must be at least ${PASSWORD_MIN} characters` }, 400);
  }

  const emailNorm = email.toLowerCase();

  // Uniqueness check
  const exists = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(emailNorm).first();
  if (exists) return json({ error: 'Email already registered' }, 409);

  // Hash and insert
  const { hash, salt } = await hashPassword(password);
  const id = uuid();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO users (id, email, nickname, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, emailNorm, nickname, hash, salt, now).run();

  // Sign session
  const ttl = parseInt(env.USER_TOKEN_TTL || DEFAULT_TOKEN_TTL, 10);
  const token = await signJwt(
    { uid: id, email: emailNorm, role: 'user' },
    env.JWT_SECRET,
    ttl
  );

  return json({
    token,
    user: { id, email: emailNorm, nickname },
    expires_in: ttl
  });
}

// ============================================================
// POST /api/auth/login
// ============================================================

export async function login(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { email, password } = body;
  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const emailNorm = email.toLowerCase();

  const user = await env.DB.prepare(
    'SELECT id, email, nickname, password_hash, password_salt FROM users WHERE email = ?'
  ).bind(emailNorm).first();

  // Always return the same error for missing user vs wrong password
  if (!user) return json({ error: 'Invalid email or password' }, 401);

  const { hash } = await hashPassword(password, user.password_salt);
  if (!constantTimeEqual(hash, user.password_hash)) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const ttl = parseInt(env.USER_TOKEN_TTL || DEFAULT_TOKEN_TTL, 10);
  const token = await signJwt(
    { uid: user.id, email: user.email, role: 'user' },
    env.JWT_SECRET,
    ttl
  );

  return json({
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname },
    expires_in: ttl
  });
}

// ============================================================
// requireAuth - middleware for protected routes
// ============================================================

/**
 * Verify the request's Bearer token and load the user.
 * Returns the user object on success, or null on failure.
 * Callers must return 401 when null is returned.
 */
export async function requireAuth(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return null;

  // Reject admin tokens that somehow reach user routes
  if (payload.role === 'admin') return null;

  const user = await env.DB.prepare(
    'SELECT id, email, nickname, created_at FROM users WHERE id = ?'
  ).bind(payload.uid).first();

  return user || null;
}
