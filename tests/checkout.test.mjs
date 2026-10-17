import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, CheckoutError, allowedMethods } from '../lib/ticketing/checkout.mjs';
import { createMemoryStore } from '../lib/ticketing/memory-store.mjs';
import { verifyTicketToken, ticketToken } from '../lib/ticketing/tickets.mjs';
import { openOrderToken } from '../lib/ticketing/order-token.mjs';
import { handleBlokkoWebhook } from '../lib/ticketing/blokko-webhook.mjs';
import { canonicalString, computeSignature, buildSignatureHeader } from '../lib/ticketing/blokko.mjs';

const SECRET = 'x'.repeat(40);
const env = { ORDER_TOKEN_SECRET: SECRET, BREVO_API_KEY: 'brevo-test' };
const passes = [
  { id: 'general-access', name: 'General Access · 4-Day Pass', price_usd: '218.00' },
  { id: 'executive-pass', name: 'Executive Pass', price_usd: '1590.00' },
  { id: 'night-program', name: 'Night Program', price_usd: '0.00', on_sale: false },
];
const buyer = { passId: 'general-access', quantity: 2, name: '  Ana   López ', email: 'Ana@Example.com', acceptTerms: true, locale: 'en', attribution: { utm_source: 'ig', ref: 'TERE' } };

function fakeBlokko() {
  const calls = { intents: [], status: new Map() };
  return {
    calls,
    async getPaymentMethods() {
      return [{ id: 'LPIX', name: 'PIX' }, { id: 'WALL', name: 'WalletConnect', category: 'stablecoins' }, { id: 'BTSO', name: 'BITSO', category: 'exchanges' }];
    },
    async createPaymentIntent(body) {
      calls.intents.push(body);
      return { transactionId: `tx-${calls.intents.length}`, transactionStatus: 'P', qrUrl: 'https://qr/x.png', qrContent: 'qr-content', expiresAt: '2026-10-17T19:04:55.174Z', totalAmount: body.amount, currency: 'MXN' };
    },
    async getPaymentByMerchantTransactionId(id) {
      return calls.status.get(id) ?? { transactionStatus: 'P' };
    },
  };
}

function setup({ rate = 18.5, nowMs = Date.parse('2026-10-17T19:00:00Z') } = {}) {
  const store = createMemoryStore({ passes, rate });
  const blokko = fakeBlokko();
  const emails = [];
  const clock = { t: nowMs };
  const checkout = createCheckout({ store, blokko, env, now: () => clock.t, sendEmail: async (m) => { emails.push(m); return { sent: true }; } });
  return { store, blokko, emails, clock, checkout };
}

test('options: on-sale passes in USD and MXN, only allowed Blokko methods in our order', async () => {
  const { checkout } = setup();
  const o = await checkout.options();
  assert.deepEqual(o.passes.map((p) => [p.id, p.priceUsd, p.priceMxn]), [['general-access', 218, 4033], ['executive-pass', 1590, 29415]]);
  assert.deepEqual(o.methods.map((m) => m.id), ['WALL', 'BTSO']);
  assert.deepEqual(allowedMethods({ BLOKKO_ALLOWED_METHODS: 'codi, wall' }), ['CODI', 'WALL']);
});

test('createOrder prices on the server, cleans input and returns an encrypted token', async () => {
  const { checkout, store } = setup();
  const { token, order } = await checkout.createOrder({ ...buyer, priceUsd: 1 });
  assert.equal(order.amountUsd, 436);
  assert.equal(order.amountMxn, 8066); // 436 × 18.5
  const row = await store.getOrder(openOrderToken(token, SECRET));
  assert.equal(row.buyer_name, 'Ana López');
  assert.equal(row.buyer_email, 'ana@example.com');
  assert.equal(row.currency, 'MXN');
  assert.equal(row.locale, 'en');
  assert.deepEqual(row.metadata, { ref: 'TERE' });
});

test('createOrder rejects bad input, unavailable passes, bots and a missing rate', async () => {
  const { checkout } = setup();
  const code = async (input) => (await checkout.createOrder(input).catch((e) => e)).code;
  assert.equal(await code({ ...buyer, email: 'nope' }), 'invalid_email');
  assert.equal(await code({ ...buyer, quantity: 11 }), 'invalid_quantity');
  assert.equal(await code({ ...buyer, acceptTerms: false }), 'terms_required');
  assert.equal(await code({ ...buyer, passId: 'night-program' }), 'pass_unavailable');
  assert.equal(await code({ ...buyer, website: 'spam' }), 'invalid_request');
  const noRate = setup({ rate: null });
  assert.equal((await noRate.checkout.createOrder(buyer).catch((e) => e)).code, 'rate_not_set');
});

test('pay creates a Blokko intent with our ids and the MXN amount; refuses other methods', async () => {
  const { checkout, blokko, store } = setup();
  const { token } = await checkout.createOrder(buyer);
  const orderId = openOrderToken(token, SECRET);
  const qr = await checkout.pay({ token, methodId: 'wall' });
  assert.equal(qr.qrUrl, 'https://qr/x.png');
  assert.deepEqual(blokko.calls.intents[0], { merchantTransactionId: qr.attemptId, merchantReference: orderId, amount: '8066.00', paymentMethodId: 'WALL' });
  const [attempt] = await store.listAttempts(orderId);
  assert.equal(attempt.provider_transaction_id, 'tx-1');
  assert.equal((await checkout.pay({ token, methodId: 'LPIX' }).catch((e) => e)).code, 'method_not_allowed');
  assert.equal((await checkout.pay({ token: 'forged', methodId: 'WALL' }).catch((e) => e)).code, 'order_not_found');
});

