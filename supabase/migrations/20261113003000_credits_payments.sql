-- Paid tailorings and Paystack payments.
-- Apply after 20261113002000_profile_onboarding.sql.
-- authenticated can read only their own balance and payments.
-- Writes go through private functions, executed by service_role after Paystack verifies the charge.
-- The payments.reference is the Paystack reference. A success grant runs once.

create schema if not exists private;
grant usage on schema private to service_role;

create table public.credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  remaining integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint credit_balances_remaining_nonnegative check (remaining >= 0)
);

comment on table public.credit_balances is
  'Tailorings left for one auth user. Missing row means zero. No card data.';

create table public.payments (
  reference text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null,
  amount_minor integer not null,
  currency text not null,
  credits integer not null,
  status text not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint payments_reference_len check (char_length(reference) between 8 and 100),
  constraint payments_pack_len check (char_length(pack_id) between 1 and 40),
  constraint payments_amount_positive check (amount_minor > 0),
  constraint payments_currency_len check (char_length(currency) between 3 and 8),
  constraint payments_credits_positive check (credits > 0),
  constraint payments_status_known check (status in ('pending', 'success', 'failed'))
);

comment on table public.payments is
  'One Paystack transaction. reference is unique so a retried webhook cannot grant twice.';

create index payments_user_id_idx on public.payments (user_id);

alter table public.credit_balances enable row level security;
alter table public.payments enable row level security;

revoke all on table public.credit_balances from public, anon, authenticated;
revoke all on table public.payments from public, anon, authenticated;
grant select on table public.credit_balances to authenticated;
grant select on table public.payments to authenticated;
grant select, insert, update, delete on table public.credit_balances to service_role;
grant select, insert, update, delete on table public.payments to service_role;

create policy credit_balances_select_own
  on public.credit_balances
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy payments_select_own
  on public.payments
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.apply_successful_payment(
  p_reference text,
  p_user_id uuid,
  p_amount_minor integer,
  p_currency text,
  p_credits integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_user uuid;
  v_amount integer;
  v_currency text;
  v_credits integer;
  v_remaining integer;
begin
  select status, user_id, amount_minor, currency, credits
    into v_status, v_user, v_amount, v_currency, v_credits
  from public.payments
  where reference = p_reference
  for update;

  if not found then
    raise exception 'unknown payment';
  end if;

  if v_user is distinct from p_user_id
     or v_amount is distinct from p_amount_minor
     or upper(v_currency) is distinct from upper(p_currency)
     or v_credits is distinct from p_credits then
    raise exception 'payment does not match';
  end if;

  if v_status = 'success' then
    select remaining into v_remaining
    from public.credit_balances
    where user_id = p_user_id;
    return coalesce(v_remaining, 0);
  end if;

  if v_status <> 'pending' then
    raise exception 'payment is not pending';
  end if;

  update public.payments
    set status = 'success',
        paid_at = pg_catalog.now()
    where reference = p_reference;

  insert into public.credit_balances (user_id, remaining, updated_at)
  values (p_user_id, p_credits, pg_catalog.now())
  on conflict (user_id) do update
    set remaining = public.credit_balances.remaining + excluded.remaining,
        updated_at = pg_catalog.now()
  returning remaining into v_remaining;

  return v_remaining;
end;
$$;

create or replace function private.consume_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining integer;
begin
  update public.credit_balances
    set remaining = remaining - 1,
        updated_at = pg_catalog.now()
    where user_id = p_user_id
      and remaining >= 1
    returning remaining into v_remaining;

  if found then
    return pg_catalog.jsonb_build_object('ok', true, 'remaining', v_remaining);
  end if;

  select remaining into v_remaining
  from public.credit_balances
  where user_id = p_user_id;

  return pg_catalog.jsonb_build_object('ok', false, 'remaining', coalesce(v_remaining, 0));
end;
$$;

create or replace function private.refund_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining integer;
begin
  update public.credit_balances
    set remaining = remaining + 1,
        updated_at = pg_catalog.now()
    where user_id = p_user_id
    returning remaining into v_remaining;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'remaining', 0);
  end if;

  return pg_catalog.jsonb_build_object('ok', true, 'remaining', v_remaining);
end;
$$;

revoke all on function private.apply_successful_payment(text, uuid, integer, text, integer) from public, anon, authenticated;
revoke all on function private.consume_credit(uuid) from public, anon, authenticated;
revoke all on function private.refund_credit(uuid) from public, anon, authenticated;
grant execute on function private.apply_successful_payment(text, uuid, integer, text, integer) to service_role;
grant execute on function private.consume_credit(uuid) to service_role;
grant execute on function private.refund_credit(uuid) to service_role;

create or replace function public.apply_successful_payment(
  p_reference text,
  p_user_id uuid,
  p_amount_minor integer,
  p_currency text,
  p_credits integer
)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.apply_successful_payment(p_reference, p_user_id, p_amount_minor, p_currency, p_credits);
$$;

create or replace function public.consume_credit(p_user_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.consume_credit(p_user_id);
$$;

create or replace function public.refund_credit(p_user_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.refund_credit(p_user_id);
$$;

revoke all on function public.apply_successful_payment(text, uuid, integer, text, integer) from public, anon, authenticated;
revoke all on function public.consume_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_credit(uuid) from public, anon, authenticated;
grant execute on function public.apply_successful_payment(text, uuid, integer, text, integer) to service_role;
grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;
