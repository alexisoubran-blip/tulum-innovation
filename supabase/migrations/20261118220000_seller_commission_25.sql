-- Seller commission raised to 25% (team call, Nov 18, 2026): everyone in the network earns the same.
-- Partner codes with their own agreement (ARENA10, MYHIT10) keep their current rate.
update public.promo_codes
   set commission_pct = 25
 where code not in ('ARENA10', 'MYHIT10')
   and (commission_pct is null or commission_pct = 10);
