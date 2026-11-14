-- Seller control panel (/admin/vendedores): per-code commission and manual payout log.
alter table public.promo_codes add column if not exists commission_pct numeric(5, 2)
  check (commission_pct is null or (commission_pct >= 0 and commission_pct <= 50));

create table if not exists public.promo_payouts (
  id          uuid primary key default gen_random_uuid(),
  code        text not null references public.promo_codes(code),
  amount_mxn  numeric(12, 2) not null check (amount_mxn > 0),
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.promo_payouts enable row level security;
create index if not exists promo_payouts_code_idx on public.promo_payouts (code);
grant select, insert, update, delete on public.promo_payouts to service_role;
