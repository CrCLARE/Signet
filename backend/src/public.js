 /**
 * Signet - Public lookup endpoints
 *
 * These routes require no authentication. They allow anyone to
 * verify whether a product has a valid license — useful for
 * customers, partners, and third-party auditors.
 *
 * Privacy rule: never expose emails, order numbers, user IDs, or
 * anything that could identify the license holder. Only the
 * product name, the studio name, and the license status.
 */

import { json } from './utils.js';

// ============================================================
// Configuration
// ============================================================

const QUERY_MAX_LEN = 64;
const RESULTS_LIMIT = 20;

// ============================================================
// GET /api/public/search?q=<keyword>
//
// Fuzzy search across product name and studio name.
// Only returns products whose owner has a valid (paid) order.
// ============================================================

export async function searchProducts(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q) return json({ error: 'Missing query' }, 400);
  if (q.length > QUERY_MAX_LEN) return json({ error: 'Query too long' }, 400);

  const likePattern = `%${q}%`;

  try {
    const { results } = await env.DB.prepare(`
      SELECT
        p.name        AS product_name,
        p.product_uid AS product_uid,
        p.created_at  AS created_at,
        u.nickname    AS studio_name,
        (
          SELECT COUNT(*)
          FROM licenses l
          WHERE l.product_id = p.id AND l.banned = 1
        ) AS banned_count,
        (
          SELECT l.ban_reason
          FROM licenses l
          WHERE l.product_id = p.id AND l.banned = 1
          LIMIT 1
        ) AS ban_reason
      FROM products p
      JOIN users u ON u.id = p.user_id
      JOIN orders o ON o.bound_user_id = u.id
      WHERE o.status = 2
        AND (p.name LIKE ? OR u.nickname LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT ?
    `).bind(likePattern, likePattern, RESULTS_LIMIT).all();

    const now = Date.now();

    const list = (results || []).map(row => ({
      product_name: row.product_name,
      product_uid: row.product_uid,
      studio_name: row.studio_name,
      authorized: row.banned_count === 0,
      banned: row.banned_count > 0,
      ban_reason: row.ban_reason || '',
      created_at: row.created_at
    }));

    return json({
      query: q,
      total: list.length,
      queried_at: now,
      queried_at_text: formatDateTime(now),
      results: list
    });
  } catch (e) {
    console.error('[public] searchProducts failed:', e);
    return json({ error: 'Search failed' }, 500);
  }
}

// ============================================================
// GET /api/public/verify?uid=<product_uid>
//
// Exact lookup by product UID.
// Used to check a single license file against the registry.
// ============================================================

export async function verifyByUid(request, env) {
  const url = new URL(request.url);
  const uid = (url.searchParams.get('uid') || '').trim().toUpperCase();
  const now = Date.now();

  if (!uid) return json({ error: 'Missing uid' }, 400);

  const row = await env.DB.prepare(`
    SELECT
      p.id          AS product_id,
      p.name        AS product_name,
      p.product_uid AS product_uid,
      p.created_at  AS created_at,
      u.nickname    AS studio_name
    FROM products p
    JOIN users u ON u.id = p.user_id
    JOIN orders o ON o.bound_user_id = u.id
    WHERE o.status = 2 AND p.product_uid = ?
    LIMIT 1
  `).bind(uid).first();

  if (!row) {
    return json({
      authorized: false,
      uid,
      queried_at: now,
      queried_at_text: formatDateTime(now)
    });
  }

  const banInfo = await env.DB.prepare(
    'SELECT ban_reason FROM licenses WHERE product_id = ? AND banned = 1 LIMIT 1'
  ).bind(row.product_id).first();

  const isBanned = !!banInfo;

  return json({
    authorized: !isBanned,
    banned: isBanned,
    ban_reason: isBanned ? (banInfo.ban_reason || '') : '',
    product_name: row.product_name,
    product_uid: row.product_uid,
    studio_name: row.studio_name,
    created_at: row.created_at,
    queried_at: now,
    queried_at_text: formatDateTime(now)
  });
}

// ============================================================
// Helpers
// ============================================================

/**
 * Format a unix ms timestamp as a UTC datetime string.
 * All public endpoints report UTC to avoid timezone confusion.
 */
function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}
