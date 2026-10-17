# Signet

**SaaS authorization platform template for indie developers.**

Signet handles the boring, error-prone parts of running a licensed product —
user accounts, order binding, license issuance, and an admin dashboard — so you
can focus on building the thing you actually want to sell.

Deploy it on Cloudflare's free tier. Own your data. Ship faster.

---

## Who it's for

You're building a game, a plugin, a desktop app, or any other piece of software
you want to sell or license. You don't want to build a user account system, an
order binding flow, or a license server from scratch. Signet gives you all three,
out of the box.

## What you get

- **User accounts** — Register, sign in, reset password via admin
- **Order binding** — Connect a payment to a user account
- **Product management** — Users create products under their account
- **License issuance** — Ed25519-signed, offline-verifiable license files
- **Admin panel** — Ban, grant, reset, audit
- **Public lookup** — Anyone can verify a license without signing in

## What you don't get

- No billing system — payments are handled by your chosen provider
- No email service — password resets are triggered by you, the admin
- No analytics — the template ships zero trackers

## Where to go next

- **[Getting started →](./getting-started)** — What Signet is and how it's licensed
- **[Fork the repository →](./fork)** — Get your own copy
- **[Deploy →](./worker)** — Set up Cloudflare Workers and D1

## Live demo

See Signet running in production at **[chronos.crclare.top](https://chronos.crclare.top)**.

## License

Signet is released under the **Apache License 2.0**. See the
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE) file in the repository
for the full text.

## Credits

Built by [CrCLARE Studio](https://crclare.top).
