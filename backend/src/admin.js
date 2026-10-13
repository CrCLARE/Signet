 /**
 * Signet - Admin API
 *
 * All routes here require a valid admin JWT (see admin-auth.js).
 * Admin credentials live in environment variables, not in the DB.
 *
 * Every mutating action is written to audit_log.
 */

import { json, uuid, hashPassword, readJson } from './utils.js';
import { requireAdmin } from './admin-auth.js';

// ============================================================
// Audit helper
// ============================================================

async function writeAudit(env, { adminId, action, target, detail }) {
  await env.DB.prepare(
    `INSERT INTO audit_log (id, admin_id, action, target, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    uuid(),
    adminId,
    action,
    target || '',
    JSON.stringify(detail || {}),
    Date.now()
  ).run();
}

// ============================================================
// GET /api/admin/stats
// ============================================================

export async function getStats(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const [
    totalLicenses,
    bannedLicenses,
    manualLicenses,
    totalUsers,
    totalProducts,
    paidOrders
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS c FROM licenses').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM licenses WHERE banned = 1').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM licenses WHERE manual = 1').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM products').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM orders WHERE status = 2').first()
  ]);

  return json({
    licenses: totalLicenses.c,
    banned: bannedLicenses.c,
    manual: manualLicenses.c,
    users: totalUsers.c,
    products: totalProducts.c,
    orders: paidOrders.c
  });
}

// ============================================================
// GET /api/admin/licenses?q=&banned=&page=
// ============================================================

export async function listLicenses(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const banned = url.searchParams.get('banned');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 50;
  const offset = (page - 1) * perPage;

  const where = [];
  const params = [];

  if (q) {
    where.push(`(
      p.name LIKE ? OR
      p.product_uid LIKE ? OR
      u.nickname LIKE ? OR
      u.email LIKE ? OR
      u.id LIKE ? OR
      l.note LIKE ? OR
      l.ban_reason LIKE ?
    )`);
    const pat = `%${q}%`;
    params.push(pat, pat, pat, pat, pat, pat, pat);
  }
  if (banned === 'true')  where.push('l.banned = 1');
  if (banned === 'false') where.push('l.banned = 0');

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = await env.DB.prepare(`
    SELECT
      l.id AS license_id,
      l.product_id,
      l.user_id,
      l.fingerprint,
      l.issued_at,
      l.banned,
      l.note,
      l.manual,
      l.ban_reason,
      p.name        AS product_name,
      p.product_uid AS product_uid,
      u.nickname    AS user_nickname,
      u.email       AS user_email
    FROM licenses l
    LEFT JOIN products p ON p.id = l.product_id
    LEFT JOIN users u    ON u.id = l.user_id
    ${whereSql}
    ORDER BY l.issued_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, perPage, offset).all();

  const total = await env.DB.prepare(`
    SELECT COUNT(*) AS c
    FROM licenses l
    LEFT JOIN products p ON p.id = l.product_id
    LEFT JOIN users u    ON u.id = l.user_id
    ${whereSql}
  `).bind(...params).first();

  const cleaned = (rows.results || []).map(r => ({
    ...r,
    user_nickname: r.user_nickname || (r.manual ? 'Manual grant' : '(unknown)'),
    user_email: r.user_email || '—'
  }));

  return json({
    page,
    per_page: perPage,
    total: total.c,
    rows: cleaned
  });
}

// ============================================================
// POST /api/admin/ban
// body: { license_id, reason }
// ============================================================

