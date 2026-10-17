// GET /api/checkout/options — passes on sale (USD and MXN at TIF's rate) and Blokko methods offered.
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET() {
  return handle((checkout) => checkout.options());
}
