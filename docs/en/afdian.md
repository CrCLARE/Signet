 # Configure Afdian

Afdian is a Chinese payment platform for creators. Signet ships with a built-in
adapter for it.

If you're not using Afdian, skip this page — you can still deploy Signet and use
the admin panel to grant access manually. For other providers, see
[Adapters](./en/adapters).

## What you'll do

- Get your Afdian `user_id` and API token
- Push them as Cloudflare secrets
- Configure the webhook URL
- Test the flow end-to-end

## Step 1 — Open the developer dashboard

Go to **[ifdian.net/dashboard/dev](https://ifdian.net/dashboard/dev)** and sign in.

You'll see two values you need:

- **user_id** — a hex string identifying your account
- **API Token** — a secret used to sign outbound requests

## Step 2 — Generate an API token

If you haven't already, click **Generate** next to the API Token field.

**Copy the token immediately.** Afdian only shows it once. If you lose it, you'll
need to generate a new one (which invalidates the old).

## Step 3 — Push secrets to Cloudflare

In your terminal:

```bash
npx wrangler secret put AFDIAN_USER_ID
npx wrangler secret put AFDIAN_TOKEN
```

Paste the corresponding values when prompted.

Step 4 — Configure the webhook URL

In the Afdian developer dashboard, find the Webhook URL field. Set it to:

```
https://signet-backend.<your-account>.workers.dev/api/webhook/afdian
```

Replace <your-account> with your actual Cloudflare Workers subdomain.

Click Send test. The dashboard should report success.

Step 5 — Verify the test

Open a second terminal and run:

```bash
npx wrangler tail
```

This streams live logs from your Worker. Now click Send test again in the
Afdian dashboard.

You should see a log line like:

```
[afdian] missing sign, treated as test: 202106232138371083454010626
```

This is expected — Afdian's test webhook doesn't include a valid signature, so
Signet correctly identifies it as a test and ignores it.

If you see a 500 error instead, one of the two secrets is misconfigured.

Step 6 — Create a product on Afdian

Before users can buy anything, you need to create a product on Afdian:

1. In the Afdian dashboard, go to My Plans (我的方案)
2. Create a new plan
3. Set a price (e.g. ¥19.90)
4. Note the plan_id — it will appear in the order webhook

For Signet's default template, the Pro plan is priced at ¥19.90. If you
change the price, remember to update the amount check in backend/src/adapters/afdian.js.

Step 7 — Test a real purchase

The best way to verify everything works is to actually buy your own product:

1. Log out of Afdian, or use an incognito window
2. Visit your own product page
3. Complete the payment
4. Note the order number shown on the success page
5. Go back to your Signet frontend
6. Visit /bind.html and paste the order number
7. It should bind successfully and unlock product creation

If binding fails, check:

· The Worker logs (npx wrangler tail) for webhook errors
· The orders table in D1 — did the webhook insert a row?

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;" \
  --remote
```

How the adapter works

The Afdian adapter has two jobs:

1. Receive webhooks

When a user pays, Afdian sends a POST request to
/api/webhook/afdian with the order details.

The adapter:

· Verifies the signature using Afdian's public RSA key
· Rejects the sample order number from Afdian's documentation
· Rejects orders without a valid signature
· Inserts the order into the orders table if not already present

2. Query orders on demand

If a webhook is missed (network failure, etc.), the adapter can query the order
directly:

· User submits an order number on /bind.html
· If the order isn't in the local database, the Worker calls
  https://ifdian.net/api/open/query-order
· The response is validated and inserted

This means the binding flow works even if webhooks are unreliable.

Signature verification

Afdian uses RSA-SHA256 for webhook signatures. The public key is embedded in
the adapter (AFDIAN_PUBLIC_KEY). To verify a signature, the adapter:

1. Concatenates out_trade_no + user_id + plan_id + total_amount
2. Verifies the base64-decoded signature against this string

If verification fails, the webhook is logged and ignored. Return HTTP 200
regardless — Afdian will retry on non-200 responses, and you don't want retries
for invalid signatures.

Common issues

Webhook never fires
Make sure the URL in the Afdian dashboard is exactly right, including the /afdian
suffix. Afdian will not report URL errors.

Order binds but no license issued
Check that the user actually has a valid order. Run:

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT * FROM orders WHERE bound_user_id IS NOT NULL;" \
  --remote
```

amount mismatch in logs
The order amount doesn't match the expected 19.90. Update the PRO_PRICE
constant in backend/src/adapters/afdian.js if you changed your pricing.

What's next

The core flow is deployed and working. Now polish it with a custom domain.

→ Finishing touches
