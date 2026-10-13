 /**
 * Signet - Worker entry point
 *
 * Route overview:
 *   GET    /                                 Health check
 *   GET    /api/adapters                     List configured payment adapters
 *   POST   /api/webhook/:provider            Payment webhook (per provider)
 *
 *   GET    /api/public/search                Fuzzy product/studio lookup
 *   GET    /api/public/verify                Exact lookup by product_uid
 *
 *   POST   /api/auth/register                User registration
 *   POST   /api/auth/login                   User login
 *
 *   POST   /api/license/bind                 Bind an order to the current user
 *   GET    /api/license/status               Current user's license status
 *
 *   GET    /api/products                     List user's products
 *   POST   /api/products                     Create a product
 *   PATCH  /api/products/:id                 Rename a product
 *   DELETE /api/products/:id                 Delete a product
 *   POST   /api/products/:id/license         Issue / re-issue a license
 *
 *   POST   /api/admin/login                  Admin login
 *   GET    /api/admin/stats                  Aggregate stats
 *   GET    /api/admin/licenses               List licenses
 *   GET    /api/admin/users                  Search users
 *   GET    /api/admin/audit                  Audit log
 *   POST   /api/admin/ban                    Ban a license
 *   POST   /api/admin/unban                  Unban a license
 *   POST   /api/admin/grant                  Grant Pro access to a user
 *   POST   /api/admin/users/reset-password   Reset a user's password
 *   PATCH  /api/admin/licenses/:id           Update a license note
 */

import { json, cors } from './utils.js';

import { register, login } from './auth.js';
import { adminLogin } from './admin-auth.js';

import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from './products.js';

import { generateLicense } from './licenses.js';
import { searchProducts, verifyByUid } from './public.js';

import {
  getStats,
  listLicenses,
  listUsers,
  listAudit,
  banLicense,
  unbanLicense,
  updateLicense,
  grantProToUser,
  adminResetPassword
} from './admin.js';

import { getAdapter, listAdapters } from './adapters/index.js';

// ============================================================
// License binding
// ============================================================

/**
 * POST /api/license/bind
 * body: { order_no, provider }
 *
 * Tries the local orders table first; if not found, asks the
 * provider's adapter to query the order remotely, then inserts it.
 */
async function bindOrder(request, env) {
  const { requireAuth } = await import('./auth.js');
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const orderNo = (body.order_no || '').trim();
  const provider = (body.provider || '').trim().toLowerCase();

  if (!orderNo) return json({ error: 'Order number is required' }, 400);
  if (!provider) return json({ error: 'Provider is required' }, 400);

  const adapter = getAdapter(provider);
  if (!adapter) return json({ error: `Unknown provider: ${provider}` }, 400);

  // ---- Reject virtual (admin-issued) order numbers ----
  // Users must not be able to "bind" an admin grant.
  if (/^MANUAL-/i.test(orderNo)) {
    return json({ error: 'Invalid order number' }, 400);
  }

  // ---- Look up locally first ----
  let order = await env.DB.prepare(
    'SELECT id, status, bound_user_id, provider FROM orders WHERE order_no = ? AND provider = ?'
  ).bind(orderNo, provider).first();

  // ---- Fall back to remote query ----
  if (!order) {
    if (!adapter.isConfigured(env)) {
      return json({ error: 'Provider not available' }, 503);
    }

    const remote = await adapter.queryOrder(orderNo, env);
    if (!remote || remote.status !== 'paid') {
      return json({ error: 'Order not found or not paid' }, 404);
    }

    const newId = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO orders
         (id, order_no, provider, provider_user, provider_raw, amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      newId,
      remote.order_no,
      provider,
      remote.buyer_id || null,
      JSON.stringify(remote.raw || {}),
      remote.amount,
      2,
      now
    ).run();

    order = { id: newId, status: 2, bound_user_id: null, provider };
  }

  // ---- Binding rules ----
  if (order.status !== 2) {
    return json({ error: 'Order is not paid' }, 400);
  }
  if (order.bound_user_id && order.bound_user_id !== user.id) {
    return json({ error: 'Order is already bound to another account' }, 409);
  }
  if (order.bound_user_id === user.id) {
    return json({ error: 'Order is already bound to your account' }, 200);
  }

  // ---- One order per user ----
  const existing = await env.DB.prepare(
    'SELECT id FROM orders WHERE bound_user_id = ? LIMIT 1'
  ).bind(user.id).first();
  if (existing) {
    return json({
      error: 'You already have an order bound to this account'
    }, 409);
  }

  await env.DB.prepare(
    'UPDATE orders SET bound_user_id = ?, bound_at = ? WHERE order_no = ?'
  ).bind(user.id, Date.now(), orderNo).run();

  return json({ ok: true, message: 'Order bound successfully' });
}

/**
 * GET /api/license/status
 * Returns the current user's license status.
 */
