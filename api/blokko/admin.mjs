// POST /api/blokko/admin — admin actions for the Blokko integration (used by /admin/blokko).
// Requires Authorization: Bearer {TICKETING_ADMIN_TOKEN}.
//   { action: "methods" }                                 → payment methods for our merchant
//   { action: "register-webhook" }                        → points Blokko at our production webhook
//   { action: "test-intent", amount?, paymentMethodId? }  → sandbox only: a test QR in MXN
//   { action: "status", merchantTransactionId }           → payment status of a test

import { randomUUID, timingSafeEqual } from 'node:crypto';
import { configFromEnv, createClient, SANDBOX_URL, BlokkoError } from '../../lib/ticketing/blokko.mjs';

const WEBHOOK_URL = 'https://www.tuluminnovationfest.com/api/webhooks/blokko';

const json = (status, body) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

function authorized(request) {
  const token = process.env.TICKETING_ADMIN_TOKEN || '';
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (token.length < 16 || !given) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!authorized(request)) return json(401, { ok: false, error: 'unauthorized' });
  let body = {};
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'invalid_json' }); }

  const config = configFromEnv();
  const sandbox = config.baseUrl === SANDBOX_URL;
  const client = createClient(config);
  try {
    switch (body.action) {
      case 'methods':
        return json(200, { ok: true, environment: sandbox ? 'sandbox' : 'production', paymentMethods: await client.getPaymentMethods() });
      case 'register-webhook':
        return json(200, { ok: true, callbackUrl: WEBHOOK_URL, response: await client.setWebhook(WEBHOOK_URL) });
      case 'test-intent': {
        if (!sandbox) return json(400, { ok: false, error: 'sandbox_only' });
        const amount = Number(body.amount ?? 10);
        if (!(amount > 0 && amount <= 1000)) return json(400, { ok: false, error: 'amount_out_of_range' });
        const merchantTransactionId = randomUUID();
        const response = await client.createPaymentIntent({
          merchantTransactionId,
          merchantReference: 'tif-sandbox-test',
          amount: amount.toFixed(2),
          paymentMethodId: body.paymentMethodId || undefined,
        });
        return json(200, { ok: true, merchantTransactionId, response });
      }
      case 'status':
        if (!body.merchantTransactionId) return json(400, { ok: false, error: 'missing_merchantTransactionId' });
        return json(200, { ok: true, response: await client.getPaymentByMerchantTransactionId(String(body.merchantTransactionId)) });
      default:
        return json(400, { ok: false, error: 'unknown_action' });
    }
  } catch (error) {
    if (error instanceof BlokkoError) return json(502, { ok: false, error: 'blokko_error', status: error.status, response: error.body });
    return json(500, { ok: false, error: error.message });
  }
}
