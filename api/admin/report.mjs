// GET /api/admin/report?key=… — read-only sales report in plain JSON, made to be pasted into (or fetched by) an
// AI assistant like Claude. Accepts the view token (TICKETING_VIEW_TOKEN) or the admin token, by ?key= or Bearer.
// Never returns emails, phones, card data or tax data: only first name + last initial per buyer.
import { getCheckout } from '../../lib/ticketing/runtime.mjs';
import { adminRole } from '../../lib/ticketing/admin-auth.mjs';

const json = (status, body) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' },
});
const r2 = (n) => Math.round(n * 100) / 100;
const shortName = (n) => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return p.length ? `${p[0]}${p[1] ? ` ${p[1][0]}.` : ''}` : '—'; };
const dayMx = (iso) => new Date(Date.parse(iso) - 6 * 3600e3).toISOString().slice(0, 10);   // America/Mexico_City (UTC-6)

export async function GET(request) {
  const auth = adminRole(request, { allowQuery: true });
  if (auth.error) return json(401, { ok: false, error: 'unauthorized', reason: auth.error });
  const checkout = await getCheckout();
  const [sales, sellers] = await Promise.all([checkout.adminSales({}), checkout.adminSellers()]);
  const paid = sales.filter((o) => o.status === 'paid');

  const byProduct = new Map();
  const byDay = new Map();
  const byMethod = new Map();
  let revenue = 0, tickets = 0, discount = 0;
  for (const o of paid) {
    const mx = Number(o.amountMxn) || 0;
    revenue += mx; discount += Number(o.discountMxn) || 0;
    const p = byProduct.get(o.passName) || { product: o.passName, orders: 0, units: 0, revenueMxn: 0 };
    p.orders += 1; p.units += Number(o.quantity) || 0; p.revenueMxn = r2(p.revenueMxn + mx); byProduct.set(o.passName, p);
    if (['general-access', 'executive-pass', 'community-access'].includes(o.passId)) tickets += Number(o.quantity) || 0;
    const d = dayMx(o.paidAt || o.createdAt);
    const dd = byDay.get(d) || { day: d, orders: 0, revenueMxn: 0 }; dd.orders += 1; dd.revenueMxn = r2(dd.revenueMxn + mx); byDay.set(d, dd);
    const m = byMethod.get(o.channel) || { method: o.channel, orders: 0, revenueMxn: 0 }; m.orders += 1; m.revenueMxn = r2(m.revenueMxn + mx); byMethod.set(o.channel, m);
  }
  const days = [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));

  return json(200, {
    ok: true,
    note: 'Tulum Innovation Fest 2026 · read-only sales report. Amounts in MXN, only PAID orders unless stated. Buyer names are shortened; no contact or payment data is included.',
    generatedAt: new Date().toISOString(),
    totals: { paidOrders: paid.length, festivalTickets: tickets, revenueMxn: r2(revenue), discountsGivenMxn: r2(discount), pendingOrders: sales.filter((o) => o.status === 'pending').length },
    byProduct: [...byProduct.values()].sort((a, b) => b.revenueMxn - a.revenueMxn),
    byPaymentMethod: [...byMethod.values()].sort((a, b) => b.revenueMxn - a.revenueMxn),
    last14Days: days.slice(0, 14),
    sellers: (sellers.sellers || []).filter((s) => s.orders > 0).map((s) => ({ code: s.code, name: s.name, orders: s.orders, tickets: s.tickets, revenueMxn: s.revenueMxn, commissionPct: s.commissionPct, earnedMxn: s.earnedMxn, paidOutMxn: s.paidMxn, pendingMxn: s.pendingMxn }))
      .sort((a, b) => b.revenueMxn - a.revenueMxn),
    recentPaidOrders: paid.sort((a, b) => ((a.paidAt || '') < (b.paidAt || '') ? 1 : -1)).slice(0, 40).map((o) => ({
      paidAt: o.paidAt, product: o.passName, quantity: o.quantity, amountMxn: o.amountMxn, method: o.channel, sellerCode: o.promoCode, buyer: shortName(o.buyerName), country: o.country || null,
    })),
  });
}
