 /**
 * Signet - Payment adapter registry
 *
 * Adapters provide a uniform interface for integrating different
 * payment providers. The core application never imports a specific
 * provider directly — it always goes through this registry.
 *
 * To add a new provider:
 *   1. Create ./<name>.js implementing the Adapter interface below
 *   2. Register it in the `registry` object
 *   3. Document its required env vars in ./README.md
 *
 * ----------------------------------------------------------------
 * Adapter interface
 * ----------------------------------------------------------------
 *
 * {
 *   name: string,
 *
 *   // Check whether all env vars required by this adapter are set.
 *   // Used by the /api/adapters endpoint to advertise availability.
 *   isConfigured(env): boolean
 *
 *   // Handle an incoming webhook from the payment platform.
 *   // Must return a Response. The core does not inspect it.
 *   // Return shape is decided by the adapter because each platform
 *   // expects its own acknowledgement format.
 *   handleWebhook(request, env, ctx): Promise<Response>
 *
 *   // Query a specific order by its order number.
 *   // Returns a normalized order object, or null if not found.
 *   // Used by /api/license/bind as a fallback when the order is
 *   // not yet present in our local database.
 *   queryOrder(orderNo, env): Promise<NormalizedOrder | null>
 * }
 *
 * ----------------------------------------------------------------
 * Normalized order object
 * ----------------------------------------------------------------
 *
 * {
 *   order_no: string,      // unique order identifier on the platform
 *   amount: string,        // payment amount as a string, e.g. "19.90"
 *   status: string,        // "paid" | "pending" | "refunded" | "failed"
 *   buyer_id: string|null, // platform-side user id (optional)
 *   paid_at: number|null,  // unix ms timestamp (optional)
 *   raw: object            // raw payload from the provider, for debugging
 * }
 */

import afdian from './afdian.js';

// ============================================================
// Registry
// ============================================================

/**
 * All available adapters, keyed by their `name`.
 * Register new adapters here.
 */
const registry = {
  afdian
};

// ============================================================
// Lookup
// ============================================================

/**
 * Get an adapter by name.
 * Returns null if not found.
 */
export function getAdapter(name) {
  if (!name || typeof name !== 'string') return null;
  return registry[name] || null;
}

/**
 * List adapters that are fully configured in the given env.
 * Returns an array of { name, isConfigured } objects.
 * Used by /api/adapters to advertise which providers are usable.
 */
export function listAdapters(env) {
  const out = [];
  for (const [name, adapter] of Object.entries(registry)) {
    let configured = false;
    try {
      configured = adapter.isConfigured(env) === true;
    } catch (e) {
      configured = false;
    }
    out.push({
      name,
      configured,
      label: adapter.label || name
    });
  }
  return out;
}

// ============================================================
// Normalization guard
// ============================================================

/**
 * Validate that an adapter's queryOrder() returned a well-formed object.
 * Returns the normalized order, or null if malformed.
 */
export function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const order_no = typeof raw.order_no === 'string' ? raw.order_no.trim() : '';
  if (!order_no) return null;

  const amount = typeof raw.amount === 'string'
    ? raw.amount
    : String(raw.amount ?? '0');

  const validStatuses = ['paid', 'pending', 'refunded', 'failed'];
  const status = validStatuses.includes(raw.status) ? raw.status : 'pending';

  return {
    order_no,
    amount,
    status,
    buyer_id: raw.buyer_id || null,
    paid_at: typeof raw.paid_at === 'number' ? raw.paid_at : null,
    raw: raw.raw || {}
  };
}