// Blokko API v2 client for TIF ticketing.
// Docs: https://docs.blokko.us (Generate Invoice, Payment status, Merchant webhook, blokko-signature HMAC).
//
// Every request carries one header:
//   blokko-signature: Api-Key={apiKey}, Timestamp={timestamp}, Nonce={nonce}, Signature={signature}
// where signature = HMAC-SHA256(secret, canonical) and canonical is
//   {METHOD}\n{path}\n{queryString}\n{rawBody}\n{timestamp}\n{nonce}
//
// The docs do not state the signature encoding (hex vs base64) or the timestamp unit.
// Both are configurable (BLOKKO_SIGNATURE_ENCODING, BLOKKO_TIMESTAMP_UNIT) and can be
// confirmed against the official playground with scripts/blokko-signature-check.mjs.

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const SANDBOX_URL = 'https://sandbox.blokko.dev';
export const STATUS = Object.freeze({ PENDING: 'P', EXECUTED: 'E' });

export function configFromEnv(env = process.env) {
  const config = {
    baseUrl: (env.BLOKKO_BASE_URL || SANDBOX_URL).replace(/\/+$/, ''),
    apiKey: env.BLOKKO_API_KEY || '',
    secret: env.BLOKKO_SECRET || '',
    merchantUuid: env.BLOKKO_MERCHANT_UUID || '',
    merchantId: env.BLOKKO_MERCHANT_ID || env.BLOKKO_MERCHANT_UUID || '',
    encoding: env.BLOKKO_SIGNATURE_ENCODING === 'base64' ? 'base64' : 'hex',
    timestampUnit: env.BLOKKO_TIMESTAMP_UNIT === 'ms' ? 'ms' : 's',
  };
  return config;
}

function assertConfigured(config, keys) {
  const missing = keys.filter((k) => !config[k]);
  if (missing.length) throw new Error(`Blokko is not configured: missing ${missing.join(', ')}`);
}

/** Query string normalized as the docs require: keys sorted, values URL-encoded, no leading "?". */
export function normalizeQuery(query) {
  if (!query) return '';
  const params = typeof query === 'string' ? new URLSearchParams(query.replace(/^\?/, '')) : new URLSearchParams(query);
  return [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function canonicalString({ method, path, query = '', body = '', timestamp, nonce }) {
  return [String(method).toUpperCase(), path, normalizeQuery(query), body ?? '', String(timestamp), nonce].join('\n');
}

export function computeSignature(secret, canonical, encoding = 'hex') {
  return createHmac('sha256', secret).update(canonical, 'utf8').digest(encoding);
}

export function nowTimestamp(unit = 's') {
  return unit === 'ms' ? String(Date.now()) : String(Math.floor(Date.now() / 1000));
}

export function buildSignatureHeader({ apiKey, timestamp, nonce, signature }) {
  return `Api-Key=${apiKey}, Timestamp=${timestamp}, Nonce=${nonce}, Signature=${signature}`;
}

export function parseSignatureHeader(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = {};
  for (const piece of value.split(',')) {
    const i = piece.indexOf('=');
    if (i < 0) continue;
    parts[piece.slice(0, i).trim().toLowerCase()] = piece.slice(i + 1).trim();
  }
  const { 'api-key': apiKey, timestamp, nonce, signature } = parts;
  if (!apiKey || !timestamp || !nonce || !signature) return null;
  return { apiKey, timestamp, nonce, signature };
}

/** Signs an outgoing request and returns the header value plus the exact body string that was signed. */
export function signRequest(config, { method, path, query = '', body }) {
  const rawBody = body === undefined || body === null ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  const timestamp = nowTimestamp(config.timestampUnit);
  const nonce = randomUUID();
  const signature = computeSignature(config.secret, canonicalString({ method, path, query, body: rawBody, timestamp, nonce }), config.encoding);
  return { header: buildSignatureHeader({ apiKey: config.apiKey, timestamp, nonce, signature }), rawBody };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Verifies an incoming signed request (Blokko webhook).
 * Order follows the docs: headers → HMAC → timestamp window → nonce → (payload model is checked by the caller).
 * `seenNonce(nonce)` should return true if the nonce was already used; pass a persistent store in production.
 */
export function verifyIncoming(config, { method, path, query = '', rawBody = '', headerValue, toleranceSeconds = 300, seenNonce, now = Date.now() }) {
  const parsed = parseSignatureHeader(headerValue);
  if (!parsed) return { ok: false, reason: 'missing_or_malformed_header' };
  if (!safeEqual(parsed.apiKey, config.apiKey)) return { ok: false, reason: 'api_key_mismatch' };
  const expected = computeSignature(config.secret, canonicalString({ method, path, query, body: rawBody, timestamp: parsed.timestamp, nonce: parsed.nonce }), config.encoding);
  if (!safeEqual(expected, parsed.signature)) return { ok: false, reason: 'bad_signature' };
  const tsMs = config.timestampUnit === 'ms' ? Number(parsed.timestamp) : Number(parsed.timestamp) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(now - tsMs) > toleranceSeconds * 1000) return { ok: false, reason: 'timestamp_out_of_window' };
  if (seenNonce && seenNonce(parsed.nonce)) return { ok: false, reason: 'nonce_reused' };
  return { ok: true, nonce: parsed.nonce, timestamp: parsed.timestamp };
}

export class BlokkoError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'BlokkoError';
    this.status = status;
    this.body = body;
  }
}

