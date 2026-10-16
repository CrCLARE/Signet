 # Configure Cloudflare Workers

The Worker is the backend of Signet. It handles user accounts, order binding,
license issuance, and the admin API. Unlike a traditional server, it runs at
the edge — no VM, no container, no monthly bill.

## What you'll do in this step

- Install the Worker's dependencies
- Create a D1 database
- Set secret values (JWT keys, admin password, signing keypair)
- Deploy the Worker

This is the longest step in the deployment, but it's entirely mechanical.

## Step 1 — Install dependencies

In your terminal:

```bash
cd backend
npm install
```

This pulls in wrangler (Cloudflare's CLI) and @noble/ed25519 (for signing).
No other dependencies.

Step 2 — Sign in to Cloudflare

```bash
npx wrangler login
```

This opens a browser tab. Authorize wrangler to access your Cloudflare account.
Once done, the terminal will report success.

Step 3 — Create a D1 database

```bash
npx wrangler d1 create signet-db
```

wrangler will print something like:

```
✅ Successfully created DB 'signet-db'

[[d1_databases]]
binding = "DB"
database_name = "signet-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the database_id. You'll need it in the next step.

Step 4 — Edit wrangler.toml

Open backend/wrangler.toml and find this block:

```toml
[[d1_databases]]
binding = "DB"
database_name = "signet-db"
database_id = "<YOUR_D1_DATABASE_ID>"
```

Replace <YOUR_D1_DATABASE_ID> with the ID you just copied.

Below that, find:

```toml
[vars]
ALLOWED_ORIGIN = "https://example.com"
```

Change https://example.com to your Pages URL from the previous step
(e.g. https://signet-frontend.pages.dev). This restricts API calls to your
own frontend.

Multiple origins: You can list several comma-separated URLs here:
"https://signet-frontend.pages.dev,https://your-domain.com". Useful during
the transition to a custom domain.

Step 5 — Initialize the database schema

```bash
npx wrangler d1 execute signet-db --file=./schema.sql --remote
```

This creates five tables:

· users — account data
· orders — payment orders
· products — user-created products
· licenses — issuance records
· audit_log — admin action history

Verify:

```bash
npx wrangler d1 execute signet-db \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  --remote
```

You should see all five plus _cf_KV.

Step 6 — Generate secrets

Run these three commands in backend/:

```bash
# 1. Admin password
npm run gen:admin-pwd "YourStrongPassword"

# 2. Ed25519 signing keypair
npm run gen:keys

# 3. JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Each command prints values. Save them all to a password manager or a secure
offline note before continuing.

Step 7 — Push secrets to Cloudflare

Run these one by one. Each will prompt you to paste a value.

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put ADMIN_PASSWORD_SALT
npx wrangler secret put ADMIN_JWT_SECRET
npx wrangler secret put LICENSE_SIGN_PRIVATE_KEY
npx wrangler secret put LICENSE_SIGN_PUBLIC_KEY
```

Value mapping:

Secret Where it comes from
JWT_SECRET The hex string from node -e ... above
ADMIN_USERNAME Whatever login name you want
ADMIN_PASSWORD_HASH gen:admin-pwd output
ADMIN_PASSWORD_SALT gen:admin-pwd output
ADMIN_JWT_SECRET A second, different hex string — generate again
LICENSE_SIGN_PRIVATE_KEY gen:keys output
LICENSE_SIGN_PUBLIC_KEY gen:keys output

A note on secrets: Cloudflare encrypts secrets at rest, but they can be
read by anyone with access to your account. Treat them like SSH keys.

Step 8 — Deploy

```bash
npx wrangler deploy
```

You'll see output like:

```
Uploaded signet-backend (1.42 sec)
Deployed signet-backend triggers (0.13 sec)
  https://signet-backend.<your-account>.workers.dev
```

Copy the .workers.dev URL. You'll need it shortly.

Step 9 — Test the Worker

```bash
curl https://signet-backend.<your-account>.workers.dev/
```

Expected response:

```json
{"ok":true,"service":"signet","version":"1.0.0"}
```

If you get this, the Worker is live and the D1 binding works.

Step 10 — Point the frontend at the backend

Now edit your frontend files to point at the Worker URL. Every HTML file that
contains this block needs updating:

```html
<script>
  window.SIGNET_CONFIG = {
    apiBase: 'https://api.example.com',
    ...
  };
</script>
```

Change apiBase to your Worker URL.

The files to update:

· frontend/index.html
· frontend/login.html
· frontend/register.html
· frontend/dashboard.html
· frontend/bind.html
· frontend/verify.html
· frontend/admin.html
· frontend/buy.html
· frontend/terms.html
· frontend/privacy.html
· frontend/404.html

Commit and push. Cloudflare Pages will redeploy automatically — usually within
30 seconds.

Troubleshooting

Cannot find module 'wrangler'
You skipped npm install in backend/. Run it.

Authentication error after wrangler login
Your browser and terminal might be on different accounts. Run npx wrangler logout
then npx wrangler login again.

database_id invalid
The ID must be copied exactly. No spaces, no quotes. Check for trailing newlines.

Worker returns 500 on every request
Check wrangler tail in a second terminal for live logs. A missing secret will
show up here.

What's next

The database is deployed but empty. Time to initialize its structure.

→ Initialize the D1 database
