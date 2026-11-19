-- Where each seller gets paid (/vende). Only the server (service role) reads or writes it; RLS on, no policies.
create table if not exists public.seller_payout_info (
  code            text primary key references public.promo_codes(code) on delete cascade,
  holder_name     text not null check (char_length(holder_name) between 3 and 80),
  clabe           text check (clabe is null or clabe ~ '^[0-9]{18}$'),
  abroad_details  text check (abroad_details is null or char_length(abroad_details) between 8 and 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (clabe is not null or abroad_details is not null)
);
alter table public.seller_payout_info enable row level security;
revoke all on public.seller_payout_info from anon, authenticated;
grant select, insert, update, delete on public.seller_payout_info to service_role;
