// POST /api/webhooks/blokko — payment notifications from Blokko.
// Register this URL with PUT /v2/merchants/{merchantId}/webhook once the database is live.

import { configFromEnv, createClient } from '../../lib/ticketing/blokko.mjs';
import { handleBlokkoWebhook } from '../../lib/ticketing/blokko-webhook.mjs';
import { getStore, StoreNotConfiguredError } from '../../lib/ticketing/store.mjs';
import { createCheckout } from '../../lib/ticketing/checkout.mjs';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request) {
  const url = new URL(request.url);
  const rawBody = await request.text();

  let store;
  try {
    store = await getStore();
  } catch (error) {
    if (error instanceof StoreNotConfiguredError) return json(503, { ok: false, error: 'store_not_configured' });
    throw error;
  }

  const result = await handleBlokkoWebhook(
    {
      method: 'POST',
      path: url.pathname,
      query: url.search,
      rawBody,
      headers: Object.fromEntries([...request.headers].map(([k, v]) => [k.toLowerCase(), v])),
    },
    {
      config: configFromEnv(),
      store,
      // Issue the tickets and email them (idempotent; the status check repeats it if this fails).
      onPaid: async (order) => {
        try {
          await createCheckout({ store, blokko: createClient(configFromEnv()) }).fulfill(order);
        } catch (error) {
          console.warn('[blokko] fulfillment deferred', error?.message);
        }
      },
      // Never log secrets, signatures or full payloads (Blokko guideline); only metadata.
      alert: async (info) => console.warn('[blokko]', JSON.stringify(info)),
    },
  );
  return json(result.status, result.body);
}
