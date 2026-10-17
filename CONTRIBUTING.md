# Contributing to Signet

**[English](../CONTRIBUTING.md)** | [简体中文](./zh/CONTRIBUTING.md)

---

First off, thank you for considering contributing to Signet! It's people like you that make open source such a great community.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. If it has, add a comment to the existing issue instead of opening a new one.

When you are creating a bug report, please include as many details as possible by filling out the required template. Explain the problem and include additional details to help maintainers reproduce the problem.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement, please open an issue first. Describe your idea and explain why it would be useful. This helps us align on the design before any code is written.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies**: Run `npm install` inside the `backend/` and `docs/` directories if you're working on them.
3. **Make your changes**. Ensure your code follows the existing style.
4. **Update documentation** if you're adding a new feature or changing behavior.
5. **Submit a Pull Request**. Fill out the PR template and link any relevant issues.

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- A Cloudflare account (for testing Worker/D1 changes)
- `wrangler` CLI (installed locally via `npm install`)

### Backend (Cloudflare Workers)

```bash
cd backend
npm install
npm run dev
```
### Documentation (VitePress)

```bash
cd docs
npm install
npm run dev
```
## Styleguide

### Git Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org) specification:

feat: A new feature

fix: A bug fix

docs: Documentation only changes

style: Changes that do not affect the meaning of the code (white-space, formatting, etc.)

refactor: A code change that neither fixes a bug nor adds a feature

chore: Changes to the build process or auxiliary tools

Example: feat: add Stripe payment adapter

### JavaScript Style
We use standard ECMAScript modules (ESM).

Use 2 spaces for indentation.

Prefer const over let where possible.

Use semicolons at the end of statements.

Keep functions small and focused.

## Security
Because Signet handles sensitive data (passwords, license signing keys), security is paramount.

Never commit secrets (API keys, private keys, .env files).

Ensure all user inputs are validated and sanitized.

Always verify webhook signatures in payment adapters.

If you discover a security vulnerability, do not open a public issue. Please report it privately as described in our [SECURITY.md](../SECURITY.md).

## License
By contributing to Signet, you agree that your contributions will be licensed under the [Apache License 2.0](../LICENSE).
