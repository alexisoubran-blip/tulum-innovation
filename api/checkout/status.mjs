// GET /api/checkout/status?t=TOKEN — order status; confirms with Blokko and issues tickets once paid.
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('t');
  return handle((checkout) => checkout.status({ token }));
}
