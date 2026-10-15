import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  canonicalString, computeSignature, buildSignatureHeader, parseSignatureHeader, verifyIncoming,
  normalizeQuery, createClient, parseWebhookPayload, signRequest,
} from '../lib/ticketing/blokko.mjs';
import { handleBlokkoWebhook } from '../lib/ticketing/blokko-webhook.mjs';
import { createMemoryStore } from '../lib/ticketing/memory-store.mjs';
import { sealOrderToken, openOrderToken } from '../lib/ticketing/order-token.mjs';

const config = { baseUrl: 'https://sandbox.blokko.dev', apiKey: 'key_test', secret: 'secret_test', merchantUuid: 'm-uuid', merchantId: 'm-id', encoding: 'hex', timestampUnit: 's' };
const NOW = Date.UTC(2026, 9, 14, 12, 0, 0);

function signedWebhook(body, { path = '/api/webhooks/blokko', ts = Math.floor(NOW / 1000), nonce = 'n-1', cfg = config } = {}) {
  const rawBody = JSON.stringify(body);
  const signature = computeSignature(cfg.secret, canonicalString({ method: 'POST', path, body: rawBody, timestamp: ts, nonce }), cfg.encoding);
  return { method: 'POST', path, query: '', rawBody, headers: { 'blokko-signature': buildSignatureHeader({ apiKey: cfg.apiKey, timestamp: ts, nonce, signature }) } };
}

const paidEvent = (overrides = {}) => ({ authorizationId: 'AUTH1234', transactionUuid: 'tx-1', merchantId: 'order-1', merchantReference: 'order-1', transactionStatus: 'E', createdAt: '2026-10-14 11:59:00', completedAt: '2026-10-14 12:00:00', ...overrides });

test('canonical string follows the documented order and \\n separators', () => {
  assert.equal(
    canonicalString({ method: 'post', path: '/v2/invoice', query: '', body: '{"a":1}', timestamp: 1760000000, nonce: 'abc' }),
    'POST\n/v2/invoice\n\n{"a":1}\n1760000000\nabc',
  );
});

test('query string is normalized (sorted, encoded, no "?")', () => {
  assert.equal(normalizeQuery('?b=2&a=1 2'), 'a=1%202&b=2');
  assert.equal(normalizeQuery(''), '');
});

test('signature is HMAC-SHA256 of the canonical string with the secret', () => {
  const canonical = 'GET\n/v2/x\n\n\n1\nn';
  assert.equal(computeSignature('s', canonical, 'hex'), createHmac('sha256', 's').update(canonical).digest('hex'));
  assert.equal(computeSignature('s', canonical, 'base64'), createHmac('sha256', 's').update(canonical).digest('base64'));
});

test('header round-trips', () => {
  const h = buildSignatureHeader({ apiKey: 'k', timestamp: '1', nonce: 'n', signature: 'abc=' });
  assert.equal(h, 'Api-Key=k, Timestamp=1, Nonce=n, Signature=abc=');
  assert.deepEqual(parseSignatureHeader(h), { apiKey: 'k', timestamp: '1', nonce: 'n', signature: 'abc=' });
  assert.equal(parseSignatureHeader('Api-Key=k'), null);
});

test('verifyIncoming accepts a valid signature and rejects tampering, wrong key and stale timestamps', () => {
  const req = signedWebhook(paidEvent());
  const base = { method: 'POST', path: req.path, rawBody: req.rawBody, headerValue: req.headers['blokko-signature'], now: NOW };
  assert.equal(verifyIncoming(config, base).ok, true);
  assert.equal(verifyIncoming(config, { ...base, rawBody: req.rawBody.replace('"E"', '"P"') }).reason, 'bad_signature');
  assert.equal(verifyIncoming({ ...config, apiKey: 'other' }, base).reason, 'api_key_mismatch');
  assert.equal(verifyIncoming(config, { ...base, now: NOW + 10 * 60 * 1000 }).reason, 'timestamp_out_of_window');
  assert.equal(verifyIncoming(config, { ...base, headerValue: '' }).reason, 'missing_or_malformed_header');
});

test('signRequest signs exactly the body that is sent', () => {
  const { header, rawBody } = signRequest(config, { method: 'POST', path: '/v2/invoice', body: { amount: 1 } });
  const p = parseSignatureHeader(header);
  assert.equal(rawBody, '{"amount":1}');
  assert.equal(p.signature, computeSignature(config.secret, canonicalString({ method: 'POST', path: '/v2/invoice', body: rawBody, timestamp: p.timestamp, nonce: p.nonce })));
});

