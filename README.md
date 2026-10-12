# Signet

**SaaS authorization platform template for indie developers**

---

[English](/README.md) | [简体中文](/zh/README.md)

---

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Status](https://img.shields.io/badge/status-pre--release-yellow)](https://github.com/CrCLARE/Signet)

---

Signet is a SaaS authorization platform template developed by [CrCLARE Studio](https://crclare.top). It provides a complete solution for indie developers who need to manage licenses for their own products — user accounts, order binding, license issuance, admin dashboard, and audit logging — all out of the box.

The name comes from the medieval **signet ring** — a stamp of authority used by monarchs to seal official documents. Just as a signet authenticates a royal decree, this platform authenticates the products built on top of it.

## What It Does

Signet handles the boring, error-prone parts of running a licensed product:

- **User accounts** — registration, login, password reset via admin
- **Order binding** — connect a payment order to a user account
- **Product management** — users create their own products under their account
- **License issuance** — sign offline license files with Ed25519
- **Admin panel** — ban/unban licenses, grant pro access, reset passwords, audit trail
- **Public lookup** — anyone can verify whether a product has a valid license

## Live Demo（Chronos Seal Website）

**https://chronos.crclare.top**

A fully working instance of this template, running in production.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **Frontend** | Static HTML + Tailwind CSS |
| **Crypto** | Ed25519 (via `@noble/ed25519`) |
| **Auth** | JWT (dual: user + admin) |

No servers to maintain. No monthly bills. Runs entirely on Cloudflare's free tier for typical indie use.

## Design Principles

**Zero-Trust** — It's open source with no black boxes, so you have full control over all the logic and keys yourself.
**Offline-first** — once a license is issued, it works forever, even if the platform goes offline.
- **Adapters, not integrations** — payment providers are implemented as adapters, not hard-coded into the core.
- **Dual JWT** — user and admin sessions use separate secrets and separate storage keys. A compromised user token cannot reach admin routes.

## Repository Structure

Signet/
├── backend/          Cloudflare Workers backend
│   ├── src/          Source code
│   ├── schema.sql    D1 database schema
│   └── wrangler.toml Worker configuration
├── frontend/         Static frontend (Tailwind CSS)
│   └── assets/       Shared JavaScript
├── docs/             Documentation (see dev.crclare.top)
├── LICENSE           Apache License 2.0
└── NOTICE            Attribution

## Documentation

Full documentation, deployment guides, and architecture notes are available at:

**https://dev.crclare.top**

## License

Signet is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for the full text.

You are free to:
- Use Signet in commercial and non-commercial projects
- Modify, distribute, and sublicense it
- Use it to run your own licensing service

You must:
- Retain the original NOTICE file (see [NOTICE](NOTICE))
- Disclose any modifications you make

You cannot:
- Use the "Signet" or "CrCLARE" trademarks without permission

## Credits

**Made by** CLARE ([CLARE-XHL](https://github.com/CLARE-XHL))

**Design by** Rice porridge (Climser), Old Bei (Bro eagle), Dieyi (Dieyi my), Cloud (Xiaoyun), rain (Marquis)

## Links

- **CrCLARE Studio** — https://crclare.top
- **Documentation** — https://dev.crclare.top
- **Demo** — https://chronos.crclare.top
- **GitHub** — https://github.com/CrCLARE/Signet