async function getLicenseStatus(request, env) {
  const { requireAuth } = await import('./auth.js');
  const user = await requireAuth(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const order = await env.DB.prepare(
    'SELECT order_no, amount, provider, bound_at FROM orders WHERE bound_user_id = ? LIMIT 1'
  ).bind(user.id).first();

  if (!order) return json({ active: false });

  return json({
    active: true,
    type: 'Pro',
    order_no: order.order_no,
    provider: order.provider,
    amount: order.amount,
    issued_at: order.bound_at,
    issued_at_text: formatDateTime(order.bound_at)
  });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

// ============================================================
// Worker entry
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin');

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env, origin) });
    }

    // Attach CORS to every response
    const wrap = (response) => {
      const headers = new Headers(response.headers);
      Object.entries(cors(env, origin)).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    };

    try {
      // ============================================================
      // Health check
      // ============================================================
      if (method === 'GET' && path === '/') {
        return wrap(json({ ok: true, service: 'signet', version: '1.0.0' }));
      }

      // ============================================================
      // Adapters metadata
      // ============================================================
      if (method === 'GET' && path === '/api/adapters') {
        return wrap(json({ adapters: listAdapters(env) }));
      }

      // ============================================================
      // Webhooks (per provider)
      // ============================================================
      const webhookMatch = path.match(/^\/api\/webhook\/([a-z0-9_-]+)$/i);
      if (method === 'POST' && webhookMatch) {
        const provider = webhookMatch[1].toLowerCase();
        const adapter = getAdapter(provider);
        if (!adapter) {
          return wrap(json({ error: `Unknown provider: ${provider}` }, 404));
        }
        return wrap(await adapter.handleWebhook(request, env, ctx));
      }

      // ============================================================
      // Public endpoints
      // ============================================================
      if (method === 'GET' && path === '/api/public/search') {
        return wrap(await searchProducts(request, env));
      }
      if (method === 'GET' && path === '/api/public/verify') {
        return wrap(await verifyByUid(request, env));
      }

      // ============================================================
      // User authentication
      // ============================================================
      if (method === 'POST' && path === '/api/auth/register') {
        return wrap(await register(request, env));
      }
      if (method === 'POST' && path === '/api/auth/login') {
        return wrap(await login(request, env));
      }

      // ============================================================
      // License binding
      // ============================================================
      if (method === 'POST' && path === '/api/license/bind') {
        return wrap(await bindOrder(request, env));
      }
      if (method === 'GET' && path === '/api/license/status') {
        return wrap(await getLicenseStatus(request, env));
      }

      // ============================================================
      // Products
      // ============================================================
      if (method === 'GET' && path === '/api/products') {
        return wrap(await listProducts(request, env));
      }
      if (method === 'POST' && path === '/api/products') {
        return wrap(await createProduct(request, env));
      }

      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productMatch) {
        const productId = productMatch[1];
        if (method === 'PATCH')  return wrap(await updateProduct(request, env, productId));
        if (method === 'DELETE') return wrap(await deleteProduct(request, env, productId));
      }

      const licenseMatch = path.match(/^\/api\/products\/([^/]+)\/license$/);
      if (method === 'POST' && licenseMatch) {
        return wrap(await generateLicense(request, env, licenseMatch[1]));
      }

      // ============================================================
      // Admin
      // ============================================================
      if (path.startsWith('/api/admin/')) {
        // Login does not require an existing admin token
        if (method === 'POST' && path === '/api/admin/login') {
          return wrap(await adminLogin(request, env));
        }

        if (method === 'GET'  && path === '/api/admin/stats')                 return wrap(await getStats(request, env));
        if (method === 'GET'  && path === '/api/admin/licenses')              return wrap(await listLicenses(request, env));
        if (method === 'GET'  && path === '/api/admin/users')                 return wrap(await listUsers(request, env));
        if (method === 'GET'  && path === '/api/admin/audit')                 return wrap(await listAudit(request, env));
        if (method === 'POST' && path === '/api/admin/ban')                   return wrap(await banLicense(request, env));
        if (method === 'POST' && path === '/api/admin/unban')                 return wrap(await unbanLicense(request, env));
        if (method === 'POST' && path === '/api/admin/grant')                 return wrap(await grantProToUser(request, env));
        if (method === 'POST' && path === '/api/admin/users/reset-password')  return wrap(await adminResetPassword(request, env));

        const adminLicMatch = path.match(/^\/api\/admin\/licenses\/([^/]+)$/);
        if (method === 'PATCH' && adminLicMatch) {
          return wrap(await updateLicense(request, env, adminLicMatch[1]));
        }
      }

      // ============================================================
      // 404
      // ============================================================
      return wrap(json({ error: 'Not Found' }, 404));

    } catch (err) {
      console.error('[signet] unhandled error:', err);
      return wrap(json({
        error: 'Internal server error',
        detail: err.message
      }, 500));
    }
  }
};
