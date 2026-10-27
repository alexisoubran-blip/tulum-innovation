-- 2026-10-27: every product priced in USD.
-- New USD -> MXN rate: Banxico FIX of 2026-10-26 (18.5798), rounded to 18.58.
insert into public.exchange_rates (usd_mxn, note)
values (18.58, 'Banxico FIX 2026-10-26 (18.5798), set 2026-10-27');

-- Business Pass moves from a fixed MXN 3,990 to USD: 3,990 / 18.58 = 214.75 -> USD 215.
update public.passes set price_usd = 215.00, price_mxn = null where id = 'business-pass';
