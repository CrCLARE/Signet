 /**
 * Signet - Administrator authentication
 * Independent from the user auth system.
 *
 * Credentials live entirely in Workers environment variables:
 *   ADMIN_USERNAME        - administrator login name
 *   ADMIN_PASSWORD_HASH   - PBKDF2-SHA256 hash (hex)
 *   ADMIN_PASSWORD_SALT   - PBKDF2 salt (hex)
 *   ADMIN_JWT_SECRET      - separate HMAC secret for admin sessions
 */

import { json, getBearerToken, constantTimeEqual } from './utils.js';
import { signJwt, verifyJwt } from './jwt.js';

// ============================================================
// Configuration
// ============================================================

const DEFAULT_ADMIN_TTL = 12 * 3600; // 12 hours

// ============================================================
// Password hashing (must match the algorithm in utils.hashPassword)
// ============================================================

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(
    saltHex.match(/.{2}/g).map(h => parseInt(h, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================
// Configuration check
// ============================================================

function isConfigured(env) {
  return !!(
    env.ADMIN_USERNAME &&
    env.ADMIN_PASSWORD_HASH &&
    env.ADMIN_PASSWORD_SALT &&
    env.ADMIN_JWT_SECRET
  );
}

// ============================================================
// POST /api/admin/login
// ============================================================

export async function adminLogin(request, env) {
  if (!isConfigured(env)) {
    console.error('[admin-auth] missing required secrets');
    return json({ error: 'Admin account not configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { username, password } = body || {};
  if (!username || !password) {
    return json({ error: 'Username and password are required' }, 400);
  }

  // Username check first (constant-time to avoid leaks)
  if (!constantTimeEqual(username, env.ADMIN_USERNAME)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  // Password hash check
  const hash = await hashPassword(password, env.ADMIN_PASSWORD_SALT);
  if (!constantTimeEqual(hash, env.ADMIN_PASSWORD_HASH)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  // Sign admin JWT
  const ttl = parseInt(env.ADMIN_TOKEN_TTL || DEFAULT_ADMIN_TTL, 10);
  const token = await signJwt(
    { role: 'admin', username },
    env.ADMIN_JWT_SECRET,
    ttl
  );

  return json({
    ok: true,
    token,
    username,
    expires_in: ttl
  });
}

// ============================================================
// requireAdmin - middleware for admin routes
// ============================================================

/**
 * Verify the request's Bearer token and confirm it is an admin session.
 * Returns the payload ({ role, username, iat, exp }) on success,
 * or null on failure. Callers must return 401 when null is returned.
 */
export async function requireAdmin(request, env) {
  if (!isConfigured(env)) return null;

  const token = getBearerToken(request);
  if (!token) return null;

  const payload = await verifyJwt(token, env.ADMIN_JWT_SECRET);
  if (!payload) return null;
  if (payload.role !== 'admin') return null;

  return payload;
}
