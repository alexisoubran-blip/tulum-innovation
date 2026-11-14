-- Community sellers: anyone can create their own 10% code at /vende.
-- Same rules as speaker codes (server-side discount, counts only on paid orders);
-- tier 'Comunidad' keeps them out of the speaker ranking and in their own list.
alter table public.promo_codes drop constraint if exists promo_codes_tier_check;
alter table public.promo_codes add constraint promo_codes_tier_check
  check (tier in ('A', 'B', 'C', 'Panel', 'Equipo TIF', 'Comunidad'));
alter table public.promo_codes add column if not exists phone text;
alter table public.promo_codes add column if not exists source text not null default 'admin';
create index if not exists promo_codes_email_lower_idx on public.promo_codes (lower(email));
