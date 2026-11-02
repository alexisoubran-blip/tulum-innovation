-- Innovation Mezcal (special edition of TIF 2026), sold from /mezcal and the checkout.
-- Fixed peso prices: MXN 720 per bottle, MXN 4,320 per box of 6 (box includes a free T-shirt).
-- Delivered at the festival: no QR tickets, the buyer gets a pickup confirmation.
alter table public.passes drop constraint if exists passes_category_check;
alter table public.passes add constraint passes_category_check
  check (category in ('festival', 'business', 'hotel', 'whale-tank', 'sponsorship', 'residency', 'merch', 'other', 'test'));

insert into public.passes (id, name, price_usd, price_mxn, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('innovation-mezcal', 'Innovation Mezcal · Bottle', 38.75, 720.00, true, false, 200, 'merch', 10, false),
  ('innovation-mezcal-box', 'Innovation Mezcal · Box of 6 + T-shirt', 232.51, 4320.00, true, false, 210, 'merch', 5, false)
on conflict (id) do update set name = excluded.name, price_usd = excluded.price_usd, price_mxn = excluded.price_mxn, on_sale = excluded.on_sale,
  hidden = excluded.hidden, sort_order = excluded.sort_order, category = excluded.category, max_quantity = excluded.max_quantity, issues_tickets = excluded.issues_tickets;
