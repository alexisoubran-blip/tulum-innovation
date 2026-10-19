-- Full catalog (festival, hotel, Whale Tank, sponsorships), VAT, non-ticket products,
-- bank transfer (SPEI, confirmed by an admin) and TacPay as a card provider.

-- ---------------------------------------------------------------- catalog fields
alter table public.passes
  add column category text not null default 'festival'
    check (category in ('festival', 'hotel', 'whale-tank', 'sponsorship', 'residency', 'other', 'test')),
  add column tax_rate numeric(5, 4) not null default 0 check (tax_rate between 0 and 1),
  add column max_quantity integer not null default 10 check (max_quantity between 1 and 20),
  add column issues_tickets boolean not null default true;

update public.passes set category = 'hotel' where id in ('hotel-upgrade', 'hotel-second-guest');
update public.passes set category = 'test', max_quantity = 1 where id = 'tif-test';

-- Whale Tank (published on /whale-tank): only for selected startups, sold through a direct link.
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, max_quantity) values
  ('whale-tank-founder',     'Whale Tank · Founder Full Experience', 2500.00, true, true, 100, 'whale-tank', 1),
  ('whale-tank-team-member', 'Whale Tank · Additional team member',  1000.00, true, true, 110, 'whale-tank', 5);

-- Sponsorships (published on /sponsorship): USD + 16% VAT, one per order, no festival tickets
-- issued automatically (the partnership team coordinates the passes and benefits).
insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order, category, tax_rate, max_quantity, issues_tickets) values
  ('sponsor-event-supporter',    'Sponsorship · Event Supporter',     2500.00, true, false, 200, 'sponsorship', 0.16, 1, false),
  ('sponsor-touchpoint-partner', 'Sponsorship · Touchpoint Partner',  5000.00, true, false, 210, 'sponsorship', 0.16, 1, false),
  ('sponsor-ecosystem-partner',  'Sponsorship · Ecosystem Partner',  10000.00, true, false, 220, 'sponsorship', 0.16, 1, false),
  ('sponsor-experience-partner', 'Sponsorship · Experience Partner', 15000.00, true, false, 230, 'sponsorship', 0.16, 1, false),
  ('sponsor-strategic-partner',  'Sponsorship · Strategic Partner',  30000.00, true, false, 240, 'sponsorship', 0.16, 1, false);

-- ---------------------------------------------------------------- orders: VAT and bank transfer
alter table public.orders
  add column tax_usd numeric(10, 2) not null default 0 check (tax_usd >= 0),
  add column payment_method text,
  add column transfer_reference text unique;

-- ---------------------------------------------------------------- attempts: why a provider call failed
alter table public.payment_attempts
  add column error_code text,
  add column error_detail text;

-- ---------------------------------------------------------------- card payments
alter type public.payment_provider add value if not exists 'tacpay';
