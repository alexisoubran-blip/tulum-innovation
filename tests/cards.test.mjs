import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout } from '../lib/ticketing/checkout.mjs';
import { createMemoryStore } from '../lib/ticketing/memory-store.mjs';
import { createClient, validateCard, validateBilling, cardBrand, luhn, configFromEnv, SANDBOX_BASE_URL, PAYMENT_PATH } from '../lib/ticketing/blisscore.mjs';

const SECRET = 'x'.repeat(40);
const env = { ORDER_TOKEN_SECRET: SECRET, BREVO_API_KEY: 'brevo-test' };
const NOW = Date.parse('2026-10-19T19:00:00Z');
const passes = [
  { id: 'executive-pass', name: 'Executive Pass', price_usd: '1500.00' },
  { id: 'general-access', name: 'General Access', price_usd: '218.00', price_pending: true },
  { id: 'business-pass', name: 'Business Pass · Digital Merchant', price_usd: '222.00', price_mxn: null, category: 'business', max_quantity: 1 },
  { id: 'voluntary-contribution', name: 'Community contribution', price_usd: '1.00', on_sale: true, hidden: true, category: 'festival', max_quantity: 1, issues_tickets: false },
  { id: 'whale-tank-reservation', name: 'Reservation', price_usd: '700.00', on_sale: true, hidden: true, category: 'whale-tank', max_quantity: 1, issues_tickets: false },
];
const buyer = { passId: 'executive-pass', quantity: 1, name: 'Ana López', email: 'ana@example.com', phone: '+52 55 1234 5678', acceptTerms: true };
const card = { number: '4111 1111 1111 1111', expMonth: '12', expYear: '28', cvv: '123', holderName: 'ana lopez' };
const billing = { street: 'Av. Tulum 1', city: 'Tulum', state: 'Quintana Roo', postalCode: '77760' };

// Fake BlissCore over fetch: answers by card number like their sandbox.
function fakeFetch(calls, { hang = false } = {}) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (hang) {
      return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
    }
    const reply = (status, data) => ({ status, json: async () => data });
    switch (body.card.number) {
      case '4111111111111112': return reply(200, { success: false, error: { code: 'insufficient_funds', message: 'Fondos insuficientes' }, order_id: body.order_id, status: 'declined' });
      case '4111111111111113': return reply(200, { success: false, error: { code: 'card_declined', message: 'Transacción declinada' }, order_id: body.order_id, status: 'declined' });
      case '5555555555554445': return reply(500, { success: false, error: { code: 'processor_error', message: 'Error en procesador' }, status: 'declined' });
      case '5105105105105100': return reply(502, null);
      default: return reply(200, { success: true, transaction_id: `dps_txn_${calls.length}`, order_id: body.order_id, authorization_code: 'A12345', amount: body.amount, currency: 'MXN', status: 'approved', selia_transaction_id: '295483' });
    }
  };
}

function setup({ hang = false, configured = true } = {}) {
  const store = createMemoryStore({ passes, rate: 18.5 });
  const calls = [];
  const cards = createClient(configFromEnv(configured ? { BLISSCORE_AFFILIATE_CODE: 'AFF-001-SANDBOX' } : {}), { fetchImpl: fakeFetch(calls, { hang }), timeoutMs: 50 });
  const blokko = { async getPaymentMethods() { return []; }, async getPaymentByMerchantTransactionId() { return { transactionStatus: 'P' }; } };
  const emails = [];
  const checkout = createCheckout({ store, blokko, cards, env, now: () => NOW, sendEmail: async (m) => { emails.push(m); return { sent: true }; } });
  return { store, calls, checkout, emails };
}

