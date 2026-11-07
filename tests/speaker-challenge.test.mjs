import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout } from '../lib/ticketing/checkout.mjs';
import { createMemoryStore } from '../lib/ticketing/memory-store.mjs';
import { createClient, configFromEnv } from '../lib/ticketing/blisscore.mjs';
import { LGM_BANK_ENV } from '../lib/ticketing/bank-account.mjs';

const env = { ORDER_TOKEN_SECRET: 'x'.repeat(40), BREVO_API_KEY: 'brevo-test', ...LGM_BANK_ENV };
const NOW = Date.parse('2026-11-08T19:00:00Z');
const passes = [
  { id: 'general-access', name: 'General Access', price_usd: '218.00' },
  { id: 'executive-pass', name: 'Executive Pass', price_usd: '1500.00' },
  { id: 'business-pass', name: 'Business Pass', price_usd: '222.00', category: 'business', max_quantity: 1 },
];
const promoCodes = [
  { code: 'RON10', speaker_name: 'Ron Oliver', tier: 'B', goal_tickets: 10, photo_url: '/r.webp', email: 'ron@x.com' },
  { code: 'ANA10', speaker_name: 'Ana', tier: 'C', goal_tickets: 4 },
  { code: 'STAR10', speaker_name: 'Star', tier: 'A' },
  { code: 'QUIET10', speaker_name: 'Quiet', tier: 'A' },
  { code: 'PANA10', speaker_name: 'P One', tier: 'Panel', panel: 'Storytelling for Regeneration' },
  { code: 'PANB10', speaker_name: 'P Two', tier: 'Panel', panel: 'Storytelling for Regeneration' },
  { code: 'OFF10', speaker_name: 'Off', tier: 'C', goal_tickets: 4, active: false },
];
const buyer = { passId: 'general-access', quantity: 1, name: 'Ana López', email: 'ana@example.com', phone: '+52 55 1234 5678', acceptTerms: true };
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


function setup() {
  const store = createMemoryStore({ passes, rate: 18.5, promoCodes });
  const intents = [];
  const blokko = {
    async getPaymentMethods() { return [{ id: 'WALL' }]; },
    async createPaymentIntent(b) { intents.push(b); return { transactionId: `t${intents.length}`, qrUrl: 'x', totalAmount: b.amount }; },
    async getPaymentByMerchantTransactionId() { return { transactionStatus: 'P' }; },
  };
  const cards = createClient(configFromEnv({ BLISSCORE_AFFILIATE_CODE: 'AFF-001-SANDBOX' }), { fetchImpl: fakeFetch([]), timeoutMs: 50 });
  const checkout = createCheckout({ store, blokko, cards, env, now: () => NOW, sendEmail: async () => ({ sent: true }) });
  return { store, checkout, intents };
}

test('speaker code: 10% off, stored on the order, same amount to TacPay, Blokko and SPEI', async () => {
  const { checkout, intents } = setup();
  const plain = await checkout.createOrder({ ...buyer, quantity: 2 });
  const coded = await checkout.createOrder({ ...buyer, quantity: 2, promoCode: ' ron10 ' });
  assert.equal(plain.order.promo, null);
  assert.equal(plain.order.amountMxn, Math.ceil(436 * 18.5)); // unchanged without a code
  assert.equal(coded.order.promo.code, 'RON10');
  assert.equal(coded.order.promo.speaker, 'Ron Oliver');
  assert.equal(coded.order.amountMxn, Math.ceil(196.2 * 2 * 18.5));
  assert.equal(coded.order.promo.discountMxn, plain.order.amountMxn - coded.order.amountMxn);
  // Blokko QR and SPEI get the discounted amount
  await checkout.pay({ token: coded.token, methodId: 'WALL' });
  assert.equal(Number(intents.at(-1).amount), coded.order.amountMxn);
  const viaCard = await checkout.createOrder({ ...buyer, promoCode: 'RON10' });
  assert.equal((await checkout.pay({ token: viaCard.token, methodId: 'CARD', card, billing })).status, 'paid');
  const viaSpei = await checkout.createOrder({ ...buyer, attribution: { code: 'ANA10' } });
  const t = await checkout.pay({ token: viaSpei.token, methodId: 'SPEI' });
  assert.equal(t.transfer.amountMxn, viaSpei.order.amountMxn);
});

test('speaker code: invalid, inactive and non-applicable codes are rejected', async () => {
  const { checkout } = setup();
  assert.equal((await checkout.createOrder({ ...buyer, promoCode: 'NOPE10' }).catch((e) => e)).code, 'promo_invalid');
  assert.equal((await checkout.createOrder({ ...buyer, promoCode: 'OFF10' }).catch((e) => e)).code, 'promo_invalid');
  assert.equal((await checkout.createOrder({ ...buyer, passId: 'business-pass', businessName: 'Café', businessAddress: 'Calle 2 Sur, Tulum', promoCode: 'RON10' }).catch((e) => e)).code, 'promo_not_applicable');
  assert.deepEqual(await checkout.promo({ code: 'ron10', passId: 'general-access' }), { code: 'RON10', speaker: 'Ron Oliver', percentOff: 10, appliesTo: ['general-access', 'executive-pass'] });
  await checkout.setPromoActive({ code: 'RON10', active: false });
  assert.equal((await checkout.promo({ code: 'RON10' }).catch((e) => e)).code, 'promo_invalid');
  const page = await checkout.speakerPage({ code: 'ANA10' });
  assert.equal(page.name, 'Ana');
  assert.equal(page.email, undefined);
});

test('leaderboard: paid tickets only, Tier A only when selling, panels add up; admin has courtesies', async () => {
  const { checkout, store } = setup();
  const pay = async (code, quantity, paid = true) => {
    const { token } = await checkout.createOrder({ ...buyer, quantity, promoCode: code });
    if (paid) await checkout.pay({ token, methodId: 'CARD', card, billing });
  };
  await pay('RON10', 3); await pay('RON10', 3); await pay('RON10', 5, false); // pending doesn't count
  await pay('ANA10', 1); await pay('STAR10', 2); await pay('PANA10', 4); await pay('PANB10', 1);
  const lb = await checkout.leaderboard();
  assert.deepEqual(lb.people.map((p) => [p.name, p.tickets]), [['Ron Oliver', 6], ['Star', 2], ['Ana', 1]]);
  assert.equal(lb.people[0].pct, 60);
  assert.equal(lb.people[1].goal, null);
  assert.ok(!lb.people.some((p) => p.name === 'Quiet'));
  assert.equal(JSON.stringify(lb).includes('ron@x.com'), false);
  assert.deepEqual(lb.panels.map((p) => [p.name, p.tickets, p.goal]), [['Storytelling for Regeneration', 5, 25]]);
  const admin = await checkout.adminSpeakers();
  const ron = admin.find((r) => r.code === 'RON10');
  assert.equal(ron.tickets, 6); assert.equal(ron.orders, 2); assert.equal(ron.courtesies, 1);
  assert.ok(ron.revenueMxn > 0);
  assert.equal((await store.listPromoPaidOrders()).length, 6);
});
