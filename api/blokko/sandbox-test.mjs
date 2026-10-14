// GET /api/blokko/sandbox-test — admin-only connectivity check against the Blokko sandbox.
// Creates a USD/merchant-currency 1.00 invoice and returns Blokko's response, so the
// signature, credentials and merchant setup can be validated from Vercel.
// Requires: Authorization: Bearer {TICKETING_ADMIN_TOKEN}. Refuses to run against production.

import { createClient, configFromEnv, SANDBOX_URL, BlokkoError } from '../../lib/ticketing/blokko.mjs';

const json = (status, body) => new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json' } });

export async function GET(request) {
  const token = process.env.TICKETING_ADMIN_TOKEN;
  if (!token || request.headers.get('authorization') !== `Bearer ${token}`) return json(401, { ok: false, error: 'unauthorized' });

  const config = configFromEnv();
  if (config.baseUrl !== SANDBOX_URL) return json(400, { ok: false, error: 'sandbox_only', baseUrl: config.baseUrl });

  const origin = new URL(request.url).origin;
  try {
    const invoice = await createClient(config).createInvoice({ amount: 1, successUrl: `${origin}/tickets?blokko=test` });
    return json(200, { ok: true, signature: { encoding: config.encoding, timestampUnit: config.timestampUnit }, invoice });
  } catch (error) {
    if (error instanceof BlokkoError) return json(502, { ok: false, status: error.status, response: error.body, hint: 'If this is 401/403, try BLOKKO_SIGNATURE_ENCODING=base64 or BLOKKO_TIMESTAMP_UNIT=ms' });
    return json(500, { ok: false, error: error.message });
  }
}
