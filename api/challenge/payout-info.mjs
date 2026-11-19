// POST /api/challenge/payout-info — a seller without bank details adds them once (/vende), using their email.
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.savePayoutInfo(body));
}
