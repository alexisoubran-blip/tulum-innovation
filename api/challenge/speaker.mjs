// GET /api/challenge/speaker?code=RON10 — public data for a speaker landing (/s/RON10).
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET(request) {
  return handle((checkout) => checkout.speakerPage({ code: new URL(request.url).searchParams.get('code') }));
}
