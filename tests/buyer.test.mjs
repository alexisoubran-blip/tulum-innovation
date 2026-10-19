import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, validateInvoice, emailDomainAccepts, countryOptions } from '../lib/ticketing/buyer.mjs';
import { createCheckout } from '../lib/ticketing/checkout.mjs';
import { createMemoryStore } from '../lib/ticketing/memory-store.mjs';

test('phone: country code + national number, Mexican and international formats', () => {
  assert.deepEqual(normalizePhone('MX', '55 1234 5678'), { phone: '+52 5512345678', country: 'MX' });
  assert.deepEqual(normalizePhone('MX', '+52 1 55 1234 5678'), { phone: '+52 5512345678', country: 'MX' });
  assert.deepEqual(normalizePhone('ES', '612 345 678'), { phone: '+34 612345678', country: 'ES' });
  assert.deepEqual(normalizePhone('AR', '11 2345 6789'), { phone: '+54 1123456789', country: 'AR' });
  assert.equal(normalizePhone('MX', '55 1234').error, 'invalid_phone');
  assert.equal(normalizePhone('ZZ', '5512345678').error, 'invalid_phone');
  assert.deepEqual(normalizePhone(undefined, '+52 55 1234 5678'), { phone: '+525512345678', country: null });
  assert.ok(countryOptions().find((c) => c.iso === 'MX' && c.dial === '+52'));
});

test('invoice (CFDI): optional, validated when requested', () => {
  assert.deepEqual(validateInvoice(undefined), { invoice: null });
  const ok = validateInvoice({ requested: true, rfc: 'lgm-200101-ab1', legalName: 'Like Group Management', zip: '06600', regime: '601', use: 'G03' });
  assert.deepEqual(ok.invoice, { rfc: 'LGM200101AB1', legal_name: 'LIKE GROUP MANAGEMENT', zip: '06600', regime: '601', use: 'G03' });
  assert.equal(validateInvoice({ requested: true, rfc: 'XYZ', legalName: 'A B C', zip: '06600', regime: '601' }).error, 'invalid_rfc');
  assert.equal(validateInvoice({ requested: true, rfc: 'LOAA800101AB1', legalName: 'Ana', zip: '066', regime: '612' }).error, 'invalid_tax_zip');
  assert.equal(validateInvoice({ requested: true, rfc: 'LOAA800101AB1', legalName: 'Ana López', zip: '06600', regime: '999' }).error, 'invalid_tax_regime');
});

test('email domain check: rejects domains that do not exist, fails open on DNS trouble', async () => {
  const err = (code) => Object.assign(new Error(code), { code });
  const resolver = (mx, a) => ({ resolveMx: async () => { if (mx instanceof Error) throw mx; return mx; }, resolve4: async () => { if (a instanceof Error) throw a; return a; } });
  assert.equal(await emailDomainAccepts('a@gmail.com', { resolver: resolver([{ exchange: 'mx' }], []) }), true);
  assert.equal(await emailDomainAccepts('a@gmial.con', { resolver: resolver(err('ENOTFOUND'), err('ENOTFOUND')) }), false);
  assert.equal(await emailDomainAccepts('a@x.com', { resolver: resolver(err('ETIMEOUT'), []) }), true);
  assert.equal(await emailDomainAccepts('a@x.com', { resolver: { resolveMx: () => new Promise(() => {}), resolve4: () => new Promise(() => {}) }, timeoutMs: 20 }), true);
});

test('createOrder: name in parts, confirmed email, required phone, company and invoice in the order', async () => {
  const store = createMemoryStore({ passes: [{ id: 'executive-pass', name: 'Executive', price_usd: 1500 }], rate: 18.5 });
  const checkout = createCheckout({
    store, blokko: { async getPaymentMethods() { return []; } }, env: { ORDER_TOKEN_SECRET: 'x'.repeat(40) },
    emailDomainOk: async (e) => !e.endsWith('@gmial.con'), sendEmail: async () => ({ sent: true }),
  });
  const base = { passId: 'executive-pass', quantity: 1, firstName: ' Ana María ', lastName1: 'López', lastName2: 'Hernández', email: 'ana@empresa.mx', emailConfirm: 'ANA@empresa.mx', phoneCountry: 'MX', phone: '998 123 4567', acceptTerms: true };
  const code = async (patch) => (await checkout.createOrder({ ...base, ...patch }).catch((e) => e)).code;
  assert.equal(await code({ firstName: 'A' }), 'invalid_first_name');
  assert.equal(await code({ lastName1: '' }), 'invalid_last_name');
  assert.equal(await code({ emailConfirm: 'ana@empresa.com' }), 'email_mismatch');
  assert.equal(await code({ email: 'ana@gmial.con', emailConfirm: 'ana@gmial.con' }), 'invalid_email_domain');
  assert.equal(await code({ phone: '' }), 'invalid_phone');
  assert.equal(await code({ invoice: { requested: true, rfc: 'nope' } }), 'invalid_rfc');

  const { order } = await checkout.createOrder({ ...base, company: 'Empresa SA', jobTitle: 'CEO', invoice: { requested: true, rfc: 'EMP200101AB1', legalName: 'Empresa SA de CV', zip: '77760', regime: '601', use: 'G03' } });
  assert.equal(order.buyerName, 'Ana María López Hernández');
  const row = [...store.state.orders.values()][0];
  assert.deepEqual([row.buyer_phone, row.buyer_country], ['+52 9981234567', 'MX']);
  assert.deepEqual(row.metadata.buyer, { first_name: 'Ana María', last_name_1: 'López', last_name_2: 'Hernández' });
  assert.equal(row.metadata.company, 'Empresa SA');
  assert.equal(row.metadata.job_title, 'CEO');
  assert.equal(row.metadata.invoice.rfc, 'EMP200101AB1');
});