test('createInvoice sends a signed POST /v2/invoice with merchantUuid, amount and successUrl', async () => {
  let captured;
  const fetchImpl = async (url, init) => { captured = { url, init }; return new Response(JSON.stringify({ invoiceNumber: 'inv-1', invoiceUrl: 'https://pay', status: 'P', hash: 'h' }), { status: 200 }); };
  const res = await createClient(config, { fetchImpl }).createInvoice({ amount: 218, successUrl: 'https://tif/ok?t=x', expiresAt: '2026-10-20' });
  assert.equal(captured.url, 'https://sandbox.blokko.dev/v2/invoice');
  assert.equal(captured.init.method, 'POST');
  assert.deepEqual(JSON.parse(captured.init.body), { merchantUuid: 'm-uuid', amount: 218, expiresAt: '2026-10-20', successUrl: 'https://tif/ok?t=x' });
  assert.match(captured.init.headers['blokko-signature'], /^Api-Key=key_test, Timestamp=\d+, Nonce=[\w-]+, Signature=[0-9a-f]{64}$/);
  assert.equal(res.invoiceUrl, 'https://pay');
});

test('client surfaces API errors with status and body', async () => {
  const fetchImpl = async () => new Response('{"message":"invalid signature"}', { status: 401 });
  await assert.rejects(createClient(config, { fetchImpl }).createInvoice({ amount: 1 }), (e) => e.status === 401 && e.body.message === 'invalid signature');
});

test('setWebhook only accepts HTTPS', async () => {
  await assert.rejects(createClient(config, { fetchImpl: async () => new Response('{}') }).setWebhook('http://x'), /HTTPS/);
});

test('payload model validation', () => {
  assert.equal(parseWebhookPayload('nope').reason, 'invalid_json');
  assert.equal(parseWebhookPayload(JSON.stringify({ transactionUuid: 't', transactionStatus: 'X' })).reason, 'unknown_status');
  assert.equal(parseWebhookPayload(JSON.stringify(paidEvent())).event.status, 'E');
});

test('webhook marks the order paid once and issues tickets once', async () => {
  const store = createMemoryStore({ orders: [{ id: 'order-1', amount: 218 }] });
  let issued = 0;
  const deps = { config, store, now: NOW, onPaid: async () => { issued += 1; } };

  const first = await handleBlokkoWebhook(signedWebhook(paidEvent(), { nonce: 'n-1' }), deps);
  assert.equal(first.status, 200);
  assert.equal(store.state.orders.get('order-1').status, 'paid');

  const replay = await handleBlokkoWebhook(signedWebhook(paidEvent(), { nonce: 'n-1' }), deps);
  assert.deepEqual(replay.body, { ok: true, duplicate: true });

  const retry = await handleBlokkoWebhook(signedWebhook(paidEvent(), { nonce: 'n-2' }), deps);
  assert.equal(retry.body.alreadyPaid, true);
  assert.equal(issued, 1);
});

test('webhook ignores pending events, flags unmatched payments and rejects bad signatures', async () => {
  const alerts = [];
  const store = createMemoryStore({ orders: [{ id: 'order-1' }] });
  const deps = { config, store, now: NOW, alert: async (a) => alerts.push(a.type) };

  const pending = await handleBlokkoWebhook(signedWebhook(paidEvent({ transactionStatus: 'P' }), { nonce: 'p' }), deps);
  assert.equal(pending.body.status, 'pending');
  assert.equal(store.state.orders.get('order-1').status, 'pending');

  const unmatched = await handleBlokkoWebhook(signedWebhook(paidEvent({ merchantId: 'x', merchantReference: 'x', transactionUuid: 'tx-9' }), { nonce: 'u' }), deps);
  assert.equal(unmatched.body.matched, false);

  const forged = signedWebhook(paidEvent(), { nonce: 'f', cfg: { ...config, secret: 'wrong' } });
  assert.equal((await handleBlokkoWebhook(forged, deps)).status, 401);
  assert.deepEqual(alerts, ['blokko_payment_unmatched', 'blokko_webhook_rejected']);
});

test('order token for successUrl: round-trip, tamper-proof, expires', () => {
  const secret = 'x'.repeat(40);
  const token = sealOrderToken('order-1', secret, { now: NOW, ttlSeconds: 60 });
  assert.equal(openOrderToken(token, secret, { now: NOW }), 'order-1');
  assert.equal(openOrderToken(token.slice(0, -2) + 'AA', secret, { now: NOW }), null);
  assert.equal(openOrderToken(token, 'y'.repeat(40), { now: NOW }), null);
  assert.equal(openOrderToken(token, secret, { now: NOW + 61_000 }), null);
  assert.throws(() => sealOrderToken('o', 'short'), /32 characters/);
});

