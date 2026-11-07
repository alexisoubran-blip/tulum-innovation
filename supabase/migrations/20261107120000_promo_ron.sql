-- Speaker Challenge: Ron Oliver (Whale Tank) joins with RON10.
insert into public.promo_codes (code, speaker_name, organization, pillar, tier, photo_url, session, active, sort_order) values
  ('RON10', 'Ron Oliver', 'ParqueTec México · Whale Tank', 'Whale Tank / Inversión', 'Equipo TIF', '/assets/investors/ron-oliver.webp', 'Whale Tank', true, 63)
on conflict (code) do nothing;
