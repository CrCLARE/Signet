 /**
 * Signet - License issuance
 *
 * Signs offline license files with Ed25519. Once issued, a license
 * is valid forever — no server round-trip is required to verify it.
 *
 * The client (the product being protected) embeds the corresponding
 * public key and verifies the signature locally.
 *
 * Required env vars:
 *   LICENSE_SIGN_PRIVATE_KEY - Ed25519 private key (32 bytes, hex)
 *   LICENSE_SIGN_PUBLIC_KEY  - Ed25519 public key (32 bytes, hex)
 */

import * as ed25519 from '@noble/ed25519';
import { json, uuid, bytesToHex, hexToBytes } from './utils.js';
import { requireAuth } from './auth.js';

// ============================================================
// Configuration
// ============================================================

const LICENSE_VERSION = 1;

// ============================================================
// POST /api/products/:id/license
// Issue (or re-issue) a license for a product
// ============================================================

export async function generateLicense(request, env, productId) {
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  if (!env.LICENSE_SIGN_PRIVATE_KEY || !env.LICENSE_SIGN_PUBLIC_KEY) {
    console.error('[licenses] signing keys not configured');
    return json({ error: 'License signing not configured' }, 500);
  }

  // Confirm the product exists and belongs to the user
  const product = await env.DB.prepare(
    'SELECT id, name, product_uid FROM products WHERE id = ? AND user_id = ?'
  ).bind(productId, user.id).first();
  if (!product) return json({ error: 'Product not found' }, 404);

  // Confirm the user has an active order
  const order = await env.DB.prepare(
    'SELECT id FROM orders WHERE bound_user_id = ? AND status = 2 LIMIT 1'
  ).bind(user.id).first();
  if (!order) {
    return json({ error: 'No active license found' }, 403);
  }

  // Refuse if any license for this product has been banned
  const banned = await env.DB.prepare(
    'SELECT id FROM licenses WHERE product_id = ? AND user_id = ? AND banned = 1 LIMIT 1'
  ).bind(product.id, user.id).first();
  if (banned) {
    return json({
      error: 'This license has been revoked. Contact support if you believe this is an error.'
    }, 403);
  }

  const now = Math.floor(Date.now() / 1000);

  // Build the payload — every field here is signed
  const payload = {
    v: LICENSE_VERSION,
    product_uid: product.product_uid,
    product_name: product.name,
    user_id: user.id,
    fingerprint: user.id,     // same as user_id; kept for forward compat
    issued_at: now
  };

  // Deterministic message: fields joined by "|"
  // The client MUST reassemble this string in exactly the same order.
  const message = [
    payload.v,
    payload.product_uid,
    payload.product_name,
    payload.user_id,
    payload.fingerprint,
    payload.issued_at
  ].join('|');

  // Sign with Ed25519
  let signature;
  try {
    const privKey = hexToBytes(env.LICENSE_SIGN_PRIVATE_KEY);
    const sigBytes = await ed25519.signAsync(
      new TextEncoder().encode(message),
      privKey
    );
    signature = bytesToHex(sigBytes);
  } catch (e) {
    console.error('[licenses] signing failed:', e);
    return json({ error: 'License signing failed' }, 500);
  }

  // Record the issuance (for audit, traceability, and revocation)
  await env.DB.prepare(
    `INSERT INTO licenses
       (id, product_id, user_id, fingerprint, issued_at, banned, manual)
     VALUES (?, ?, ?, ?, ?, 0, 0)`
  ).bind(
    uuid(),
    product.id,
    user.id,
    payload.fingerprint,
    now
  ).run();

  return json({
    ...payload,
    signature
  });
}
