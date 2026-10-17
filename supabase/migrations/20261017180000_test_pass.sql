-- Hidden passes: purchasable only through a direct link (/checkout?pass=ID), never listed.
-- Used for the production test purchase Blokko requires (they fund test wallets: Muun,
-- Tether, MetaMask). Turn the test pass off after testing: update passes set on_sale = false where id = 'tif-test';
alter table public.passes add column hidden boolean not null default false;

insert into public.passes (id, name, price_usd, on_sale, hidden, sort_order)
values ('tif-test', 'TIF Test · Internal payment test', 1.00, true, true, 999);
