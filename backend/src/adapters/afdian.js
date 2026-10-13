 /**
 * Signet - Afdian adapter
 *
 * Required env vars:
 *   AFDIAN_USER_ID - creator user_id from the Afdian developer dashboard
 *   AFDIAN_TOKEN   - API token from the Afdian developer dashboard
 *
 * Webhook URL to configure in the Afdian dashboard:
 *   https://<your-worker>/api/webhook/afdian
 */

import { json, md5, pemToArrayBuffer } from '../utils.js';
import { normalizeOrder } from './index.js';

// ============================================================
// Constants
// ============================================================

const NAME = 'afdian';
const LABEL = 'Afdian';

// Afdian's official public key, used to verify webhook signatures.
// This is a fixed value published by the platform, not a secret.
const AFDIAN_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwwdaCg1Bt+UKZKs0R54y
lYnuANma49IpgoOwNmk3a0rhg/PQuhUJ0EOZSowIC44l0K3+fqGns3Ygi4AfmEfS
4EKbdk1ahSxu7Zkp2rHMt+R9GarQFQkwSS/5x1dYiHNVMiR8oIXDgjmvxuNes2Cr
8fw9dEF0xNBKdkKgG2qAawcN1nZrdyaKWtPVT9m2Hl0ddOO9thZmVLFOb9NVzgYf
jEgI+KWX6aY19Ka/ghv/L4t1IXmz9pctablN5S0CRWpJW3Cn0k6zSXgjVdKm4uN7
jRlgSRaf/Ind46vMCm3N2sgwxu/g3bnooW+db0iLo13zzuvyn727Q3UDQ0MmZcEW
MQIDAQAB
-----END PUBLIC KEY-----`;

// Afdian's own API endpoints
const AFDIAN_API_QUERY_ORDER = 'https://ifdian.net/api/open/query-order';

// The sample order number used in Afdian's documentation.
// Its presence in a webhook almost certainly means a test push.
const SAMPLE_ORDER_NO = '202106232138371083454010626';

// ============================================================
// Signature verification (webhook)
// ============================================================

/**
 * Verify an Afdian webhook signature.
 * sign_str = out_trade_no + user_id + plan_id + total_amount
 */
async function verifyWebhookSignature(order, signBase64) {
  if (!signBase64 || typeof signBase64 !== 'string') return false;

  try {
    const signStr = `${order.out_trade_no}${order.user_id}${order.plan_id}${order.total_amount}`;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(AFDIAN_PUBLIC_KEY),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(atob(signBase64), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      enc.encode(signStr)
    );
  } catch (e) {
    console.error('[afdian] signature verification failed:', e);
    return false;
  }
}

// ============================================================
// API signature (outbound requests)
// ============================================================

/**
 * Compute the sign field for an outbound API request.
 * sign = md5(token + "params" + paramsStr + "ts" + ts + "user_id" + userId)
 */
function buildApiSign(token, paramsStr, ts, userId) {
  const kv = `params${paramsStr}ts${ts}user_id${userId}`;
  return md5(token + kv);
}

// ============================================================
// Adapter interface
// ============================================================

const adapter = {
  name: NAME,
  label: LABEL,

  isConfigured(env) {
    return !!(env.AFDIAN_USER_ID && env.AFDIAN_TOKEN);
  },

  // ----------------------------------------------------------
  // POST /api/webhook/afdian
  // ----------------------------------------------------------
  async handleWebhook(request, env) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ec: 200, em: 'invalid json' }, 200);
    }

    const order = body?.data?.order;
    if (!order) return json({ ec: 200, em: 'ignored' }, 200);

    const orderNo = order.out_trade_no;
    const sign = body.data.sign;

    // Reject the sample order from Afdian's documentation
    if (orderNo === SAMPLE_ORDER_NO) {
      console.warn('[afdian] sample order ignored');
      return json({ ec: 200, em: 'sample ignored' }, 200);
    }

    // Reject payloads with no signature (test pushes)
    if (!sign || typeof sign !== 'string' || sign.length < 20) {
      console.warn('[afdian] missing sign, treated as test:', orderNo);
      return json({ ec: 200, em: 'test data ignored' }, 200);
    }

    // Verify signature
    const valid = await verifyWebhookSignature(order, sign);
    if (!valid) {
      console.warn('[afdian] invalid signature:', orderNo);
      return json({ ec: 200, em: 'sign failed' }, 200);
    }

    // Only accept paid orders
    if (Number(order.status) !== 2) {
      return json({ ec: 200, em: 'not paid' }, 200);
    }

    // Idempotent insert
    const existing = await env.DB.prepare(
      'SELECT id FROM orders WHERE order_no = ?'
    ).bind(orderNo).first();

    if (existing) {
      return json({ ec: 200, em: 'duplicate' }, 200);
    }

    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO orders
        (id, order_no, provider, provider_user, amount, status, provider_raw, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      orderNo,
      NAME,
      order.user_id || null,
      String(order.total_amount || '0'),
      2,
      JSON.stringify(order),
      now
    ).run();

    return json({ ec: 200, em: 'ok' }, 200);
  },

  // ----------------------------------------------------------
  // Called by /api/license/bind when the order is not in D1
  // ----------------------------------------------------------
  async queryOrder(orderNo, env) {
    if (!adapter.isConfigured(env)) return null;

    const ts = Math.floor(Date.now() / 1000);
    const paramsStr = JSON.stringify({ out_trade_no: orderNo });
    const sign = buildApiSign(env.AFDIAN_TOKEN, paramsStr, ts, env.AFDIAN_USER_ID);

    let res;
    try {
      res = await fetch(AFDIAN_API_QUERY_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: env.AFDIAN_USER_ID,
          params: paramsStr,
          ts,
          sign
        })
      });
    } catch (e) {
      console.error('[afdian] queryOrder fetch failed:', e);
      return null;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      return null;
    }

    if (data.ec !== 200) return null;

    const list = data.data?.list || [];
    const match = list.find(o => o.out_trade_no === orderNo);
    if (!match) return null;

    return normalizeOrder({
      order_no: match.out_trade_no,
      amount: String(match.total_amount || '0'),
      status: Number(match.status) === 2 ? 'paid' : 'pending',
      buyer_id: match.user_id || null,
      paid_at: match.create_time ? match.create_time * 1000 : null,
      raw: match
    });
  }
};

export default adapter;
