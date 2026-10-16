 # FAQ

## Deployment

### Do I need a custom domain?

No. Signet works fine on `*.pages.dev` and `*.workers.dev` URLs. A custom domain
is recommended if you're running this for real users, but it's optional.

### Can I deploy without Cloudflare?

Not easily. Signet's backend is written specifically for Cloudflare Workers
(using D1 and the Workers runtime). Porting it to another platform would mean
rewriting the backend.

### Can I run this on Cloudflare's free tier?

Yes. For typical indie-scale traffic (hundreds of users, a few orders per day),
you'll stay well within the free limits. Cloudflare Workers gives you 100,000
requests per day for free; D1 gives you 5 million row reads per day.

### What happens if I exceed the free tier?

Cloudflare will start charging you at their standard rates (Workers Paid starts
at $5/month). You can also set spending limits in the Cloudflare dashboard to
avoid surprises.

### Can I update to a newer version of Signet later?

Yes. Add the upstream as a git remote:

```bash
git remote add upstream https://github.com/CrCLARE/Signet.git
git fetch upstream
git merge upstream/main
```

Review the changes before merging, especially if you've customized the code.

---

Payments

What payment providers are supported?

Currently only Afdian ships in the box. But the adapter system makes it easy
to add others — see the Adapters chapter.

Can I use Stripe / Paddle / Gumroad?

Not out of the box. You'll need to write an adapter. The pattern is well-documented
and about fifty lines per provider.

How do refunds work?

Signet doesn't handle refunds. If a user wants a refund, you process it through
your payment provider's dashboard. You may also want to revoke their license
through the admin panel.

Can users pay in USD?

That depends on your payment provider. Signet stores whatever amount string
the provider sends (e.g. "19.90" or "$19.90"), so any currency works.

---

Licensing

What does a license file look like?

A signed JSON object:

```json
{
  "v": 1,
  "product_uid": "A1B2C3D4E5F6G7H8",
  "product_name": "My Product",
  "user_id": "257b6a93-...",
  "fingerprint": "257b6a93-...",
  "issued_at": 1791198240,
  "signature": "d0654793aa6f..."
}
```

The signature is an Ed25519 signature over the first six fields. Your client
application verifies it using a public key embedded in the build.

Can a license expire?

No. Licenses don't have an expiry field. Once issued, they're valid forever,
even if the Signet deployment goes offline.

Can I revoke a license?

Yes. Sign in to the admin panel, search for the license, and click Ban.
Banned licenses:

· Show as "Revoked" on the public lookup page
· Return 403 when the user tries to re-download
· Continue to validate in your client application unless your client checks
  the online status

Important: Revoking a license does not erase it from the user's disk.
If your client application verifies signatures offline, it will still accept
a revoked license. To actually block a revoked license, your client needs to
check a revocation list — Signet doesn't provide one.

What happens to licenses if I delete a user account?

The licenses remain in the database with their user_id pointing to a
non-existent user. They still appear on the public lookup page but can no longer
be re-issued (the user has no account to log in with).

If you want a clean deletion, delete the licenses first or archive them.

---

Security

Where are passwords stored?

In the users table, as PBKDF2-SHA256 hashes with per-user salts. 100,000
iterations. Plaintext passwords are never stored.

Where are the signing keys stored?

As Cloudflare Workers secrets. They're encrypted at rest, but anyone with access
to your Cloudflare account can read them. Treat them like SSH private keys.

Can I use my own signing keypair?

Yes. Generate a keypair with npm run gen:keys and push them as
LICENSE_SIGN_PRIVATE_KEY and LICENSE_SIGN_PUBLIC_KEY. Whatever key you use,
the corresponding public key must be embedded in your client application.

Is there rate limiting?

Not by default. Cloudflare's edge provides basic DDoS protection, but Signet
itself does not rate-limit login attempts or API calls. If you need this, add
it in backend/src/index.js.

How do I handle security reports?

See SECURITY.md in
the repository.

---

HTTP status codes

Signet uses standard HTTP status codes plus a JSON body of the form
{ "error": "..." }. There are no custom numeric error codes.

Status Meaning Common causes
200 OK Successful request
400 Bad Request Missing field, invalid format, captcha failure
401 Unauthorized Missing/invalid JWT, wrong password
403 Forbidden Not an admin, no active license, banned
404 Not Found Product doesn't exist, order not found
405 Method Not Allowed Wrong HTTP method for this route
409 Conflict Email already registered, order already bound
500 Internal Server Error Unhandled exception in the Worker
503 Service Unavailable Payment adapter not configured

Common error messages

Message Route Meaning
Invalid email format Register Email doesn't match the regex
Password must be at least 8 characters Register Password too short
Email already registered Register Duplicate email
Invalid email or password Login Wrong credentials
Order is already bound to another account Bind Order taken
You already have an order bound to this account Bind One order per user
No active license found Create product Bind an order first
You already have a product with this name Create product Duplicate name
This license has been revoked Issue license Banned
Unauthorized Admin routes Admin token missing or invalid
Invalid credentials Admin login Wrong admin password

Debugging errors

Open a terminal and run:

```bash
cd backend
npx wrangler tail
```

This streams live logs from the Worker. The Unhandled error: prefix is
always followed by the real error and stack trace.

---

Customization

Can I rename "Signet" to something else?

Yes. Edit window.SIGNET_CONFIG.brandName in every HTML file. See
the rebrand section.

Can I use my own logo?

Yes. Replace the inline SVG in the topbar of each HTML file. Or extract the
markup to a shared partial.

Can I change the license signature algorithm?

Technically yes, but you'd need to update both the Worker (which signs) and
your client application (which verifies). The current Ed25519 setup is a good
default — short signatures, fast verification, no known weaknesses.

Can I sell Signet itself?

Yes. The Apache License 2.0 lets you redistribute Signet in any form, including
commercially. But you may not use the "Signet" or "CrCLARE" trademarks without
permission.

---

Commercial use

Can I use Signet for my commercial product?

Yes. That's the primary use case.

Do I need to pay a license fee?

No. Apache License 2.0 is royalty-free.

Do I need to open-source my modifications?

Not necessarily. You must retain the original NOTICE file and disclose that
you've modified Signet, but your modifications can remain closed-source.

Do I need to display "Powered by Signet" in my product?

No. The footer link in the template is a courtesy, not a requirement. You can
remove it.

Can I remove the footer entirely?

Yes.

---

Support

Where do I report a bug?

Open an issue at
github.com/CrCLARE/Signet/issues.

Where do I ask a question?

Open a discussion at
github.com/CrCLARE/Signet/discussions.

Is there commercial support?

Not currently. Signet is maintained by CrCLARE Studio as an open-source project.
For commercial support, contact hi@crclare.top.
