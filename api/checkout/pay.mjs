// POST /api/checkout/pay — { token, methodId } → Blokko payment intent (QR) for the order.
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.pay({ token: body.token, methodId: body.methodId }));
}
