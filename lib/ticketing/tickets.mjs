// Ticket QR tokens. The token is derived from the ticket id with a server secret
// (HMAC-SHA256, domain-separated), so it never has to be stored: the database keeps only its
// SHA-256 hash, and an email or ticket page can always be regenerated from the id.
// Format: base64url(16-byte uuid) "." base64url(first 16 bytes of the HMAC) — 45 characters.

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function secretKey(secret) {
  if (!secret || secret.length < 32) throw new Error('ORDER_TOKEN_SECRET must be at least 32 characters');
  return secret;
}

const uuidToBytes = (id) => Buffer.from(String(id).replace(/-/g, ''), 'hex');
const bytesToUuid = (b) => {
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const mac = (id, secret) => createHmac('sha256', secretKey(secret)).update(`tif-ticket:v1:${id}`).digest().subarray(0, 16);

export function ticketToken(ticketId, secret) {
  return `${b64url(uuidToBytes(ticketId))}.${b64url(mac(ticketId, secret))}`;
}

/** Returns the ticket id if the token is authentic, otherwise null. */
export function verifyTicketToken(token, secret) {
  const [idPart, sigPart] = String(token || '').split('.');
  if (!idPart || !sigPart) return null;
  const idBytes = fromB64url(idPart);
  if (idBytes.length !== 16) return null;
  const id = bytesToUuid(idBytes);
  const expected = mac(id, secret);
  const given = fromB64url(sigPart);
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
