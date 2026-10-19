-- Card payments (TacPay · BlissCore API) and the catalog from "01 | CHECKOUT FESTIVAL + BUSINESS PASS
-- + HOTEL" (LGM, 2026-10-19).

-- ---------------------------------------------------------------- catalog
-- Products priced in pesos (Business Pass) keep a fixed MXN price; USD is derived at the order's rate.
alter table public.passes
  add column price_mxn numeric(12, 2) check (price_mxn is null or price_mxn > 0),
  add column price_pending boolean not null default false;  -- shown as "price to be confirmed", not sold

alter table public.passes drop constraint if exists passes_category_check;
alter table public.passes add constraint passes_category_check
  check (category in ('festival', 'business', 'hotel', 'whale-tank', 'sponsorship', 'residency', 'other', 'test'));

-- Our own checkout has no Ticket Fairy fees: base prices from the LGM sheet.
update public.passes set price_usd = 1500.00 where id = 'executive-pass';
update public.passes set price_usd = 1500.00 where id = 'hotel-upgrade';
update public.passes set price_usd =  720.00 where id = 'hotel-second-guest';
-- "PENDIENTE DE CONFIRMAR (NO PUBLICAR MONTO)": listed without price and not purchasable until LGM sets it.
update public.passes set price_pending = true where id in ('general-access', 'community-access');

insert into public.passes (id, name, price_usd, price_mxn, on_sale, hidden, sort_order, category, max_quantity, issues_tickets) values
  ('business-pass', 'Business Pass · Digital Merchant', 215.68, 3990.00, true, false, 35, 'business', 1, true)
on conflict (id) do update set price_mxn = excluded.price_mxn, category = excluded.category, max_quantity = excluded.max_quantity;

-- ---------------------------------------------------------------- card attempts
-- 'unconfirmed': the card call timed out or gave no clear answer; an admin checks the BlissCore panel.
alter table public.payment_attempts drop constraint if exists payment_attempts_status_check;
alter table public.payment_attempts add constraint payment_attempts_status_check
  check (status in ('pending', 'paid', 'expired', 'failed', 'unconfirmed'));
alter table public.payment_attempts
  add column card_brand text,
  add column card_last4 text check (card_last4 is null or card_last4 ~ '^[0-9]{4}$'),
  add column authorization_code text;

create index payment_attempts_provider_created_idx on public.payment_attempts (provider, status, created_at desc);