test('card validation: Luhn, brand, expiry, CVV, holder and billing', () => {
  const now = new Date(NOW);
  assert.ok(luhn('4111111111111111'));
  assert.equal(cardBrand('4111111111111111'), 'visa');
  assert.equal(cardBrand('5555555555554444'), 'mastercard');
  assert.equal(cardBrand('2223000048400011'), 'mastercard');
  assert.equal(cardBrand('378282246310005'), null);
  const ok = validateCard(card, { now });
  assert.deepEqual(ok.card, { number: '4111111111111111', exp_month: '12', exp_year: '2028', cvv: '123', holder_name: 'ANA LOPEZ' });
  assert.equal(ok.last4, '1111');
  assert.equal(validateCard({ ...card, number: '4111111111111112' }, { now }).error, 'invalid_card');
  assert.ok(validateCard({ ...card, number: '4111111111111112' }, { now, sandbox: true }).card, 'sandbox decline cards skip Luhn');
  assert.equal(validateCard({ ...card, number: '6011111111111117' }, { now }).error, 'card_brand_not_supported');
  assert.equal(validateCard({ ...card, expMonth: '09', expYear: '26' }, { now }).error, 'invalid_expiry');
  assert.ok(validateCard({ ...card, expMonth: '10', expYear: '26' }, { now }).card, 'valid through the end of the expiry month');
  assert.equal(validateCard({ ...card, cvv: '12' }, { now }).error, 'invalid_cvv');
  assert.equal(validateCard({ ...card, holderName: ' ' }, { now }).error, 'invalid_holder');
  assert.deepEqual(validateBilling(billing).billing, { street: 'Av. Tulum 1', city: 'Tulum', state: 'Quintana Roo', country: 'MX', postal_code: '77760' });
  assert.equal(validateBilling({ ...billing, postalCode: '777' }).error, 'invalid_postal_code');
});

test('client sends the BlissCore body with the affiliate code and reads approvals and declines', async () => {
  const calls = [];
  const client = createClient(configFromEnv({ BLISSCORE_AFFILIATE_CODE: 'AFF-1' }), { fetchImpl: fakeFetch(calls) });
  const r = await client.charge({ orderId: 'a'.repeat(60), amount: 27750, description: 'TIF', card: validateCard(card, { now: new Date(NOW) }).card, customer: { name: 'Ana', email: 'ana@example.com', phone: '+52 55 1234 5678' }, billing: validateBilling(billing).billing });
  assert.equal(calls[0].url, `${SANDBOX_BASE_URL}${PAYMENT_PATH}`);
  assert.equal(calls[0].body.affiliate_code, 'AFF-1');
  assert.equal(calls[0].body.order_id.length, 50);
  assert.equal(calls[0].body.currency, 'MXN');
  assert.equal(calls[0].body.customer.phone, '+525512345678');
  assert.deepEqual(r, { outcome: 'approved', transactionId: 'dps_txn_1', authorizationCode: 'A12345', processorTransactionId: '295483', amount: 27750 });
  assert.equal(configFromEnv({ BLISSCORE_AFFILIATE_CODE: 'x', BLISSCORE_BASE_URL: 'https://api-prod.blisscorepay.cloud/' }).sandbox, false);
});

test('options: card shows only when configured; pending and MXN-priced products', async () => {
  const off = await setup({ configured: false }).checkout.options();
  assert.equal(off.methods.find((m) => m.id === 'CARD').available, false);
  const { checkout } = setup();
  const o = await checkout.options();
  assert.equal(o.methods.find((m) => m.id === 'CARD').available, true);
  const ga = o.passes.find((p) => p.id === 'general-access');
  assert.deepEqual([ga.pricePending, ga.priceUsd, ga.priceMxn], [true, null, null]);
  const bp = o.passes.find((p) => p.id === 'business-pass');
  assert.deepEqual([bp.pricedIn, bp.priceUsd, bp.maxQuantity], ['USD', 222, 1]);
  assert.deepEqual(bp.content.fields, ['businessName', 'businessAddress', 'phone']);
});

