// POST /api/challenge/my-code — a seller recovers their link and sales count with their email (/vende).
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.myCode(body));
}
