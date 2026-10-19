// POST /api/checkout/pay — { token, methodId, card?, billing? } → Blokko QR, SPEI reference or card charge.
// Card data is only forwarded to TacPay (BlissCore) and never stored or logged.
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.pay({ token: body.token, methodId: body.methodId, card: body.card, billing: body.billing }));
}
