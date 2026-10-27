-- Hidden products, sold only through their direct links (not listed on the site):
--   /checkout?pass=whale-tank-reservation   USD 700 Whale Tank 2026 reservation
--   /checkout?pass=voluntary-contribution   pay-what-you-want (USD 1–100,000), authorized voluntary payments
-- price_usd of the contribution is only the minimum; the buyer's amount is validated server-side.
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('whale-tank-reservation', 'Whale Tank 2026 · Reservation', 700.00, true, true, 120, 'whale-tank', 1, false),
  ('voluntary-contribution', 'Whale Tank 2026 · Voluntary contribution', 1.00, true, true, 130, 'whale-tank', 1, false)
on conflict (id) do update set price_usd = excluded.price_usd, on_sale = excluded.on_sale, hidden = excluded.hidden,
  category = excluded.category, max_quantity = excluded.max_quantity, issues_tickets = excluded.issues_tickets;
