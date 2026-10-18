# Finishing touches

You've deployed everything. The last step is connecting your own domain to
make the deployment look professional.

## Optional, but recommended

Signet works fine on `*.pages.dev` and `*.workers.dev` URLs. But if you're
going to run this for real users, a custom domain is worth the 10 minutes.

## Step 1 — Buy a domain

Any registrar will do. Some popular options:

- **Cloudflare Registrar** — at-cost pricing, integrates directly with Cloudflare
- **Namecheap** — cheap, reliable
- **Alibaba Cloud** — recommended if your audience is mainly in China

Whatever you choose, you'll need to point its nameservers at Cloudflare or add
CNAME records. The next steps assume Cloudflare Registrar or Cloudflare-managed
DNS.

## Step 2 — Add the site to Cloudflare

If your domain isn't already on Cloudflare:

1. Sign in to **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. Click **Add a site**
3. Enter your domain
4. Choose the **Free** plan
5. Cloudflare will ask you to change your nameservers at your registrar — do it

The DNS will take a few minutes to propagate.

## Step 3 — Point the frontend at your domain

In the Cloudflare dashboard:

1. Go to **Workers & Pages** → your Pages project
2. Click **Custom domains** → **Set up a custom domain**
3. Enter your domain (e.g. `your-domain.com`)
4. Follow the prompts

Once done, `https://your-domain.com` will serve your frontend.

Optionally add a `www` subdomain too — Cloudflare will handle the redirect.

## Step 4 — Point the backend at a subdomain

Do the same for the Worker:

1. Go to **Workers & Pages** → your Worker
2. Click **Settings** → **Domains & Routes** → **Add custom domain**
3. Enter `api.your-domain.com`
4. Follow the prompts

Once done, `https://api.your-domain.com` will serve your backend.

## Step 5 — Update ALLOWED_ORIGIN

Open `backend/wrangler.toml` and update:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-domain.com"
```

If you also want to keep the Pages URL working (for testing), use a
comma-separated list:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-domain.com,https://signet-frontend.pages.dev"
```

Redeploy:

```bash
cd backend
npx wrangler deploy
```

## Step 6 — Update the frontend's apiBase

In your frontend HTML files, update the apiBase:

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  ...
};
```

Commit and push. Pages will redeploy automatically.

## Step 7 — Update the Afdian webhook URL

If you configured Afdian, update the webhook URL in the Afdian dashboard:

```
https://api.your-domain.com/api/webhook/afdian
```

## Step 8 — Enable HSTS (optional, recommended)

HSTS forces all future connections to use HTTPS. Once enabled, browsers will
remember this for the duration of the max-age — so make sure your domain
works over HTTPS before enabling.

In Cloudflare:

1. Go to SSL/TLS → Edge Certificates
2. Find HTTP Strict Transport Security (HSTS)
3. Click Enable HSTS
4. Set max-age to something conservative at first (e.g. 86400 = 1 day)
5. Once you're confident, increase it to a year (31536000)

## Step 9 — Rebrand

Signet's default look uses its own name and logo. To make it yours, edit
window.SIGNET_CONFIG in every HTML file:

```javascript
window.SIGNET_CONFIG = {
  apiBase: 'https://api.your-domain.com',
  brandName: 'YourProductName',
  brandTagline: 'Your tagline here',
  repoUrl: 'https://github.com/you/your-repo',
  docsUrl: 'https://docs.your-domain.com',
  supportEmail: 'hi@your-domain.com',
  operatorName: 'Your Company Name',
  termsEffectiveDate: 'January 1, 2027',
  jurisdiction: 'your jurisdiction',
  pricing: [ /* your plans */ ]
};
```

The full list of HTML files that contain this config:

· index.html
· login.html
· register.html
· dashboard.html
· bind.html
· verify.html
· admin.html
· buy.html
· terms.html
· privacy.html
· 404.html

Shortcut: If you want to avoid editing 11 files, extract the config block
into a separate frontend/assets/config.js and load it in each page. This
is a good refactor but not required for the initial deployment.

## Step 10 — Update your legal pages

Before going live, edit these two files:

terms.html — find the config block and update:

· operatorName — your company or your own name
· termsEffectiveDate — today's date
· jurisdiction — your country or region
· supportEmail — your actual support email

privacy.html — update:

· operatorName
· privacyEffectiveDate
· supportEmail
· analyticsProvider — set to '' if you don't use analytics, or name the
  service if you do

Don't skip this. Users see these pages. Having "Example Company" as your
legal entity will erode trust.

## Step 11 — Test the production domain

Visit your custom domain and walk through the whole flow:

1. Register a new account
2. If you configured Afdian, buy a real order and bind it
3. Otherwise, use the admin panel to grant access
4. Create a product
5. Download a license file
6. Look up the product on /verify.html

If all steps pass, you're done.

## Ongoing maintenance

### Checking logs

```bash
cd backend
npx wrangler tail
```

Streams live logs. Useful when debugging production issues.

### Updating secrets

Any secret can be updated later with npx wrangler secret put <NAME>.

### Pulling upstream updates

```bash
git fetch upstream
git merge upstream/main
```

Only merge if you've reviewed the changes. Signet doesn't follow semantic
versioning strictly — minor versions may include behavioral changes.

### Regular backups

```bash
npx wrangler d1 export signet-db --output=backup-$(date +%Y%m%d).sql --remote
```

Consider scheduling this via a GitHub Action or a cron job.

## You're done

Signet is now fully deployed, branded, and running on your own domain.
Congratulations.

If you run into issues, see the FAQ or open a discussion on
GitHub.
