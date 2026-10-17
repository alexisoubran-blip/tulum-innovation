// POST /api/checkout/order — creates a pending order; prices come from the database.
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.createOrder(body));
}
