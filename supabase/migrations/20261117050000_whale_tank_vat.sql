-- Hidden product, sold only through its direct link (Tere, 16 Nov — Humberto / SIRTrack):
--   /checkout?pass=whale-tank-vat   USD 400 · VAT (16%) of the USD 2,500 Whale Tank package, charged in MXN
-- Stripe's USD link was rejected by Mexican cards; our checkout charges in pesos.
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('whale-tank-vat', 'Whale Tank 2026 · VAT of the package', 400.00, true, true, 125, 'whale-tank', 1, false)
on conflict (id) do update set name = excluded.name, price_usd = excluded.price_usd, on_sale = excluded.on_sale, hidden = excluded.hidden,
  category = excluded.category, max_quantity = excluded.max_quantity, issues_tickets = excluded.issues_tickets;
