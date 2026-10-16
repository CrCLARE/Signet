 # Configure Cloudflare Pages

Cloudflare Pages hosts the frontend — the static HTML, CSS, and JavaScript that
your users actually see. It's free, fast, and connects directly to your GitHub fork.

## Step 1 — Open Cloudflare dashboard

Go to **[dash.cloudflare.com](https://dash.cloudflare.com)** and sign in.

In the left sidebar, click **Workers & Pages**.

## Step 2 — Create a Pages project

Click **Create application** → **Pages** → **Connect to Git**.

Cloudflare will ask for permission to access your GitHub account. Grant it
access to the forked `Signet` repository only (not all repositories).

## Step 3 — Select your repository

From the list, choose your forked `Signet` repository.

Then configure the build:

| Field | Value |
|:---|:---|
| **Project name** | `signet-frontend` (or any name you like) |
| **Production branch** | `main` |
| **Framework preset** | None |
| **Build command** | *(leave empty)* |
| **Build output directory** | `frontend` |

## Step 4 — Deploy

Click **Save and Deploy**.

Cloudflare will take about 30 seconds to build and deploy. When it's done,
you'll see a URL like:

```

https://signet-frontend.pages.dev

```

This is your live site. But it won't work yet — the frontend doesn't know where
your backend is. We'll fix that after we deploy the Worker.

## Step 5 — Note the URL

Save the Pages URL somewhere — you'll need it when configuring the Worker's
`ALLOWED_ORIGIN` variable.

## Understanding the config

The `frontend/_headers` file controls caching behavior for your pages:

- JS and CSS files are set to `max-age=0, must-revalidate` — this means browsers
  always ask the server if there's a newer version. During development this is
  what you want. Once your site is stable, you can change these to a long
  `max-age` for better performance.

- HTML files are never cached, so users always get the latest version.

You don't need to edit `_headers` to get started. It just works.

## What's next

Now the frontend is live (but untethered). Time to deploy the backend.

→ **[Configure Cloudflare Workers](./worker)**
