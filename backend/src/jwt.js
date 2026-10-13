 /**
 * Signet - Lightweight JWT (HS256) using WebCrypto
 * No external dependencies.
 */

// ============================================================
// Base64URL helpers
// ============================================================

function base64UrlEncode(input) {
  let bin = '';
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ============================================================
// HMAC key import
// ============================================================

async function importHmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// ============================================================
// Sign
// ============================================================

/**
 * Sign a JWT.
 * @param {object} payload       Custom claims (uid, role, etc.)
 * @param {string} secret        HMAC secret
 * @param {number} expiresInSec  Lifetime in seconds (default 30 days)
 * @returns {Promise<string>}    Signed JWT
 */
export async function signJwt(payload, secret, expiresInSec = 30 * 24 * 3600) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };

  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };

  const h = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const p = base64UrlEncode(enc.encode(JSON.stringify(body)));
  const data = `${h}.${p}`;

  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));

  return `${data}.${base64UrlEncode(new Uint8Array(sig))}`;
}

// ============================================================
// Verify
// ============================================================

/**
 * Verify a JWT.
 * @param {string} token     Signed JWT
 * @param {string} secret    HMAC secret
 * @returns {Promise<object|null>}  Payload if valid, null otherwise
 */
export async function verifyJwt(token, secret) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const enc = new TextEncoder();

  let valid = false;
  try {
    const key = await importHmacKey(secret);
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(s),
      enc.encode(data)
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(p)));
  } catch {
    return null;
  }

  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

// ============================================================
// Optional: decode without verification (for debugging only)
// ============================================================

/**
 * Decode a JWT payload without verifying the signature.
 * NEVER use this for authentication decisions.
 */
export function decodeJwtUnsafe(token) {
  try {
    const [, p] = token.split('.');
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(p)));
  } catch {
    return null;
  }
}
