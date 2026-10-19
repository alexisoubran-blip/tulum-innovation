-- LGM: General Access and Community Access can be bought on our checkout (SPEI, Blokko) at the prices
-- already published on /tickets (US$218 and US$109) until LGM sets new ones.
update public.passes set price_usd = 218.00, price_pending = false where id = 'general-access';
update public.passes set price_usd = 109.00, price_pending = false where id = 'community-access';
