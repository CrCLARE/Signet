 /**
 * Signet - Product management (user side)
 *
 * A "product" is whatever the user wants to license: a game, a
 * desktop app, a plugin, a model, etc. The only requirement is
 * that it can be referenced by a unique UID when a license is
 * generated for it.
 *
 * All routes here require an authenticated user.
 */

import { json, uuid, shortId, readJson } from './utils.js';
import { requireAuth } from './auth.js';

// ============================================================
// Configuration
// ============================================================

const NAME_MAX = 64;
const PRODUCTS_PER_PAGE = 50;

// ============================================================
// GET /api/products
// List products belonging to the authenticated user
// ============================================================

export async function listProducts(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT id, name, product_uid, created_at
     FROM products
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  ).bind(user.id, PRODUCTS_PER_PAGE).all();

  return json(results || []);
}

// ============================================================
// POST /api/products
// Create a new product
// ============================================================

export async function createProduct(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // A user must have an active order before creating products
  const order = await env.DB.prepare(
    'SELECT id FROM orders WHERE bound_user_id = ? AND status = 2 LIMIT 1'
  ).bind(user.id).first();

  if (!order) {
    return json({
      error: 'No active license found. Please bind an order first.'
    }, 403);
  }

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const name = (body.name || '').trim();
  if (!name || name.length > NAME_MAX) {
    return json({ error: `Name must be 1-${NAME_MAX} characters` }, 400);
  }

  // Prevent duplicates within the same user's account
  const dup = await env.DB.prepare(
    'SELECT id FROM products WHERE user_id = ? AND name = ?'
  ).bind(user.id, name).first();
  if (dup) return json({ error: 'You already have a product with this name' }, 409);

  const id = uuid();
  const productUid = shortId(16).toUpperCase();
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO products (id, user_id, name, product_uid, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, user.id, name, productUid, now).run();

  return json({
    id,
    name,
    product_uid: productUid,
    created_at: now
  });
}

// ============================================================
// PATCH /api/products/:id
// Rename a product
// ============================================================

export async function updateProduct(request, env, productId) {
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const product = await env.DB.prepare(
    'SELECT id FROM products WHERE id = ? AND user_id = ?'
  ).bind(productId, user.id).first();
  if (!product) return json({ error: 'Product not found' }, 404);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const name = (body.name || '').trim();
  if (!name || name.length > NAME_MAX) {
    return json({ error: `Name must be 1-${NAME_MAX} characters` }, 400);
  }

  const dup = await env.DB.prepare(
    'SELECT id FROM products WHERE user_id = ? AND name = ? AND id != ?'
  ).bind(user.id, name, productId).first();
  if (dup) return json({ error: 'You already have a product with this name' }, 409);

  await env.DB.prepare(
    'UPDATE products SET name = ? WHERE id = ?'
  ).bind(name, productId).run();

  return json({ ok: true, name });
}

// ============================================================
// DELETE /api/products/:id
// Delete a product and all licenses issued for it
// ============================================================

export async function deleteProduct(request, env, productId) {
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const product = await env.DB.prepare(
    'SELECT id FROM products WHERE id = ? AND user_id = ?'
  ).bind(productId, user.id).first();
  if (!product) return json({ error: 'Product not found' }, 404);

  // Delete licenses first to respect the foreign key constraint
  await env.DB.prepare(
    'DELETE FROM licenses WHERE product_id = ?'
  ).bind(productId).run();

  await env.DB.prepare(
    'DELETE FROM products WHERE id = ?'
  ).bind(productId).run();

  return json({ ok: true });
}