test('canonical string matches the official Blokko playground byte for byte (2026-10-15 sandbox, 200 OK)', () => {
  // Raw String to Sign shown by playground-sandbox.blokko.ai for a payment intent. The playground's
  // signature for it matched computeSignature(secretAsText, canonical, 'hex'); the secret is not stored here.
  const body = '{"merchantTransactionId":"a36cdb4f-a3f3-4763-bbc7-87a7ff75545d","merchantReference":"dcdfc193-9c8a-4ff5-ad96-ecf605488112","terminalUuid":"TSDX611748604","amount":"0.01","paymentMethodId":"BCLN"}';
  assert.equal(
    canonicalString({ method: 'POST', path: '/v2/payment-intent', query: '', body, timestamp: 1792040270, nonce: '6fb77b7c-4863-4223-99cf-606da6a512c2' }),
    `POST\n/v2/payment-intent\n\n${body}\n1792040270\n6fb77b7c-4863-4223-99cf-606da6a512c2`,
  );
});

test('unsigned pending notices are acknowledged without touching the store; unsigned paid events are rejected', async () => {
  const store = createMemoryStore({ orders: [{ id: 'order-1' }] });
  const deps = { config, store, now: NOW };
  const rawBody = (b) => JSON.stringify(b);

  const pending = await handleBlokkoWebhook({ method: 'POST', path: '/api/webhooks/blokko', rawBody: rawBody(paidEvent({ transactionStatus: 'P' })), headers: {} }, deps);
  assert.equal(pending.status, 200);
  assert.equal(pending.body.verified, false);
  assert.equal(store.state.events.length, 0);

  const forgedPaid = await handleBlokkoWebhook({ method: 'POST', path: '/api/webhooks/blokko', rawBody: rawBody(paidEvent()), headers: {} }, deps);
  assert.equal(forgedPaid.status, 401);
  assert.equal(store.state.orders.get('order-1').status, 'pending');
});

test('a failed attempt releases the nonce so Blokko\'s retry (same nonce) is processed', async () => {
  const store = createMemoryStore({ orders: [{ id: 'order-1' }] });
  const realMark = store.markOrderPaid;
  let failNext = true;
  store.markOrderPaid = async (...args) => {
    if (failNext) { failNext = false; throw new Error('db down'); }
    return realMark(...args);
  };
  const deps = { config, store, now: NOW };
  const first = await handleBlokkoWebhook(signedWebhook(paidEvent(), { nonce: 'retry-1' }), deps);
  assert.equal(first.status, 500);
  const retry = await handleBlokkoWebhook(signedWebhook(paidEvent(), { nonce: 'retry-1' }), deps);
  assert.equal(retry.status, 200);
  assert.equal(store.state.orders.get('order-1').status, 'paid');
});

test('webhook dates without a zone are read as UTC', () => {
  const { event } = parseWebhookPayload(JSON.stringify(paidEvent({ completedAt: '2026-10-14 12:00:00' })));
  assert.equal(event.completedAt, '2026-10-14T12:00:00.000Z');
  assert.equal(parseWebhookPayload(JSON.stringify(paidEvent({ completedAt: '2026-10-15T04:57:55.809Z' }))).event.completedAt, '2026-10-15T04:57:55.809Z');
});

test('payment intent uses /v2/payment/intent with the configured terminal; methods and status endpoints', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, method: init.method, body: init.body }); return new Response('{}', { status: 200 }); };
  const client = createClient({ ...config, terminalUuid: 'TERM-1' }, { fetchImpl });
  await client.createPaymentIntent({ merchantTransactionId: 'mtx-1', merchantReference: 'order-1', amount: 3900 });
  await client.getPaymentMethods();
  await client.getPaymentByTransactionId('tx-1');
  assert.equal(calls[0].url, 'https://sandbox.blokko.dev/v2/payment/intent');
  assert.deepEqual(JSON.parse(calls[0].body), { merchantTransactionId: 'mtx-1', terminalUuid: 'TERM-1', amount: '3900', merchantReference: 'order-1' });
  assert.equal(calls[1].url, 'https://sandbox.blokko.dev/v2/merchants/m-id/payment-methods');
  assert.equal(calls[2].url, 'https://sandbox.blokko.dev/v2/payment/tx-1');
  await assert.rejects(createClient(config, { fetchImpl }).createPaymentIntent({ merchantTransactionId: 'x', amount: 1 }), /terminalUuid/);
});
