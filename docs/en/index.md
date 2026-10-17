 ---
layout: home

hero:
  name: Signet
  text: SaaS authorization platform template
  tagline: Self-hosted license management for indie developers. Runs on Cloudflare's free tier.
  image:
    src: /logo.svg
    alt: Signet
  actions:
    - theme: brand
      text: Get started
      link: /en/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/CrCLARE/Signet

features:
  - icon: 👤
    title: User accounts
    details: Registration, sign-in, and admin-triggered password resets. PBKDF2-SHA256 hashing with per-user salts.
  - icon: 🔗
    title: Order binding
    details: Connect payment orders from your provider to user accounts. Adapters are pluggable — Afdian ships out of the box.
  - icon: 🛡️
    title: Offline license issuance
    details: Sign licenses with Ed25519. Once issued, they verify locally against an embedded public key — no server round-trip.
  - icon: ⚙️
    title: Admin dashboard
    details: Search licenses, ban and unban with reasons, grant access to any user, audit every action. Independent admin credentials.
  - icon: 🔍
    title: Public license lookup
    details: Anyone can verify a license without signing in. No emails, no order numbers, no personal data ever exposed.
  - icon: 🔐
    title: Zero-Trust by design
    details: Open source with no black boxes. You control all the logic and every key — the platform never handles your secrets.
---

## Live demo（Chronos Seal Website）

A working instance of this template is running at
**[chronos.crclare.top](https://chronos.crclare.top)**.

## License

Signet is released under the **Apache License 2.0**.

You may use it commercially, modify it, and redistribute it. You must retain the
`NOTICE` file and state any changes you make. You may not use the "Signet" or
"CrCLARE" trademarks without permission.

See the [LICENSE](https://github.com/CrCLARE/Signet/blob/main/LICENSE) file for
the full text.
