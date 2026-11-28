-- Box office pays in whole bills: round USD prices down to multiples of 100 (approved by Tere, Nov 28 2026).
-- Executive 1,500 · Hotel 1,500 · Founder 2,500 / 1,500 · Team 1,000 stay as they are. Day passes stay in MXN.
update public.passes set price_usd = 200.00 where id = 'general-access';
update public.passes set price_usd = 100.00 where id = 'community-access';
update public.passes set price_usd = 200.00, price_mxn = null where id = 'business-pass';
update public.passes set price_usd = 700.00 where id = 'hotel-second-guest';
update public.passes set price_usd = 700.00 where id = 'whale-tank-team-member-no-stay';