export function createClient(config = configFromEnv(), { fetchImpl = globalThis.fetch } = {}) {
  async function call(method, path, { body, query } = {}) {
    assertConfigured(config, ['apiKey', 'secret']);
    const { header, rawBody } = signRequest(config, { method, path, query, body });
    const qs = normalizeQuery(query);
    const res = await fetchImpl(`${config.baseUrl}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers: { 'content-type': 'application/json', accept: 'application/json', 'blokko-signature': header },
      body: rawBody || undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new BlokkoError(`Blokko ${method} ${path} failed with ${res.status}`, { status: res.status, body: data });
    return data;
  }

  return {
    config,
    /** POST /v2/invoice — hosted payment link. Amount is in the merchant currency set at onboarding. */
    async createInvoice({ amount, expiresAt, successUrl }) {
      assertConfigured(config, ['merchantUuid']);
      if (!(Number(amount) > 0)) throw new Error('Invoice amount must be greater than 0');
      const body = { merchantUuid: config.merchantUuid, amount: Number(amount) };
      if (expiresAt) body.expiresAt = expiresAt; // YYYY-MM-DD
      if (successUrl) body.successUrl = successUrl;
      return call('POST', '/v2/invoice', { body });
    },
    /** POST /v2/payment-intent — QR for a physical terminal (in-person sales at the venue).
     *  The API reference says /v2/payment/intent; the sandbox answered 200 on /v2/payment-intent
     *  (official playground, 2026-10-15), so we use the path that is proven to work. */
    async createPaymentIntent({ merchantTransactionId, terminalUuid, amount, merchantReference, paymentMethodId }) {
      const body = { merchantTransactionId, terminalUuid, amount: String(amount) };
      if (merchantReference) body.merchantReference = merchantReference;
      if (paymentMethodId) body.paymentMethodId = paymentMethodId;
      return call('POST', '/v2/payment-intent', { body });
    },
    /** GET /v2/payment/byMerchantTransactionId/{id} */
    async getPaymentByMerchantTransactionId(id) {
      return call('GET', `/v2/payment/byMerchantTransactionId/${encodeURIComponent(id)}`);
    },
    /** PUT /v2/merchants/{merchantId}/webhook — registers the HTTPS callback URL. */
    async setWebhook(callbackUrl) {
      assertConfigured(config, ['merchantId']);
      if (!/^https:\/\//.test(callbackUrl)) throw new Error('Blokko only accepts HTTPS callback URLs');
      return call('PUT', `/v2/merchants/${encodeURIComponent(config.merchantId)}/webhook`, { body: { callbackUrl } });
    },
  };
}

/** Validates the webhook payload model documented in "Webhook Definition". */
export function parseWebhookPayload(rawBody) {
  let data;
  try { data = JSON.parse(rawBody); } catch { return { ok: false, reason: 'invalid_json' }; }
  if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid_payload' };
  const status = data.transactionStatus;
  if (status !== STATUS.PENDING && status !== STATUS.EXECUTED) return { ok: false, reason: 'unknown_status' };
  if (!data.transactionUuid) return { ok: false, reason: 'missing_transaction_uuid' };
  return {
    ok: true,
    event: {
      authorizationId: data.authorizationId ?? null,
      transactionUuid: data.transactionUuid,
      merchantId: data.merchantId ?? null,
      merchantReference: data.merchantReference ?? null,
      invoiceNumber: data.invoiceNumber ?? null,
      status,
      createdAt: data.createdAt ?? null,
      completedAt: data.completedAt ?? null,
    },
  };
}
