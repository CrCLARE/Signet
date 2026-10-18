# About Signet

## What it is

Signet is a **SaaS authorization platform template** — a complete, self-hosted
system for managing software licenses. It's designed for independent developers
who want to sell or license their products without building an account system,
an order binding flow, and a license server from scratch.

## The name

A **signet ring** is a small ring engraved with a personal seal, worn by
monarchs in medieval Europe. Pressing it into hot wax authenticated a document —
it proved the letter came from the person who held the ring.

Signet the software serves the same function for digital products: it
authenticates that a piece of software was legitimately licensed by a real
purchaser.

## Who built it

Signet is developed by **[CrCLARE Studio](https://crclare.top)**, a small
independent studio run by [CLARE (CLARE-XHL)](https://github.com/CLARE-XHL).

The studio's main focus is game development and tools for indie creators. Signet
started as an internal authorization system for one of their own products, and
was later extracted into a reusable template.

## Design philosophy

### Zero-Trust

The platform never handles cryptographic material belonging to your products.
It doesn't sign licenses with keys you don't control. The signing keypair is
yours — Signet just provides the infrastructure to use it safely.

### Offline-first

A license, once issued, works forever. It's a signed file that verifies against
a public key embedded in your application. No server round-trip is required to
check it. If your Signet deployment goes offline tomorrow, existing licenses
continue to work.

### No black boxes

Signet is fully open source. Every piece of logic that touches user data,
passwords, or signing keys is visible and auditable. There are no obfuscated
modules, no analytics that phone home, no hidden API calls.

### Adapters, not integrations

Payment providers, captcha providers, and email providers are all pluggable.
The core never hardcodes a specific vendor.

### Minimal footprint

No servers to maintain. No containers to keep warm. No monthly VM bill.
The entire stack runs on Cloudflare's free tier for typical indie-scale traffic.

## Version history

### V1.0 — October 2026

First public release. Ships with:

- User accounts with PBKDF2-SHA256 password hashing
- Afdian payment adapter
- Ed25519 offline license issuance
- Admin panel with ban/grant/audit
- Public license lookup
- Apache 2.0 license

## License

Signet is released under the **Apache License 2.0**. See
[LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE) for the full text.

The short version: use it however you want, including commercially. Keep the
attribution. Don't use the Signet trademark without permission.

## Credits

**Made by** CLARE ([CLARE-XHL](https://github.com/CLARE-XHL))

**Designed by** Rice porridge (Climser), Old Bei (Bro eagle), Dieyi (Dieyi my),
Cloud (Xiaoyun), rain (Marquis)

## Source

- Repository: [github.com/CrCLARE/Signet](https://github.com/CrCLARE/Signet)
- Issues: [github.com/CrCLARE/Signet/issues](https://github.com/CrCLARE/Signet/issues)
- Discussions: [github.com/CrCLARE/Signet/discussions](https://github.com/CrCLARE/Signet/discussions)
