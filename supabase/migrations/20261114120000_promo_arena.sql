-- Printed invitation cards for IKAL Arena activations (14/11, 30/11…): QR → /s/ARENA10, 10% off.
insert into public.promo_codes (code, speaker_name, organization, pillar, tier, session, active, sort_order, source) values
  ('ARENA10', 'IKAL Arena', 'Friends of Arena · Tulum', 'Comunidad', 'Comunidad', null, true, 900, 'print')
on conflict (code) do nothing;
