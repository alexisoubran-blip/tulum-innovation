import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseStore, SupabaseStoreError } from '../lib/ticketing/supabase-store.mjs';
import { getStore, StoreNotConfiguredError } from '../lib/ticketing/store.mjs';

const ORDER_ID = '7d0c3f4e-2b1a-4c5d-9e8f-0a1b2c3d4e5f';
const env = { SUPABASE_URL: 'https://example.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'eyJ.test.key' };

// Records every call and answers from a queue of { status, body } responses.
function mockFetch(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
    const next = responses.shift() ?? { status: 200, body: [] };
    const text = next.body === undefined ? '' : JSON.stringify(next.body);
    return new Response(text || null, { status: next.status });
  };
  return { calls, fetchImpl };
}

test('getStore refuses to run without Supabase credentials', async () => {
  await assert.rejects(getStore({}), StoreNotConfiguredError);
});

test('requests go to /rest/v1 with service key headers; sb_secret keys skip the Bearer header', async () => {
  const jwt = mockFetch([{ status: 201 }]);
  await createSupabaseStore(env, { fetchImpl: jwt.fetchImpl }).claimNonce('n-1');
  assert.equal(jwt.calls[0].url, 'https://example.supabase.co/rest/v1/webhook_nonces');
  assert.equal(jwt.calls[0].headers.apikey, 'eyJ.test.key');
  assert.equal(jwt.calls[0].headers.Authorization, 'Bearer eyJ.test.key');

  const secret = mockFetch([{ status: 201 }]);
  await createSupabaseStore({ ...env, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc' }, { fetchImpl: secret.fetchImpl }).claimNonce('n-1');
  assert.equal(secret.calls[0].headers.apikey, 'sb_secret_abc');
  assert.equal(secret.calls[0].headers.Authorization, undefined);
});

test('claimNonce: new nonce → true, duplicate (409/23505) → false, other errors throw', async () => {
  const { fetchImpl, calls } = mockFetch([
    { status: 201 },
    { status: 409, body: { code: '23505', message: 'duplicate key value' } },
    { status: 500, body: { code: 'XX000', message: 'boom' } },
  ]);
  const store = createSupabaseStore(env, { fetchImpl });
  assert.equal(await store.claimNonce('n-1'), true);
  assert.deepEqual(calls[0].body, { nonce: 'n-1', provider: 'blokko' });
  assert.equal(await store.claimNonce('n-1'), false);
  await assert.rejects(store.claimNonce('n-2'), SupabaseStoreError);
});

test('recordPaymentEvent maps to payment_events columns', async () => {
  const { fetchImpl, calls } = mockFetch([{ status: 201 }]);
  await createSupabaseStore(env, { fetchImpl }).recordPaymentEvent({ provider: 'blokko', reference: 'tx-1', status: 'E', payload: { a: 1 }, receivedAt: '2026-10-14T12:00:00.000Z' });
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(calls[0].body, { provider: 'blokko', reference: 'tx-1', status: 'E', order_id: null, payload: { a: 1 }, received_at: '2026-10-14T12:00:00.000Z' });
  assert.equal(calls[0].headers.Prefer, 'return=minimal');
});

test('findOrderForBlokkoEvent tries order id, then invoice number, then transactionUuid', async () => {
  const order = { id: ORDER_ID, status: 'pending' };
  const byId = mockFetch([{ status: 200, body: [order] }]);
  assert.deepEqual(await createSupabaseStore(env, { fetchImpl: byId.fetchImpl }).findOrderForBlokkoEvent({ merchantReference: ORDER_ID, transactionUuid: 'tx-1' }), order);
  assert.match(byId.calls[0].url, new RegExp(`orders\\?select=\\*&id=eq\\.${ORDER_ID}&limit=1$`));

  // Non-uuid references are never sent as an id filter (Postgres would reject the cast).
  const fallback = mockFetch([{ status: 200, body: [] }, { status: 200, body: [order] }]);
  const found = await createSupabaseStore(env, { fetchImpl: fallback.fetchImpl }).findOrderForBlokkoEvent({ merchantReference: 'not-a-uuid', invoiceNumber: 'INV 7', transactionUuid: 'tx-1' });
  assert.deepEqual(found, order);
  assert.match(fallback.calls[0].url, /blokko_invoice_number=eq\.INV%207/);
  assert.match(fallback.calls[1].url, /provider=eq\.blokko&provider_reference=eq\.tx-1/);

  const none = mockFetch([{ status: 200, body: [] }]);
  assert.equal(await createSupabaseStore(env, { fetchImpl: none.fetchImpl }).findOrderForBlokkoEvent({ transactionUuid: 'tx-9' }), null);
});

test('markOrderPaid calls the RPC and returns { changed, order }', async () => {
  const paid = { id: ORDER_ID, status: 'paid' };
  const { fetchImpl, calls } = mockFetch([
    { status: 200, body: [{ changed: true, order_row: paid }] },
    { status: 200, body: [{ changed: false, order_row: paid }] },
    { status: 404, body: { code: 'P0002', message: 'order not found' } },
  ]);
  const store = createSupabaseStore(env, { fetchImpl });
  const info = { provider: 'blokko', providerReference: 'tx-1', authorizationId: 'AUTH', paidAt: '2026-10-14T12:00:00Z' };
  assert.deepEqual(await store.markOrderPaid(ORDER_ID, info), { changed: true, order: paid });
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/rpc/mark_order_paid');
  assert.deepEqual(calls[0].body, { p_order_id: ORDER_ID, p_provider: 'blokko', p_reference: 'tx-1', p_authorization: 'AUTH', p_paid_at: '2026-10-14T12:00:00Z' });
  assert.deepEqual(await store.markOrderPaid(ORDER_ID, info), { changed: false, order: paid });
  await assert.rejects(store.markOrderPaid(ORDER_ID, info), (e) => e.code === 'P0002');
});

test('errors never include the service key', async () => {
  const { fetchImpl } = mockFetch([{ status: 401, body: { message: 'Invalid API key' } }]);
  const error = await createSupabaseStore(env, { fetchImpl }).recordPaymentEvent({ provider: 'blokko', payload: {} }).catch((e) => e);
  assert.ok(error instanceof SupabaseStoreError);
  assert.ok(!error.message.includes('eyJ.test.key'));
});

test('healthCheck reports pass counts and table status without returning rows', async () => {
  const { fetchImpl, calls } = mockFetch([
    { status: 200, body: [{ id: 'a', on_sale: true }, { id: 'b', on_sale: false }] },
    ...Array.from({ length: 8 }, () => ({ status: 200, body: [] })),
    { status: 200, body: 18.5 },
  ]);
  const result = await createSupabaseStore(env, { fetchImpl }).healthCheck();
  assert.equal(result.passes, 2);
  assert.equal(result.passesOnSale, 1);
  assert.equal(Object.keys(result.tables).length, 8);
  assert.equal(result.usdMxnRateSet, true);
  assert.ok(calls.slice(1, 9).every((c) => c.url.endsWith('limit=0')));
  assert.equal(calls[9].url, 'https://example.supabase.co/rest/v1/rpc/current_usd_mxn');
});

test('checkout queries: idempotent ticket insert, single email claim, on-sale passes', async () => {
  const { fetchImpl, calls } = mockFetch([
    { status: 201 },
    { status: 200, body: [{ id: ORDER_ID }] },
    { status: 200, body: [] },
    { status: 200, body: [] },
  ]);
  const store = createSupabaseStore(env, { fetchImpl });
  await store.insertTickets([{ order_id: ORDER_ID, seq: 1 }]);
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/tickets?on_conflict=order_id,seq');
  assert.equal(calls[0].headers.Prefer, 'resolution=ignore-duplicates,return=minimal');
  assert.equal(await store.claimTicketEmail(ORDER_ID), true);
  assert.match(calls[1].url, /orders\?id=eq\.[0-9a-f-]+&tickets_emailed_at=is\.null$/);
  assert.equal(await store.claimTicketEmail(ORDER_ID), false);
  await store.listPasses();
  assert.match(calls[3].url, /passes\?select=\*&on_sale=is\.true&hidden=is\.false&order=sort_order\.asc$/);
  assert.equal(await store.getOrder('not-a-uuid'), null);
});
