 #!/usr/bin/env node
/**
 * Signet - Ed25519 keypair generator
 *
 * Usage:
 *   node gen-keys.js
 *
 * Output:
 *   LICENSE_SIGN_PRIVATE_KEY = <hex, 64 chars>
 *   LICENSE_SIGN_PUBLIC_KEY  = <hex, 64 chars>
 *
 * The private key goes into your Cloudflare Workers secrets.
 * The public key is embedded in your client application
 * (the product being licensed) to verify signed licenses.
 */

const crypto = require('crypto');

function main() {
  // Generate a fresh Ed25519 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  // Export as DER so we can extract the raw 32-byte values
  const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const pubDer  = publicKey.export({ type: 'spki',  format: 'der' });

  // Ed25519 seed  = last 32 bytes of the PKCS#8 DER encoding
  // Ed25519 key   = last 32 bytes of the SPKI DER encoding
  const privHex = privDer.slice(-32).toString('hex');
  const pubHex  = pubDer.slice(-32).toString('hex');

  console.log('');
  console.log('============================================================');
  console.log('  Signet - Ed25519 signing keypair');
  console.log('============================================================');
  console.log('');
  console.log('LICENSE_SIGN_PRIVATE_KEY =', privHex);
  console.log('LICENSE_SIGN_PUBLIC_KEY  =', pubHex);
  console.log('');
  console.log('------------------------------------------------------------');
  console.log('Next steps:');
  console.log('  1. Store the PRIVATE key in Cloudflare Worker secrets.');
  console.log('     Never commit it to Git, never share it.');
  console.log('  2. Embed the PUBLIC key in your client application.');
  console.log('     It is safe to publish — it only verifies signatures,');
  console.log('     it cannot create them.');
  console.log('  3. Back up both values somewhere safe. If you lose the');
  console.log('     private key, you cannot issue new licenses. If you');
  console.log('     lose the public key, existing clients cannot verify.');
  console.log('------------------------------------------------------------');
  console.log('');
}

main();
