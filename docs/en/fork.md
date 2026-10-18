# Fork the repository

Before you can deploy anything, you need your own copy of the Signet source code.

## Step 1 — Fork on GitHub

Visit **[github.com/CrCLARE/Signet](https://github.com/CrCLARE/Signet)**.

Click the **Fork** button at the top right of the page. GitHub will create a copy
of the repository under your own account.

> **Tip:** If you're deploying to a specific GitHub organization, fork into that
> organization instead of your personal account. This makes future access management
> easier.

## Step 2 — Clone locally

Open a terminal and run:

```bash
git clone https://github.com/<your-username>/Signet.git
cd Signet
```

Replace <your-username> with your actual GitHub username.

## Step 3 — Explore the structure

You should see:

```
Signet/
├── backend/          Cloudflare Workers backend
│   ├── src/          Source code
│   ├── scripts/      Setup helper scripts
│   ├── schema.sql    D1 database schema
│   ├── package.json
│   └── wrangler.toml Worker configuration
├── frontend/         Static frontend
│   ├── assets/       Shared JavaScript
│   └── *.html        All pages
├── docs/             Documentation (this site)
├── LICENSE           Apache License 2.0
├── NOTICE            Attribution
└── README.md
```

The two directories you'll work with most are backend/ and frontend/.

## Step 4 — Verify Node.js

Confirm you have Node.js 18 or newer:

```bash
node --version
```

If it prints v18.x.x or higher, you're good. If not, install a newer version
from nodejs.org.

# What's next

Now that you have your own copy, it's time to deploy the frontend.

→ Configure Cloudflare Pages

## A note on staying in sync

If you want to pull in future updates from the upstream repository (for example,
security fixes), you can add it as a remote:

```bash
git remote add upstream https://github.com/CrCLARE/Signet.git
```

Later, to pull changes:

```bash
git fetch upstream
git merge upstream/main
```

But for a first deployment, you don't need this. Focus on getting your own copy
running first.
