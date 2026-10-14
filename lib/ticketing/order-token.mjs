// Protected order reference for Blokko's successUrl.
// Blokko's guidelines: never put a raw cart/order id in the redirect URL; encrypt it
// (AES-256 with an IV) and decrypt + validate it on return before trusting it.
// AES-256-GCM also authenticates the value, so a tampered token fails to decrypt.

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

function keyFrom(secret) {
  if (!secret || secret.length < 32) throw new Error('ORDER_TOKEN_SECRET must be at least 32 characters');
  return createHash('sha256').update(secret, 'utf8').digest(); // 32 bytes
}

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/** Returns an opaque token for `orderId` that expires after `ttlSeconds`. */
export function sealOrderToken(orderId, secret, { ttlSeconds = 60 * 60 * 24, now = Date.now() } = {}) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const payload = JSON.stringify({ o: orderId, e: Math.floor(now / 1000) + ttlSeconds });
  const enc = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  return b64url(Buffer.concat([iv, cipher.getAuthTag(), enc]));
}

/** Returns the orderId, or null if the token is invalid, tampered or expired. */
export function openOrderToken(token, secret, { now = Date.now() } = {}) {
  try {
    const raw = fromB64url(String(token));
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const { o, e } = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8'));
    if (!o || !e || e * 1000 < now) return null;
    return o;
  } catch {
    return null;
  }
}
