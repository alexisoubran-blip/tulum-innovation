// GET /api/challenge/leaderboard — Speaker Challenge ranking from paid orders only.
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET() {
  const res = await handle((checkout) => checkout.leaderboard());
  if (res.status === 200) res.headers.set('cache-control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
}
