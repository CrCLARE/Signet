# Security Policy

**[English](../SECURITY.md)** | [简体中文](./zh/SECURITY.md)

## Supported Versions

We actively provide security updates for the following versions of Signet. If you are running an older version, please upgrade to receive the latest fixes.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you believe you have found a security vulnerability in Signet, please report it to us privately. We take all security reports seriously and will investigate them promptly.

There are two ways to report a vulnerability:

1. **GitHub Security Advisories**: Go to the **Security** tab of the repository, click **Advisories**, and select **Report a vulnerability**. This is the preferred method as it keeps the discussion private and provides a secure framework for collaboration.
2. **Email**: Send an email to `hi@crclare.top`. Include the word "SECURITY" in the subject line.

### What to include in your report

To help us triage and fix the issue quickly, please include:
- The version of Signet affected.
- A description of the vulnerability and its potential impact.
- Step-by-step instructions to reproduce the issue.
- Any proof-of-concept code or screenshots (if applicable).
- Your suggested fix (if you have one).

## Our Response Process

Once a report is received, we will follow this process:

- **Acknowledgment**: We will acknowledge receipt of your report within 72 hours.
- **Triage**: We will investigate and confirm whether the issue is a valid security vulnerability.
- **Fix**: We will work on a patch and test it thoroughly.
- **Disclosure**: Once the fix is ready, we will publish a security advisory and credit you for the discovery (unless you prefer to remain anonymous).

## Scope

Signet handles sensitive operations such as user authentication, order binding, and cryptographic license issuance. 

### In-Scope Vulnerabilities

We are particularly interested in vulnerabilities such as:
- Authentication or authorization bypasses (e.g., accessing admin routes without a valid token).
- Cross-Site Scripting (XSS) that can execute arbitrary JavaScript in a user's browser.
- SQL Injection via Cloudflare D1.
- Exposure of sensitive data (e.g., signing keys, password hashes, or user emails).
- Flaws in the license signature verification logic.
- Webhook signature bypasses (e.g., Afdian adapter).

### Out-of-Scope

The following are generally considered out of scope:
- Denial of Service (DoS) attacks.
- Spam or social engineering of maintainers.
- Vulnerabilities that require physical access to the user's device.
- Issues in third-party dependencies that do not have a demonstrated impact on Signet.
- Best practice suggestions without a direct security impact (e.g., missing HTTP headers on static assets).

## Security Best Practices for Deployments

If you are deploying Signet, ensure you:
- Never commit secrets (`JWT_SECRET`, `LICENSE_SIGN_PRIVATE_KEY`, etc.) to your repository. Use Cloudflare Workers Secrets.
- Keep your `wrangler` and dependencies updated.
- Configure `ALLOWED_ORIGIN` to strictly match your frontend domain, avoiding wildcards in production.
