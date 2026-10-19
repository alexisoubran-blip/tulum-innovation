-- Whale Tank packages without accommodation (LGM, 2026-10-19). Prices from the previous program terms,
-- pending LGM's final confirmation.
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('whale-tank-founder-no-stay',     'Whale Tank · Founder Without Stay',                1500.00, true, false, 105, 'whale-tank', 1, true),
  ('whale-tank-team-member-no-stay', 'Whale Tank · Additional Team Member Without Stay',  720.00, true, false, 115, 'whale-tank', 1, true)
on conflict (id) do nothing;