test('pending prices cannot be bought; Business Pass needs business data and is priced in USD like every other pass', async () => {
  const { checkout, store } = setup();
  assert.equal((await checkout.createOrder({ ...buyer, passId: 'general-access' }).catch((e) => e)).code, 'price_pending');
  const bp = { ...buyer, passId: 'business-pass', businessName: 'Café Maya', businessAddress: 'Calle 2 Sur, Tulum Centro' };
  assert.equal((await checkout.createOrder({ ...bp, businessName: '' }).catch((e) => e)).code, 'invalid_business_name');
  assert.equal((await checkout.createOrder({ ...bp, businessAddress: '' }).catch((e) => e)).code, 'invalid_business_address');
  assert.equal((await checkout.createOrder({ ...bp, phone: '' }).catch((e) => e)).code, 'invalid_phone');
  const { order } = await checkout.createOrder(bp);
  assert.equal(order.amountUsd, 222);
  assert.equal(order.pricedIn ?? 'USD', 'USD');
  const row = [...store.state.orders.values()][0];
  assert.deepEqual(row.metadata.business, { name: 'Café Maya', address: 'Calle 2 Sur, Tulum Centro' });
});

test('approved card: order paid at once, tickets issued and emailed, no card data stored', async () => {
  const { checkout, store, calls, emails } = setup();
  const { token, order } = await checkout.createOrder(buyer);
  assert.equal(order.amountMxn, 27750);
  const r = await checkout.pay({ token, methodId: 'CARD', card, billing });
  assert.deepEqual(r, { status: 'paid', kind: 'card' });
  assert.equal(calls[0].body.amount, 27750);
  assert.equal(calls[0].body.description, 'TIF 2026 · Executive Pass x1');
  const row = [...store.state.orders.values()][0];
  assert.equal(row.status, 'paid');
  assert.equal(row.provider, 'tacpay');
  assert.equal(row.provider_reference, 'dps_txn_1');
  assert.equal(store.state.tickets.length, 1);
  assert.equal(emails.length, 1);
  const [attempt] = store.state.attempts;
  assert.deepEqual([attempt.status, attempt.card_brand, attempt.card_last4, attempt.authorization_code], ['paid', 'visa', '1111', 'A12345']);
  assert.ok(!JSON.stringify(store.state).includes('4111111111111111'), 'card number never stored');
  assert.ok(!JSON.stringify(store.state).includes('"123"'), 'CVV never stored');
  assert.equal((await checkout.status({ token })).status, 'paid');
});

test('declines are reported with a clear code and the buyer can try again or switch', async () => {
  const { checkout, store } = setup();
  const { token } = await checkout.createOrder(buyer);
  const err = await checkout.pay({ token, methodId: 'CARD', card: { ...card, number: '4111111111111112' }, billing }).catch((e) => e);
  assert.deepEqual([err.code, err.status], ['card_insufficient_funds', 402]);
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card: { ...card, number: '5555555555554445' }, billing }).catch((e) => e)).code, 'card_try_again');
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card: { ...card, cvv: '1' }, billing }).catch((e) => e)).code, 'card_invalid_cvv');
  assert.deepEqual(store.state.attempts.map((a) => [a.status, a.error_code]), [['failed', 'card_insufficient_funds'], ['failed', 'card_processor_error']]);
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing })).status, 'paid');
});

test('a timeout leaves the attempt unconfirmed and blocks any further payment until an admin resolves it', async () => {
  const { checkout, store } = setup({ hang: true });
  const { token } = await checkout.createOrder(buyer);
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'card_unconfirmed');
  const [attempt] = store.state.attempts;
  assert.deepEqual([attempt.status, attempt.error_code], ['unconfirmed', 'card_timeout']);
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'card_check_pending');
  assert.equal((await checkout.pay({ token, methodId: 'WALL' }).catch((e) => e)).code, 'card_check_pending');
  assert.equal((await checkout.status({ token })).cardUnconfirmed, true);

  const overview = await checkout.adminOverview();
  assert.equal(overview.attempts[0].card, 'visa ····1111');
  const resolved = await checkout.resolveCard({ attemptId: attempt.id, charged: true, reference: 'dps_txn_99' });
  assert.equal(resolved.status, 'paid');
  const row = [...store.state.orders.values()][0];
  assert.deepEqual([row.status, row.provider, row.provider_reference], ['paid', 'tacpay', 'dps_txn_99']);
  assert.equal(store.state.tickets.length, 1);
});

