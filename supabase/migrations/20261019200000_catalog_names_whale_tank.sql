-- Product names as in LGM's "01 | Checkout" sheet, and Whale Tank listed in the public checkout
-- (LGM asked to see it there; its conditions say it is only for selected startups).
update public.passes set name = 'General Access · 4-Day Festival Pass'    where id = 'general-access';
update public.passes set name = 'Community Access · Tulum Residents'      where id = 'community-access';
update public.passes set name = 'Executive Pass · VIP Experience'         where id = 'executive-pass';
update public.passes set name = 'Hotel Upgrade · Executive Only'          where id = 'hotel-upgrade';
update public.passes set name = 'Additional Hotel Guest'                  where id = 'hotel-second-guest';
update public.passes set hidden = false where id in ('whale-tank-founder', 'whale-tank-team-member');
