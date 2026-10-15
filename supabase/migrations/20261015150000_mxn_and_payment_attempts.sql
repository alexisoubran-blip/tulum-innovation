-- Blokko charges TIF in MXN (merchant currency set at onboarding) while prices are published in USD.
-- TIF sets the USD → MXN rate itself: each change is a new row in exchange_rates (history kept),
-- and every order stores the rate and MXN amount it was charged with.
-- Payments use Blokko payment intents: one attempt per QR shown (the QR expires in ~3 minutes),
-- so an order can have several attempts; attempt.id is the merchantTransactionId sent to Blokko.

-- ---------------------------------------------------------------- exchange rates
create table public.exchange_rates (
  id              bigint generated always as identity primary key,
  usd_mxn         numeric(10, 4) not null check (usd_mxn > 0),
  effective_from  timestamptz not null default now(),
  note            text,
  created_at      timestamptz not null default now()
);
create index exchange_rates_effective_idx on public.exchange_rates (effective_from desc);

-- Current rate: the latest row already in effect; null if TIF has not set one yet.
create or replace function public.current_usd_mxn()
returns numeric
language sql
stable
set search_path = ''
as $$
  select r.usd_mxn
    from public.exchange_rates r
   where r.effective_from <= now()
   order by r.effective_from desc, r.id desc
   limit 1;
$$;

-- ---------------------------------------------------------------- orders: amount actually charged
alter table public.orders
  add column amount_mxn   numeric(12, 2) check (amount_mxn is null or amount_mxn > 0),
  add column fx_usd_mxn   numeric(10, 4) check (fx_usd_mxn is null or fx_usd_mxn > 0);

-- ---------------------------------------------------------------- payment attempts (one per QR)
create table public.payment_attempts (
  id                       uuid primary key default gen_random_uuid(),   -- merchantTransactionId
  order_id                 uuid not null references public.orders (id) on delete restrict,
  provider                 public.payment_provider not null default 'blokko',
  payment_method_id        text,
  amount_mxn               numeric(12, 2) not null check (amount_mxn > 0),
  status                   text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'failed')),
  provider_transaction_id  text,                                          -- Blokko transactionId
  qr_url                   text,
  qr_content               text,
  expires_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index payment_attempts_order_idx on public.payment_attempts (order_id, created_at desc);
create unique index payment_attempts_provider_tx_uq on public.payment_attempts (provider, provider_transaction_id) where provider_transaction_id is not null;
create trigger payment_attempts_updated_at before update on public.payment_attempts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- lock down (server only)
alter table public.exchange_rates   enable row level security;
alter table public.payment_attempts enable row level security;

revoke all on public.exchange_rates, public.payment_attempts from anon, authenticated;
revoke execute on function public.current_usd_mxn() from public, anon, authenticated;
grant select, insert, update, delete on public.exchange_rates, public.payment_attempts to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.current_usd_mxn() to service_role;
