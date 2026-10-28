-- Business Pass: USD 222 (charged in MXN at the current rate, like every pass).
update public.passes set price_usd = 222.00, price_mxn = null where id = 'business-pass';
