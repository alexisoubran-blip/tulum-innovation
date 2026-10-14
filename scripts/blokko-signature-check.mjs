#!/usr/bin/env node
// Confirms how Blokko encodes the signature, using one example from the official playground
// (https://playground-sandbox.blokko.ai/). Enter the same values there, copy the generated
// Signature, and run:
//
//   node scripts/blokko-signature-check.mjs \
//     --secret "SECRET" --method POST --path /v2/invoice --query "" \
//     --body '{"merchantUuid":"...","amount":1}' --timestamp 1760000000 --nonce abc123 \
//     --expected "SIGNATURE_FROM_PLAYGROUND"
//
// It prints which encoding matches, i.e. the value for BLOKKO_SIGNATURE_ENCODING.

import { canonicalString, computeSignature } from '../lib/ticketing/blokko.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1] ?? '';
for (const k of ['secret', 'method', 'path', 'timestamp', 'nonce', 'expected']) {
  if (!args[k]) { console.error(`Missing --${k}`); process.exit(1); }
}

const canonical = canonicalString({ method: args.method, path: args.path, query: args.query || '', body: args.body || '', timestamp: args.timestamp, nonce: args.nonce });
console.log('String to sign (\\n shown as ⏎):\n' + canonical.replace(/\n/g, '⏎\n') + '\n');

const keys = [['secret as text', args.secret]];
if (/^[0-9a-f]+$/i.test(args.secret) && args.secret.length % 2 === 0) keys.push(['secret as hex bytes', Buffer.from(args.secret, 'hex')]);
if (/^[A-Za-z0-9+/=]+$/.test(args.secret)) keys.push(['secret as base64 bytes', Buffer.from(args.secret, 'base64')]);

let found = false;
for (const [label, key] of keys) {
  for (const encoding of ['hex', 'base64']) {
    const sig = computeSignature(key, canonical, encoding);
    const match = sig === args.expected || sig.toLowerCase() === args.expected.toLowerCase();
    console.log(`${match ? 'MATCH' : '     '}  ${label}, ${encoding}: ${sig}`);
    if (match) found = true;
  }
}
console.log(found ? '\nUse the matching encoding for BLOKKO_SIGNATURE_ENCODING.' : '\nNo match: the playground may build the string differently (e.g. query or body formatting). Compare its "Raw String to Sign" with the one above.');
process.exit(found ? 0 : 2);
