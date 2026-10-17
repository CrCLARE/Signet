# Getting started

## What Signet is

Signet is a **self-hosted authorization platform template**. It gives you everything
you need to run a licensing service for your own software:

- A user account system (register, sign in, password reset)
- An order binding flow (connect a payment to a user)
- A product management interface (each user manages their own products)
- An offline license issuance engine (Ed25519-signed files)
- An admin panel (search, ban, grant, audit)
- A public license lookup page

It's built on **Cloudflare Workers**, **Cloudflare D1**, and **Cloudflare Pages**.
Under typical indie-scale traffic, the entire stack runs on Cloudflare's free tier.

## What Signet is *not*

Signet is not a payment processor. It doesn't hold your money. It doesn't send emails.
It doesn't provide analytics. It's the layer *between* your customers and your
products — nothing more, nothing less.

## License

Signet is released under the **Apache License 2.0**.

This means you may:

- Use Signet in commercial and non-commercial projects
- Modify, distribute, and sublicense the source code
- Run it as a service for your own customers

You must:

- Retain the original `NOTICE` file
- Include a copy of the license with any redistribution
- Clearly state any modifications you make

You may not:

- Use the "Signet" or "CrCLARE" trademarks without permission

The full text is available in the
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE) file. For a summary,
see [choosealicense.com/licenses/apache-2.0](https://choosealicense.com/licenses/apache-2.0/).

## Architecture at a glance

```

Browser
│
▼
Cloudflare Pages (frontend)          ← static HTML + Tailwind
│
│ fetch → API
▼
Cloudflare Workers (backend)         ← JS runtime, no server
│
│ bind
▼
Cloudflare D1 (database)             ← SQLite, distributed

```

Everything runs at the edge. There's no origin server to maintain, no container
to keep warm, no monthly VM bill.

## Prerequisites

To deploy your own copy of Signet, you'll need:

- A **Cloudflare account** — [sign up free](https://dash.cloudflare.com/sign-up)
- A **GitHub account** — for forking the repository
- **Node.js 18+** installed locally — [nodejs.org](https://nodejs.org)
- A **payment provider account** — [Afdian](https://afdian.com) is included out of the box

If you don't have a payment provider yet, you can still deploy Signet and use
the admin panel to grant access manually.

## Next step

Ready to get your own copy? → **[Fork the repository](./fork)**
