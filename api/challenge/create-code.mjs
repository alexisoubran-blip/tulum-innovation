// POST /api/challenge/create-code — community sellers create their own 10% code (/vende).
import { handle, readJson } from '../../lib/ticketing/runtime.mjs';

export async function POST(request) {
  const body = await readJson(request);
  return handle((checkout) => checkout.createCommunityCode(body));
}
