import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminRole, maskPersonal } from '../lib/ticketing/admin-auth.mjs';

const ADMIN = 'a'.repeat(32), VIEW = 'v'.repeat(32);
const req = (token, url = 'https://x.test/api') => new Request(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });

test('admin roles: admin token, read-only view token, query key only when allowed', () => {
  process.env.TICKETING_ADMIN_TOKEN = ADMIN; process.env.TICKETING_VIEW_TOKEN = VIEW;
  assert.deepEqual(adminRole(req(ADMIN)), { role: 'admin' });
  assert.deepEqual(adminRole(req(VIEW)), { role: 'view' });
  assert.deepEqual(adminRole(req('nope-nope-nope-nope')), { error: 'wrong_token' });
  assert.deepEqual(adminRole(req(null, `https://x.test/api?key=${VIEW}`)), { error: 'missing_token' });
  assert.deepEqual(adminRole(req(null, `https://x.test/api?key=${VIEW}`), { allowQuery: true }), { role: 'view' });
  process.env.TICKETING_VIEW_TOKEN = 'short';
  assert.deepEqual(adminRole(req('short')), { error: 'wrong_token' });
});

test('view role masks contact and tax data, keeps sales facts', () => {
  const out = maskPersonal({ sales: [{ buyerName: 'Ana López', buyerEmail: 'ana.lopez@gmail.com', buyerPhone: '+52 984 123 4567', amountMxn: 3600, invoice: { rfc: 'LOPA800101XXX', postalCode: '77760', razonSocial: 'Ana' } }], sellers: [{ email: 'x@y.com', phone: '9841112233', code: 'ANA10' }] });
  const s = out.sales[0];
  assert.equal(s.buyerName, 'Ana López');
  assert.equal(s.buyerEmail, 'a***@gmail.com');
  assert.equal(s.buyerPhone, '•••567');
  assert.equal(s.amountMxn, 3600);
  assert.equal(s.invoice.rfc, '•••');
  assert.equal(s.invoice.postalCode, '•••');
  assert.equal(out.sellers[0].email, 'x***@y.com');
  assert.equal(out.sellers[0].phone, '•••233');
});
