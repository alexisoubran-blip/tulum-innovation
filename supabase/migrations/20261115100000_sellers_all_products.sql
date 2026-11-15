-- Sellers: 10% commission by default for community codes (Tere, 14/11), and MYHIT10 for Laura Miller (My Home in Tulum),
-- who already shared that code in her groups.
update public.promo_codes set commission_pct = 10 where tier = 'Comunidad' and commission_pct is null;
insert into public.promo_codes (code, speaker_name, organization, pillar, tier, active, sort_order, source, commission_pct) values
  ('MYHIT10', 'Laura Miller', 'MYHIT · My Home in Tulum', 'Comunidad', 'Comunidad', true, 1000, 'admin', 10)
on conflict (code) do nothing;
