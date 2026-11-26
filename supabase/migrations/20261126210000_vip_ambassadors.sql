-- VIP Ambassador Network: a VIP activates Sales Ambassadors and earns 5% more on every paid sale
-- made by their direct ambassadors (one level, no pay for recruiting). The 5% lives in the app
-- (VIP_OVERRIDE_PCT); here we only store who is VIP and who activated whom.
alter table public.promo_codes add column if not exists vip boolean not null default false;
alter table public.promo_codes add column if not exists recruited_by text
  references public.promo_codes(code) on update cascade on delete set null;
alter table public.promo_codes drop constraint if exists promo_codes_recruited_by_not_self;
alter table public.promo_codes add constraint promo_codes_recruited_by_not_self check (recruited_by is null or recruited_by <> code);
create index if not exists promo_codes_recruited_by_idx on public.promo_codes (recruited_by) where recruited_by is not null;