test('unconfirmed card marked "not charged" lets the buyer pay again', async () => {
  const { checkout, store } = setup({ hang: true });
  const { token } = await checkout.createOrder(buyer);
  await checkout.pay({ token, methodId: 'CARD', card, billing }).catch(() => {});
  await checkout.resolveCard({ attemptId: store.state.attempts[0].id, charged: false });
  assert.equal(store.state.attempts[0].status, 'failed');
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'card_unconfirmed', 'can try again (still hanging in this fake)');
});

test('card testing limits: per order and site-wide', async () => {
  const { checkout, store } = setup();
  const { token } = await checkout.createOrder(buyer);
  const bad = { ...card, number: '4111111111111113' };
  for (let i = 0; i < 5; i += 1) await checkout.pay({ token, methodId: 'CARD', card: bad, billing }).catch(() => {});
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'too_many_card_attempts');
  for (let i = 0; i < 20; i += 1) store.state.attempts.push({ id: `x${i}`, provider: 'tacpay', status: 'failed', created_at: new Date(NOW).toISOString(), order_id: 'other' });
  const second = await checkout.createOrder({ ...buyer, email: 'b@example.com' });
  assert.equal((await checkout.pay({ token: second.token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'card_temporarily_unavailable');
});

test('card is refused when TacPay is not configured', async () => {
  const { checkout } = setup({ configured: false });
  const { token } = await checkout.createOrder(buyer);
  assert.equal((await checkout.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'method_unavailable');
});

test('bank transfer: LGM account, CLABE check digit, international details and emailed instructions', async () => {
  const { LGM_BANK_ENV, clabeIsValid } = await import('../lib/ticketing/bank-account.mjs');
  const { transferEmail } = await import('../lib/ticketing/email.mjs');
  assert.ok(clabeIsValid('002694004900504773'));
  assert.ok(!clabeIsValid('002694004900504774'));
  const store = createMemoryStore({ passes, rate: 18.5 });
  const sent = [];
  const blokko = { async getPaymentMethods() { return []; } };
  const checkout = createCheckout({ store, blokko, env: { ...env, ...LGM_BANK_ENV }, now: () => NOW, sendEmail: async (m) => { sent.push(m); return { sent: true }; } });
  assert.equal((await checkout.options()).methods.find((m) => m.id === 'SPEI').available, true);
  const { token } = await checkout.createOrder(buyer);
  const r = await checkout.pay({ token, methodId: 'SPEI' });
  assert.equal(r.transfer.clabe, '002694004900504773');
  assert.deepEqual(r.transfer.international, { swift: 'BNMXMXMM', account: '504773', branch: '0049', aba: '021000089' });
  assert.equal(sent.length, 1, 'instructions emailed once');
  assert.ok(sent[0].text.includes(r.transfer.reference) && sent[0].text.includes('BNMXMXMM') && sent[0].text.includes('$27,750.00 MXN'));
  await checkout.pay({ token, methodId: 'SPEI' });
  assert.equal(sent.length, 1, 'not emailed again when the buyer reopens the transfer');
  const en = transferEmail({ locale: 'en', name: 'Ana', passName: 'X', quantity: 1, transfer: r.transfer, expiresAt: r.expiresAt, orderUrl: 'https://x' });
  assert.match(en.subject, /^Bank transfer details · TIF/);
});

test('every purchasable product in the live catalog can be paid with every Blokko method and by transfer', async () => {
  const { LGM_BANK_ENV } = await import('../lib/ticketing/bank-account.mjs');
  const { DEFAULT_METHODS } = await import('../lib/ticketing/checkout.mjs');
  const catalog = [
    ['executive-pass', 1500], ['business-pass', 222], ['hotel-upgrade', 1500], ['hotel-second-guest', 720],
    ['whale-tank-founder', 2500], ['whale-tank-founder-no-stay', 1500], ['whale-tank-team-member', 1000], ['whale-tank-team-member-no-stay', 720],
    ['sponsor-event-supporter', 2500, null, 0.16], ['sponsor-strategic-partner', 30000, null, 0.16],
  ].map(([id, usd, mxn = null, tax = 0]) => ({ id, name: id, price_usd: usd, price_mxn: mxn, tax_rate: tax, max_quantity: 1 }));
  const store = createMemoryStore({ passes: catalog, rate: 18.5 });
  const intents = [];
  const blokko = {
    async getPaymentMethods() { return DEFAULT_METHODS.map((id) => ({ id })); },
    async createPaymentIntent(b) { intents.push(b); return { transactionId: `t${intents.length}`, qrUrl: 'x', totalAmount: b.amount }; },
    async getPaymentByMerchantTransactionId() { return { transactionStatus: 'P' }; },
  };
  const checkout = createCheckout({ store, blokko, env: { ...env, ...LGM_BANK_ENV }, now: () => NOW, sendEmail: async () => ({ sent: true }) });
  const o = await checkout.options();
  assert.deepEqual(o.methods.filter((m) => m.available).map((m) => m.id), ['SPEI', ...DEFAULT_METHODS]);
  for (const pass of catalog) {
    const { token, order } = await checkout.createOrder({ ...buyer, passId: pass.id, businessName: 'Café Maya', businessAddress: 'Calle 2 Sur, Tulum' });
    for (const methodId of DEFAULT_METHODS) {
      const r = await checkout.pay({ token, methodId });
      assert.equal(r.kind, 'qr', `${pass.id} × ${methodId}`);
      assert.equal(Number(intents.at(-1).amount), order.amountMxn);
    }
    assert.equal((await checkout.pay({ token, methodId: 'SPEI' })).kind, 'transfer', `${pass.id} × SPEI`);
  }
  assert.equal(intents.length, catalog.length * DEFAULT_METHODS.length);
});

test('sandbox card credentials never sell on the live site', async () => {
  const store = createMemoryStore({ passes, rate: 18.5 });
  const sandbox = createClient(configFromEnv({ BLISSCORE_AFFILIATE_CODE: '100' }), { fetchImpl: fakeFetch([]) });
  const live = createCheckout({ store, blokko: { async getPaymentMethods() { return []; } }, cards: sandbox, env: { ...env, VERCEL_ENV: 'production' } });
  assert.equal((await live.options()).methods.find((m) => m.id === 'CARD').available, false);
  const { token } = await live.createOrder(buyer);
  assert.equal((await live.pay({ token, methodId: 'CARD', card, billing }).catch((e) => e)).code, 'method_unavailable');
  const preview = createCheckout({ store, blokko: { async getPaymentMethods() { return []; } }, cards: sandbox, env: { ...env, VERCEL_ENV: 'preview' } });
  assert.equal((await preview.options()).methods.find((m) => m.id === 'CARD').available, true);
  const prod = createClient(configFromEnv({ BLISSCORE_AFFILIATE_CODE: '100', BLISSCORE_BASE_URL: 'https://api-prod.blisscorepay.cloud' }), { fetchImpl: fakeFetch([]) });
  const liveProd = createCheckout({ store, blokko: { async getPaymentMethods() { return []; } }, cards: prod, env: { ...env, VERCEL_ENV: 'production' } });
  assert.equal((await liveProd.options()).methods.find((m) => m.id === 'CARD').available, true);
});

test('voluntary contribution: buyer sets the USD amount within range; reservation is USD 700', async () => {
  const { checkout } = setup();
  const vc = { ...buyer, passId: 'voluntary-contribution' };
  for (const amountUsd of [undefined, 0, 0.5, 100001, 'abc']) assert.equal((await checkout.createOrder({ ...vc, amountUsd }).catch((e) => e)).code, 'invalid_amount');
  assert.equal((await checkout.createOrder({ ...vc, amountUsd: 50, quantity: 2 }).catch((e) => e)).code, 'invalid_quantity');
  const { order } = await checkout.createOrder({ ...vc, amountUsd: 250.5 });
  assert.equal(order.amountUsd, 250.5);
  assert.equal(order.taxUsd, 0);
  assert.equal(order.issuesTickets, false);
  const r = await checkout.createOrder({ ...buyer, passId: 'whale-tank-reservation', amountUsd: 1 });
  assert.equal(r.order.amountUsd, 700);
});
