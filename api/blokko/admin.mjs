// POST /api/blokko/admin — admin actions for the Blokko integration (used by /admin/blokko).
// Requires Authorization: Bearer {TICKETING_ADMIN_TOKEN}.
//   { action: "methods" }                                 → payment methods for our merchant
//   { action: "register-webhook" }                        → points Blokko at our production webhook
//   { action: "init-terminal" }                           → POST /v2/pos/initialization with our serial (virtual, type E)
//   { action: "test-intent", amount?, paymentMethodId? }  → a test QR in MXN (production capped at 50 MXN)
//   { action: "status", merchantTransactionId }           → payment status of a test
//   { action: "overview" }                                → SPEI transfers and recent payment attempts (with errors)
//   { action: "confirm-transfer", reference }             → marks a SPEI order paid and issues its tickets
//   { action: "card-test", scenario }                     → sandbox-only BlissCore charge with a test card
//   { action: "resolve-card", attemptId, charged, reference? } → settles an 'unconfirmed' card attempt

import { randomUUID, timingSafeEqual } from 'node:crypto';
import { configFromEnv, createClient, SANDBOX_URL, BlokkoError } from '../../lib/ticketing/blokko.mjs';
import { getCheckout } from '../../lib/ticketing/runtime.mjs';
import { CheckoutError } from '../../lib/ticketing/checkout.mjs';
import { configFromEnv as cardsConfig, createClient as createCardsClient } from '../../lib/ticketing/blisscore.mjs';

// BlissCore sandbox test cards (guide, page 5). Never used against production.
const TEST_CARDS = {
  approved: '4111111111111111',
  mastercard: '5555555555554444',
  insufficient: '4111111111111112',
  declined: '4111111111111113',
  processor: '5555555555554445',
};

const WEBHOOK_URL = 'https://www.tuluminnovationfest.com/api/webhooks/blokko';

const json = (status, body) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

// Returns null when authorized, otherwise the reason (never the token itself).
function authError(request) {
  const token = (process.env.TICKETING_ADMIN_TOKEN || '').trim();
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (token.length < 16) return 'admin_token_not_configured_on_server';
  if (!given) return 'missing_token';
  const a = Buffer.from(token);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b) ? null : 'wrong_token';
}

export async function POST(request) {
  const denied = authError(request);
  if (denied) return json(401, { ok: false, error: 'unauthorized', reason: denied });
  let body = {};
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'invalid_json' }); }

  const config = configFromEnv();
  const sandbox = config.baseUrl === SANDBOX_URL;
  const client = createClient(config);
  try {
    switch (body.action) {
      case 'methods':
        return json(200, { ok: true, environment: sandbox ? 'sandbox' : 'production', paymentMethods: await client.getPaymentMethods() });
      case 'init-terminal':
        if (!config.terminalSerial) return json(400, { ok: false, error: 'missing_BLOKKO_TERMINAL_SERIAL' });
        return json(200, { ok: true, response: await client.initTerminal({ serial: config.terminalSerial, type: 'E' }) });
      case 'register-webhook':
        return json(200, { ok: true, callbackUrl: WEBHOOK_URL, response: await client.setWebhook(WEBHOOK_URL) });
      case 'test-intent': {
        if (!body.paymentMethodId) return json(400, { ok: false, error: 'choose_a_payment_method' });
        const amount = Number(body.amount ?? 10);
        // Blokko tests in production with real funds in their test wallets: keep those tiny.
        if (!(amount > 0 && amount <= (sandbox ? 1000 : 50))) return json(400, { ok: false, error: 'amount_out_of_range', max: sandbox ? 1000 : 50 });
        const merchantTransactionId = randomUUID();
        const response = await client.createPaymentIntent({
          merchantTransactionId,
          merchantReference: sandbox ? 'tif-sandbox-test' : 'tif-production-test',
          amount: amount.toFixed(2),
          paymentMethodId: String(body.paymentMethodId),
        });
        return json(200, { ok: true, merchantTransactionId, response });
      }
      case 'status':
        if (!body.merchantTransactionId) return json(400, { ok: false, error: 'missing_merchantTransactionId' });
        return json(200, { ok: true, response: await client.getPaymentByMerchantTransactionId(String(body.merchantTransactionId)) });
      case 'overview':
        return json(200, { ok: true, ...(await (await getCheckout()).adminOverview()) });
      case 'card-test': {
        const cfg = cardsConfig();
        if (!cfg.configured) return json(400, { ok: false, error: 'missing_BLISSCORE_AFFILIATE_CODE' });
        if (!cfg.sandbox) return json(400, { ok: false, error: 'card_test_only_in_sandbox' });
        const number = TEST_CARDS[body.scenario] || TEST_CARDS.approved;
        const result = await createCardsClient(cfg).charge({
          orderId: `TIF-TEST-${randomUUID().slice(0, 18)}`,
          amount: 10,
          description: 'TIF sandbox test',
          card: { number, exp_month: '12', exp_year: String(new Date().getUTCFullYear() + 2), cvv: '123', holder_name: 'TIF PRUEBA' },
          customer: { name: 'TIF Prueba', email: 'innovation@likegroup.io' },
          billing: { street: 'Av. Tulum 1', city: 'Tulum', state: 'Quintana Roo', country: 'MX', postal_code: '77760' },
        });
        return json(200, { ok: true, environment: 'sandbox', scenario: body.scenario || 'approved', result });
      }
      case 'resolve-card':
        return json(200, { ok: true, ...(await (await getCheckout()).resolveCard({ attemptId: body.attemptId, charged: body.charged === true, reference: body.reference })) });
      case 'confirm-transfer':
        return json(200, { ok: true, ...(await (await getCheckout()).confirmTransfer({ reference: body.reference })) });
      default:
        return json(400, { ok: false, error: 'unknown_action' });
    }
  } catch (error) {
    if (error instanceof CheckoutError) return json(error.status, { ok: false, error: error.code });
    if (error instanceof BlokkoError) return json(502, { ok: false, error: 'blokko_error', status: error.status, response: error.body });
    return json(500, { ok: false, error: error.message });
  }
}
