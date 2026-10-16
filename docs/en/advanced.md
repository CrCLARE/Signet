 # Advanced — Extending Signet

> **This is an advanced chapter.** It assumes you're comfortable with JavaScript,
> Cloudflare Workers, and the general structure of Signet. If you're just trying
> to deploy Signet, you don't need this page.

Once you have Signet running, you may want to extend it. This page covers the
four most common extensions and how to approach them.

## Adding a new payment adapter

Signet ships with one adapter (Afdian). Adding another takes about fifty lines.

### 1. Create the adapter file

Create `backend/src/adapters/<name>.js`. Your adapter must export three things:

```javascript
export default {
  name: 'stripe',
  label: 'Stripe',

  // Return true if all required env vars are present.
  isConfigured(env) {
    return !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  },

  // Handle an incoming webhook. Must return a Response.
  async handleWebhook(request, env, ctx) {
    // Verify signature, parse payload, insert into orders table
    return json({ ok: true });
  },

  // Query an order by its order number. Return a normalized order or null.
  async queryOrder(orderNo, env) {
    // ... fetch from the provider's API
    return {
      order_no: '...',
      amount: '19.90',
      status: 'paid',
      buyer_id: '...',
      paid_at: Date.now(),
      raw: { /* original payload */ }
    };
  }
};
```

2. Register it

Edit backend/src/adapters/index.js:

```javascript
import afdian from './afdian.js';
import stripe from './stripe.js';   // ← add

const registry = {
  afdian,
  stripe                              // ← add
};
```

3. Configure secrets

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

4. Deploy

```bash
npx wrangler deploy
```

The frontend will automatically show Stripe as an option on the bind page —
it reads the list from GET /api/adapters.

Key rules for adapters

· Never throw. Return null or false on failure. The core handles
  missing data gracefully; thrown exceptions break the request.
· Always return a Response from handleWebhook. Different providers expect
  different acknowledgement formats, so the adapter decides.
· Always normalize what queryOrder returns. Don't leak provider-specific
  field names into the core.
· Always verify signatures. See how afdian.js uses verifyWebhookSignature
  for the pattern.

---

Customizing the license format

The default license is a JSON object:

```json
{
  "v": 1,
  "product_uid": "A1B2C3D4E5F6G7H8",
  "product_name": "My Product",
  "user_id": "257b...",
  "fingerprint": "257b...",
  "issued_at": 1791198240,
  "signature": "d0654793aa6f..."
}
```

The signature covers the first six fields, joined by |:

```
1|A1B2C3D4E5F6G7H8|My Product|257b...|257b...|1791198240
```

If you want to change the license format, edit backend/src/licenses.js. Change
both sides — the signing code in the Worker and the verification code in your
client application must agree on the exact format.

Backward compatibility: If you change the format, bump the v field. Old
licenses will continue to verify as long as your client supports both versions.

---

Adding human verification (captcha)

Signet doesn't ship with captcha, but it's easy to add. We recommend
Cloudflare Turnstile — free, privacy-friendly, and it works without tracking.

Backend

Add a verification helper:

```javascript
async function verifyTurnstile(token, env) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token
    })
  });
  const data = await res.json();
  return data.success === true;
}
```

Call it at the top of register():

```javascript
export async function register(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const ok = await verifyTurnstile(body.captchaToken, env);
  if (!ok) return json({ error: 'Captcha verification failed' }, 400);

  // ... rest of register logic
}
```

Frontend

Add Turnstile's script and widget to register.html:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<form id="registerForm">
  <!-- ... existing fields ... -->
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
  <button type="submit">Create account</button>
</form>
```

Then pass the token when submitting:

```javascript
const captchaToken = document.querySelector('[name="cf-turnstile-response"]').value;
await AuthAPI.register({ email, nickname, password, captchaToken });
```

Other providers

· Google reCAPTCHA v3 — same pattern, different endpoint
· Geetest — works well in mainland China, requires paid plan for real traffic

We suggest abstracting captcha behind an adapter (like payment providers) if you
plan to support more than one.

---

Rebrading

To rename Signet to your own product, edit window.SIGNET_CONFIG in every HTML
file. See the finalize chapter for the full list of
fields.

Extracting config to a single file

If editing 11 HTML files is tedious, extract the config:

1. Create frontend/assets/config.js:

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  brandName: 'Your Product',
  // ...
};
```

2. Replace the inline config block in every HTML file with:

```html
<script src="/assets/config.js"></script>
```

3. Load it before auth.js.

This makes future rebranding a one-file change.

---

Adding email (password reset)

Signet deliberately ships without email support. If you want self-service password
reset, you'll need to integrate a provider.

Recommended: Resend (simple API, generous free tier).

1. Add a route:

```javascript
if (method === 'POST' && path === '/api/auth/forgot-password') {
  return wrap(await forgotPassword(request, env));
}
```

2. Implement it in auth.js:

```javascript
export async function forgotPassword(request, env) {
  const { email } = await readJson(request);
  if (!email) return json({ error: 'Email required' }, 400);

  const user = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  // Always return success — do not reveal whether the account exists
  if (user) {
    const token = uuid();
    await env.KV.put(`pwd-reset:${token}`, user.id, { expirationTtl: 1800 });
    await sendResetEmail(email, token, env);
  }
  return json({ ok: true });
}
```

3. Implement sendResetEmail using Resend's API.

You'll also need to add a KV binding to wrangler.toml.

Security note: Always return success regardless of whether the email
exists. Otherwise attackers can enumerate registered accounts.

---

XSS hardening

Signet uses escapeHtml() and escapeAttr() on all dynamic content. If you
extend the frontend, follow these rules.

Rule 1 — Prefer textContent over innerHTML

```javascript
// ✅ Safe
element.textContent = user.nickname;

// ❌ Dangerous if not escaped
element.innerHTML = user.nickname;
```

Rule 2 — Never build event handlers with string concatenation

```html
<!-- ❌ Dangerous -->
<button onclick="doThing('${userInput}')">Click</button>

<!-- ✅ Safe — use data attributes + event delegation -->
<button data-action="do-thing" data-value="${escapeAttr(userInput)}">Click</button>
```

```javascript
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="do-thing"]');
  if (!btn) return;
  doThing(btn.dataset.value);
});
```

Rule 3 — Validate URLs before injecting them into href

```javascript
function safeUrl(url) {
  if (!/^https?:\/\//i.test(url)) return '#';
  return url;
}
```

This blocks javascript: and data: URLs.

Rule 4 — Add a CSP header

In frontend/_headers:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.your-domain.com
```

Adjust the connect-src to include your Worker URL. This is optional but
recommended for production.
