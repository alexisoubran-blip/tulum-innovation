-- Hidden product, sold only through its direct link (Tere, 24 Nov — email "Checkout: Pase Executive + Traslados"):
--   /checkout?pass=whale-tank-executive-upgrade   USD 500 per person (+ 16% VAT only with CFDI)
-- For Whale Tank startups with the pass without stay and their companions: Executive area, gala (Thu 10) and group transfers.
-- Several per order (one name per person); sales close on 30 Nov 2026 (availableUntil in catalog-content.mjs).
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('whale-tank-executive-upgrade', 'Whale Tank 2026 · Executive Pass + Transfers', 500.00, true, true, 126, 'whale-tank', 10, true)
on conflict (id) do update set name = excluded.name, price_usd = excluded.price_usd, on_sale = excluded.on_sale, hidden = excluded.hidden,
  category = excluded.category, max_quantity = excluded.max_quantity, issues_tickets = excluded.issues_tickets;
