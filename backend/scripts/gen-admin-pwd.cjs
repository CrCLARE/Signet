 #!/usr/bin/env node
/**
 * Signet - Admin password hash generator
 *
 * Usage:
 *   node gen-admin-pwd.js <password>
 *
 * Output:
 *   ADMIN_PASSWORD_HASH = <hex>
 *   ADMIN_PASSWORD_SALT = <hex>
 *
 * Paste both values into your Cloudflare Workers secrets.
 * The password itself is never stored anywhere.
 */

const crypto = require('crypto');

const PASSWORD = process.argv[2];

if (!PASSWORD) {
  console.error('Usage: node gen-admin-pwd.js <password>');
  console.error('Example: node gen-admin-pwd.js "MyStrongPassword123"');
  process.exit(1);
}

if (PASSWORD.length < 8) {
  console.error('Error: password must be at least 8 characters.');
  process.exit(1);
}

// Generate a random 16-byte salt
const salt = crypto.randomBytes(16);

// PBKDF2-SHA256, 100000 iterations, 32-byte output
// Must match the algorithm used in backend/src/admin-auth.js
const hash = crypto.pbkdf2Sync(PASSWORD, salt, 100000, 32, 'sha256');

console.log('');
console.log('============================================================');
console.log('  Signet - Admin password credentials');
console.log('============================================================');
console.log('');
console.log('ADMIN_PASSWORD_HASH =', hash.toString('hex'));
console.log('ADMIN_PASSWORD_SALT =', salt.toString('hex'));
console.log('');
console.log('------------------------------------------------------------');
console.log('Next steps:');
console.log('  1. Copy the two values above into your Cloudflare Worker');
console.log('     secrets (Settings -> Variables and Secrets).');
console.log('  2. Also set ADMIN_USERNAME to your chosen login name.');
console.log('  3. Do NOT share these values. Anyone with them can log in');
console.log('     to the admin panel.');
console.log('------------------------------------------------------------');
console.log('');
