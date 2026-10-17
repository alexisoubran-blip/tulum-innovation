-- Checkout: initial exchange rate, idempotent ticket issuance and email tracking.

-- Initial USD → MXN rate set by TIF on 2026-10-17 (Banxico FIX 18.25 on 2026-10-12 plus a
-- buffer for FX moves through December). Change it by inserting a new row.
insert into public.exchange_rates (usd_mxn, note)
values (18.50, 'Initial rate 2026-10-17: Banxico FIX 18.25 + ~1.4% buffer');

-- One ticket per unit of the order: (order_id, seq) is unique, so issuing twice (webhook and
-- status check racing) inserts nothing new. The QR token is derived from the ticket id with a
-- server secret, so it never needs to be stored and an email can always be re-sent.
alter table public.tickets add column seq smallint;
update public.tickets t set seq = sub.rn
  from (select id, row_number() over (partition by order_id order by issued_at, id) as rn from public.tickets) sub
 where sub.id = t.id;
alter table public.tickets alter column seq set not null;
alter table public.tickets add constraint tickets_order_seq_uq unique (order_id, seq);
alter table public.tickets add constraint tickets_seq_positive check (seq between 1 and 20);

-- Email delivery of the tickets: claimed by setting this timestamp, cleared if sending fails.
alter table public.orders
  add column tickets_emailed_at timestamptz,
  add column locale text not null default 'es' check (locale in ('es', 'en'));
