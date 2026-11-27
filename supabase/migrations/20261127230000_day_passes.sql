-- Day passes (LGM, 27 Nov): one festival day chosen at checkout (Dec 9, 10, 11 or 12).
-- Fixed peso prices: MXN 1,500 general public; MXN 720 Tulum residents (community, residency checked at the door).
-- price_usd is only a reference at ~18.58; the charge is the MXN price.
insert into public.passes (id, name, price_usd, price_mxn, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('day-pass', 'Day Pass · 1 Festival Day', 80.73, 1500.00, true, false, 32, 'festival', 10, true),
  ('day-pass-community', 'Day Pass · Tulum Residents', 38.75, 720.00, true, false, 34, 'festival', 10, true)
on conflict (id) do update set name = excluded.name, price_usd = excluded.price_usd, price_mxn = excluded.price_mxn, on_sale = excluded.on_sale,
  hidden = excluded.hidden, sort_order = excluded.sort_order, category = excluded.category, max_quantity = excluded.max_quantity, issues_tickets = excluded.issues_tickets;
