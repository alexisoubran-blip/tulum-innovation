// GET /api/ticketing/health — is the ticketing database reachable and migrated?
// Public on purpose and harmless: it returns only table status and pass counts, never rows or keys.

import { getStore, StoreNotConfiguredError } from '../../lib/ticketing/store.mjs';

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

export async function GET() {
  let store;
  try {
    store = await getStore();
  } catch (error) {
    if (error instanceof StoreNotConfiguredError) return json(503, { ok: false, database: 'not_configured' });
    return json(500, { ok: false, database: 'error' });
  }
  try {
    const result = await store.healthCheck();
    return json(200, { ok: true, database: 'ok', ...result });
  } catch (error) {
    // Status and PostgREST code only (e.g. 42P01 = table missing, 401 = bad key).
    return json(503, { ok: false, database: 'error', status: error.status ?? null, code: error.code ?? null });
  }
}