export async function banLicense(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { license_id, reason } = body;
  if (!license_id) return json({ error: 'Missing license_id' }, 400);
  if (!reason || !reason.trim()) {
    return json({ error: 'Reason is required' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT id, product_id, user_id, banned FROM licenses WHERE id = ?'
  ).bind(license_id).first();

  if (!row) return json({ error: 'License not found' }, 404);
  if (row.banned === 1) return json({ error: 'License already banned' }, 409);

  await env.DB.prepare(
    'UPDATE licenses SET banned = 1, ban_reason = ? WHERE id = ?'
  ).bind(reason.trim(), license_id).run();

  await writeAudit(env, {
    adminId: admin.username,
    action: 'ban_license',
    target: license_id,
    detail: {
      reason: reason.trim(),
      product_id: row.product_id,
      user_id: row.user_id
    }
  });

  return json({ ok: true });
}

// ============================================================
// POST /api/admin/unban
// body: { license_id, reason }
// ============================================================

export async function unbanLicense(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { license_id, reason } = body;
  if (!license_id) return json({ error: 'Missing license_id' }, 400);

  const row = await env.DB.prepare(
    'SELECT id, banned, ban_reason FROM licenses WHERE id = ?'
  ).bind(license_id).first();

  if (!row) return json({ error: 'License not found' }, 404);
  if (row.banned === 0) return json({ error: 'License is not banned' }, 409);

  const oldReason = row.ban_reason || '—';
  const today = new Date().toISOString().slice(0, 10);
  const note = [
    `Unbanned on ${today}`,
    `Previous ban reason: ${oldReason}`,
    `Unban reason: ${reason || '—'}`
  ].join('\n');

  await env.DB.prepare(
    'UPDATE licenses SET banned = 0, ban_reason = ?, note = ? WHERE id = ?'
  ).bind('', note, license_id).run();

  await writeAudit(env, {
    adminId: admin.username,
    action: 'unban_license',
    target: license_id,
    detail: { old_reason: oldReason, unban_reason: reason || '' }
  });

  return json({ ok: true });
}

// ============================================================
// PATCH /api/admin/licenses/:id
// body: { note }
// ============================================================

export async function updateLicense(request, env, licenseId) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const note = (body.note || '').trim().slice(0, 500);

  const row = await env.DB.prepare(
    'SELECT id, note FROM licenses WHERE id = ?'
  ).bind(licenseId).first();
  if (!row) return json({ error: 'License not found' }, 404);

  await env.DB.prepare(
    'UPDATE licenses SET note = ? WHERE id = ?'
  ).bind(note, licenseId).run();

  await writeAudit(env, {
    adminId: admin.username,
    action: 'update_license_note',
    target: licenseId,
    detail: { old: row.note, new: note }
  });

  return json({ ok: true, note });
}

// ============================================================
// POST /api/admin/grant
// body: { user_id_or_email, note }
//
// Grant Pro access to a user by inserting a virtual paid order.
// The order number is prefixed with "MANUAL-" so it can never
// be confused with a real provider order.
// ============================================================

export async function grantProToUser(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const target = (body.user_id_or_email || '').trim();
  const note = (body.note || '').trim().slice(0, 500);

  if (!target) return json({ error: 'user_id_or_email is required' }, 400);

  let user;
  if (target.includes('@')) {
    user = await env.DB.prepare(
      'SELECT id, email, nickname FROM users WHERE email = ?'
    ).bind(target.toLowerCase()).first();
  } else {
    user = await env.DB.prepare(
      'SELECT id, email, nickname FROM users WHERE id = ?'
    ).bind(target).first();
  }
  if (!user) return json({ error: 'User not found' }, 404);

  // One order per user
  const existing = await env.DB.prepare(
    'SELECT id, order_no FROM orders WHERE bound_user_id = ? LIMIT 1'
  ).bind(user.id).first();

  if (existing) {
    return json({
      error: 'User already has an order bound',
      existing_order: existing.order_no
    }, 409);
  }

  const now = Date.now();
  const virtualOrderNo = `MANUAL-${now}-${uuid().slice(0, 8)}`;

  await env.DB.prepare(
    `INSERT INTO orders
       (id, order_no, provider, provider_user, provider_raw, amount, status, bound_user_id, bound_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uuid(),
    virtualOrderNo,
    'manual',
    admin.username,
    JSON.stringify({ granted_by: admin.username, note }),
    '0.00',
    2,
    user.id,
    now,
    now
  ).run();

  await writeAudit(env, {
    adminId: admin.username,
    action: 'grant_pro',
    target: user.id,
    detail: {
      user_email: user.email,
      user_nickname: user.nickname,
      virtual_order_no: virtualOrderNo,
      note
    }
  });

  return json({
    ok: true,
    user_id: user.id,
    email: user.email,
    nickname: user.nickname,
    virtual_order_no: virtualOrderNo
  });
}

// ============================================================
// GET /api/admin/users?q=
// ============================================================

export async function listUsers(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  let query, params;
  if (q) {
    query = `
      SELECT
        id, email, nickname, created_at,
        (SELECT COUNT(*) FROM orders   WHERE bound_user_id = users.id) AS has_order,
        (SELECT COUNT(*) FROM products WHERE user_id       = users.id) AS product_count,
        (SELECT COUNT(*) FROM licenses WHERE user_id       = users.id) AS license_count
      FROM users
      WHERE email LIKE ? OR nickname LIKE ? OR id LIKE ?
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const pat = `%${q}%`;
    params = [pat, pat, pat];
  } else {
    query = `
      SELECT
        id, email, nickname, created_at,
        (SELECT COUNT(*) FROM orders   WHERE bound_user_id = users.id) AS has_order,
        (SELECT COUNT(*) FROM products WHERE user_id       = users.id) AS product_count,
        (SELECT COUNT(*) FROM licenses WHERE user_id       = users.id) AS license_count
      FROM users
      ORDER BY created_at DESC
      LIMIT 50
    `;
    params = [];
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return json(results || []);
}

// ============================================================
// POST /api/admin/users/reset-password
// body: { email, new_password }
// ============================================================

export async function adminResetPassword(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const email = (body.email || '').trim().toLowerCase();
  const newPassword = (body.new_password || '').trim();

  if (!email) return json({ error: 'Email is required' }, 400);
  if (newPassword.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const target = await env.DB.prepare(
    'SELECT id, email, nickname FROM users WHERE email = ?'
  ).bind(email).first();
  if (!target) return json({ error: 'User not found' }, 404);

  const { hash, salt } = await hashPassword(newPassword);
  await env.DB.prepare(
    'UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?'
  ).bind(hash, salt, target.id).run();

  await writeAudit(env, {
    adminId: admin.username,
    action: 'admin_reset_password',
    target: target.id,
    detail: { email: target.email, nickname: target.nickname }
  });

  return json({
    ok: true,
    email: target.email,
    nickname: target.nickname
  });
}

// ============================================================
// GET /api/admin/audit
// ============================================================

export async function listAudit(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200'
  ).all();

  return json(results || []);
}
