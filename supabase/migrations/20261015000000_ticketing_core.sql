-- TIF 2026 ticketing: passes, orders, tickets, payments, door access.
-- Access model: only the server (service_role, from Vercel functions) reads and writes.
-- RLS is enabled on every table with no public policies, and the Data API roles get no grants,
-- so the public anon key cannot read buyer data.

-- ---------------------------------------------------------------- enums
create type public.order_status as enum ('pending', 'paid', 'failed', 'expired', 'refunded');
create type public.ticket_status as enum ('valid', 'used', 'void');
create type public.payment_provider as enum ('blokko', 'mexipay', 'ticketfairy', 'manual');
create type public.staff_role as enum ('door', 'admin');

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- passes (catalog)
create table public.passes (
  id            text primary key,                       -- e.g. 'general-access'
  name          text not null,
  price_usd     numeric(10, 2) not null check (price_usd >= 0),
  capacity      integer check (capacity is null or capacity >= 0),
  on_sale       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger passes_updated_at before update on public.passes
  for each row execute function public.set_updated_at();

-- Prices mirror the current public USD prices (fees included). Review before selling directly.
insert into public.passes (id, name, price_usd, on_sale, sort_order) values
  ('general-access',      'General Access · 4-Day Pass',       218.00,  true,  10),
  ('executive-pass',      'Executive Pass · VIP Experience',  1590.00,  true,  20),
  ('community-access',    'Community Access · Tulum Resident', 109.00,  true,  30),
  ('hotel-upgrade',       'Hotel Upgrade · 4 nights',         1590.00,  true,  40),
  ('hotel-second-guest',  'Hotel Upgrade · Second guest',      770.40,  true,  50),
  ('night-program',       'Night Program',                       0.00,  false, 60),
  ('full-night',          'Full Night · Closing Party',          0.00,  false, 70),
  ('invisible-layer',     'Invisible Layer',                     0.00,  false, 80);

-- ---------------------------------------------------------------- resellers
create table public.resellers (
  code            text primary key check (code ~ '^[A-Za-z0-9_-]{2,40}$'),
  name            text not null,
  commission_pct  numeric(5, 2) not null default 0 check (commission_pct between 0 and 100),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  status                 public.order_status not null default 'pending',
  pass_id                text not null references public.passes (id),
  quantity               integer not null check (quantity between 1 and 20),
  unit_price_usd         numeric(10, 2) not null check (unit_price_usd >= 0),
  amount_usd             numeric(10, 2) not null check (amount_usd >= 0),
  currency               text not null default 'USD',

  buyer_name             text not null,
  buyer_email            text not null check (position('@' in buyer_email) > 1),
  buyer_phone            text,
  buyer_country          text,

  provider               public.payment_provider,
  provider_reference     text,                      -- Blokko transactionUuid / MexiPay charge id
  provider_authorization text,
  blokko_invoice_number  text unique,
  blokko_invoice_hash    text,
  blokko_invoice_url     text,

  referral_code          text references public.resellers (code),
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  utm_content            text,
  utm_term               text,
  gclid                  text,
  fbclid                 text,

  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  expires_at             timestamptz not null default (now() + interval '30 minutes'),
  paid_at                timestamptz,
  refunded_at            timestamptz
);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_buyer_email_idx on public.orders (lower(buyer_email));
create unique index orders_provider_reference_uq on public.orders (provider, provider_reference) where provider_reference is not null;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- tickets
create table public.tickets (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete restrict,
  pass_id            text not null references public.passes (id),
  holder_name        text,
  holder_email       text,
  token_hash         text not null unique,          -- sha256 of the signed QR token; the token itself is never stored
  status             public.ticket_status not null default 'valid',
  issued_at          timestamptz not null default now(),
  checked_in_at      timestamptz,
  checked_in_gate    text,
  checked_in_by      uuid,
  void_reason        text,
  updated_at         timestamptz not null default now()
);
create index tickets_order_idx on public.tickets (order_id);
create index tickets_holder_email_idx on public.tickets (lower(holder_email));
create trigger tickets_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- payment events (audit trail)
create table public.payment_events (
  id           bigint generated always as identity primary key,
  provider     public.payment_provider not null,
  reference    text,
  status       text,
  order_id     uuid references public.orders (id),
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);
create index payment_events_reference_idx on public.payment_events (provider, reference);

-- ---------------------------------------------------------------- webhook nonces (replay protection)
create table public.webhook_nonces (
  nonce        text primary key,
  provider     public.payment_provider not null,
  received_at  timestamptz not null default now()
);
create index webhook_nonces_received_idx on public.webhook_nonces (received_at);

-- ---------------------------------------------------------------- staff (door app / admin panel)
create table public.staff (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  role        public.staff_role not null default 'door',
  gates       text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- mark an order paid exactly once
-- Returns the order and whether this call changed it, so webhook retries never issue tickets twice.
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_provider public.payment_provider,
  p_reference text,
  p_authorization text default null,
  p_paid_at timestamptz default now()
)
returns table (changed boolean, order_row public.orders)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  update public.orders o
     set status = 'paid',
         provider = p_provider,
         provider_reference = coalesce(o.provider_reference, p_reference),
         provider_authorization = coalesce(p_authorization, o.provider_authorization),
         paid_at = coalesce(p_paid_at, now())
   where o.id = p_order_id
     and o.status in ('pending', 'expired', 'failed')
  returning o.* into v_order;

  if found then
    return query select true, v_order;
    return;
  end if;

  select * into v_order from public.orders o where o.id = p_order_id;
  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;
  return query select false, v_order;
end;
$$;

-- ---------------------------------------------------------------- lock down
alter table public.passes          enable row level security;
alter table public.resellers       enable row level security;
alter table public.orders          enable row level security;
alter table public.tickets         enable row level security;
alter table public.payment_events  enable row level security;
alter table public.webhook_nonces  enable row level security;
alter table public.staff           enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, public.payment_provider, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, public.payment_provider, text, text, timestamptz) to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
