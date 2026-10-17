// GET /api/checkout/options — passes on sale (USD and MXN at TIF's rate) and Blokko methods offered.
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET(request) {
  const includePass = new URL(request.url).searchParams.get('pass') || undefined;
  return handle((checkout) => checkout.options({ includePass }));
}
