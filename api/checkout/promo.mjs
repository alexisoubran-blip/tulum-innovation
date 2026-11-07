// GET /api/checkout/promo?code=RON10&pass=general-access — checks a Speaker Challenge code.
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET(request) {
  const q = new URL(request.url).searchParams;
  return handle((checkout) => checkout.promo({ code: q.get('code'), passId: q.get('pass') || null }));
}