test('expired orders cannot be paid', async () => {
  const { checkout, clock } = setup();
  const { token } = await checkout.createOrder(buyer);
  clock.t += 31 * 60 * 1000;
  const err = await checkout.pay({ token, methodId: 'WALL' }).catch((e) => e);
  assert.ok(err instanceof CheckoutError);
  assert.equal(err.code, 'order_expired');
  assert.equal((await checkout.status({ token })).status, 'expired');
});

test('status confirms with Blokko, issues tickets once and emails once', async () => {
  const { checkout, blokko, emails, store } = setup();
  const { token } = await checkout.createOrder(buyer);
  const qr = await checkout.pay({ token, methodId: 'WALL' });
  assert.equal((await checkout.status({ token })).status, 'pending');

  blokko.calls.status.set(qr.attemptId, { transactionStatus: 'E', transactionId: 'tx-1', completedAt: '2026-10-17 19:02:00' });
  const paid = await checkout.status({ token });
  assert.equal(paid.status, 'paid');
  assert.equal(paid.ticketsReady, true);
  await checkout.status({ token }); // polling again changes nothing

  const orderId = openOrderToken(token, SECRET);
  assert.equal((await store.listTickets(orderId)).length, 2);
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, 'ana@example.com');
  assert.match(emails[0].subject, /Your tickets/);
  assert.match(emails[0].html, /\/boleto\?t=/);
  assert.equal((await store.getOrder(orderId)).paid_at, '2026-10-17T19:02:00.000Z');
});

test('a failed email is retried on the next status check', async () => {
  const { store, blokko } = setup();
  let fail = true;
  const sent = [];
  const checkout = createCheckout({ store, blokko, env, sendEmail: async (m) => { if (fail) { fail = false; return { sent: false }; } sent.push(m); return { sent: true }; } });
  const { token } = await checkout.createOrder(buyer);
  const qr = await checkout.pay({ token, methodId: 'WALL' });
  blokko.calls.status.set(qr.attemptId, { transactionStatus: 'E', transactionId: 'tx-1' });
  await checkout.status({ token });
  assert.equal(sent.length, 0);
  await checkout.status({ token });
  assert.equal(sent.length, 1);
});

test('tickets: only for paid orders; each QR code is authentic and tamper-evident', async () => {
  const { checkout, blokko } = setup();
  const { token } = await checkout.createOrder(buyer);
  assert.equal((await checkout.tickets({ token }).catch((e) => e)).code, 'not_paid');
  const qr = await checkout.pay({ token, methodId: 'WALL' });
  blokko.calls.status.set(qr.attemptId, { transactionStatus: 'E', transactionId: 'tx-1' });
  await checkout.status({ token });
  const { tickets } = await checkout.tickets({ token });
  assert.equal(tickets.length, 2);
  assert.notEqual(tickets[0].code, tickets[1].code);
  const id = verifyTicketToken(tickets[0].code, SECRET);
  assert.ok(id);
  assert.equal(ticketToken(id, SECRET), tickets[0].code);
  assert.equal(verifyTicketToken(tickets[0].code.slice(0, -2) + 'AA', SECRET), null);
  assert.equal(verifyTicketToken(tickets[0].code, 'y'.repeat(40)), null);
});

test('the signed webhook pays the order and fulfillment runs once even if status also sees it', async () => {
  const { checkout, blokko, emails, store } = setup();
  const { token } = await checkout.createOrder(buyer);
  const orderId = openOrderToken(token, SECRET);
  const qr = await checkout.pay({ token, methodId: 'WALL' });

  const config = { apiKey: 'k', secret: 's', encoding: 'hex', timestampUnit: 's' };
  const rawBody = JSON.stringify({ authorizationId: 'A1', transactionUuid: 'tx-1', merchantId: 'm', merchantReference: orderId, transactionStatus: 'E', createdAt: '2026-10-17 19:01:00', completedAt: '2026-10-17 19:02:00' });
  const ts = Math.floor(Date.now() / 1000);
  const sig = computeSignature(config.secret, canonicalString({ method: 'POST', path: '/api/webhooks/blokko', body: rawBody, timestamp: ts, nonce: 'n1' }), 'hex');
  const res = await handleBlokkoWebhook(
    { method: 'POST', path: '/api/webhooks/blokko', rawBody, headers: { 'blokko-signature': buildSignatureHeader({ apiKey: 'k', timestamp: ts, nonce: 'n1', signature: sig }) } },
    { config, store, onPaid: (order) => checkout.fulfill(order) },
  );
  assert.equal(res.status, 200);
  blokko.calls.status.set(qr.attemptId, { transactionStatus: 'E', transactionId: 'tx-1' });
  await checkout.status({ token });
  assert.equal((await store.listTickets(orderId)).length, 2);
  assert.equal(emails.length, 1);
});

test('hidden test pass: not listed, but offered and purchasable through its direct link', async () => {
  const store = createMemoryStore({ rate: 18.5, passes: [...passes, { id: 'tif-test', name: 'TIF Test', price_usd: '1.00', hidden: true }] });
  const checkout = createCheckout({ store, blokko: fakeBlokko(), env, sendEmail: async () => ({ sent: true }) });
  assert.ok(!(await checkout.options()).passes.some((p) => p.id === 'tif-test'));
  const withTest = await checkout.options({ includePass: 'tif-test' });
  assert.deepEqual(withTest.passes.find((p) => p.id === 'tif-test'), { id: 'tif-test', name: 'TIF Test', priceUsd: 1, priceMxn: 19 });
  const { order } = await checkout.createOrder({ ...buyer, passId: 'tif-test', quantity: 1 });
  assert.equal(order.amountMxn, 19);
});
