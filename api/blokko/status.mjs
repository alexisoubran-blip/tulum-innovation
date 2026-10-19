// GET /api/blokko/status — is Blokko configured and do our credentials work?
// Public and read-only: it reports which settings are present (never their values) and the
// payment methods Blokko offers our merchant. A successful methods call proves the API key,
// secret, signature and merchantId are right. Always 200; check "ok".

import { configFromEnv, createClient, SANDBOX_URL, BlokkoError } from '../../lib/ticketing/blokko.mjs';
import { configFromEnv as cardsConfig } from '../../lib/ticketing/blisscore.mjs';

const cardsInfo = () => {
  const c = cardsConfig();
  return { configured: c.configured, environment: c.sandbox ? 'sandbox' : 'production' };
};
const json = (body) => new Response(JSON.stringify({ ...body, cards: cardsInfo() }), {
  status: 200,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

export async function GET() {
  const config = configFromEnv();
  const configured = {
    apiKey: Boolean(config.apiKey),
    secret: Boolean(config.secret),
    merchantUuid: Boolean(config.merchantUuid),
    merchantId: process.env.BLOKKO_MERCHANT_ID ? true : (config.merchantId ? 'using_merchant_uuid' : false),
    terminal: process.env.BLOKKO_TERMINAL_UUID ? 'uuid' : (config.terminalSerial ? 'serial' : false),
  };
  const environment = config.baseUrl === SANDBOX_URL ? 'sandbox' : 'production';
  if (!configured.apiKey || !configured.secret || !config.merchantId) {
    return json({ ok: false, environment, configured, error: 'missing_credentials' });
  }
  try {
    const methods = await createClient(config).getPaymentMethods();
    return json({ ok: true, environment, configured, paymentMethods: methods });
  } catch (error) {
    if (error instanceof BlokkoError) {
      // Status and Blokko's error message only; never headers, keys or signatures.
      const message = typeof error.body === 'object' && error.body ? (error.body.message || error.body.error || null) : null;
      return json({ ok: false, environment, configured, error: 'blokko_error', status: error.status, message });
    }
    return json({ ok: false, environment, configured, error: 'request_failed' });
  }
}
