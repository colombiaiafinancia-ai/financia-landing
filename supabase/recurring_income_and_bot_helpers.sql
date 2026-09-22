alter table public.recurring_expenses
  add column if not exists direction public.txn_direction not null default 'gasto';

create or replace function public.financia_bot_upsert_category(
  p_user_id uuid,
  p_name text,
  p_direction public.txn_direction,
  p_icon_key text default null
)
returns public.categories
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_category public.categories;
  v_name text := nullif(trim(p_name), '');
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if v_name is null then
    raise exception 'p_name is required';
  end if;

  select *
    into v_category
  from public.categories
  where is_active = true
    and direction = p_direction
    and lower(name) = lower(v_name)
    and (user_id is null or user_id = p_user_id)
  order by user_id is null, name
  limit 1;

  if v_category.id is not null then
    return v_category;
  end if;

  insert into public.categories (user_id, name, direction, icon_key, is_active)
  values (p_user_id, v_name, p_direction, p_icon_key, true)
  returning * into v_category;

  return v_category;
end;
$$;

create or replace function public.financia_bot_create_recurring(
  p_user_id uuid,
  p_name text,
  p_amount numeric,
  p_category_name text,
  p_direction public.txn_direction default 'gasto',
  p_frequency text default 'monthly',
  p_next_charge_date date default current_date,
  p_merchant text default null,
  p_auto_create boolean default true,
  p_notes text default null
)
returns public.recurring_expenses
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_category public.categories;
  v_recurring public.recurring_expenses;
  v_name text := nullif(trim(p_name), '');
  v_frequency text := coalesce(nullif(trim(p_frequency), ''), 'monthly');
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if v_name is null then
    raise exception 'p_name is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be greater than zero';
  end if;

  if v_frequency not in ('weekly', 'monthly', 'yearly') then
    raise exception 'p_frequency must be weekly, monthly, or yearly';
  end if;

  v_category := public.financia_bot_upsert_category(
    p_user_id,
    coalesce(nullif(trim(p_category_name), ''), 'Otros'),
    p_direction,
    null
  );

  insert into public.recurring_expenses (
    user_id,
    name,
    amount,
    category_id,
    direction,
    merchant,
    frequency,
    billing_day,
    next_charge_date,
    starts_at,
    auto_create,
    notes
  )
  values (
    p_user_id,
    v_name,
    p_amount,
    v_category.id,
    p_direction,
    nullif(trim(coalesce(p_merchant, v_name)), ''),
    v_frequency,
    extract(day from p_next_charge_date)::integer,
    p_next_charge_date,
    p_next_charge_date,
    coalesce(p_auto_create, true),
    nullif(trim(p_notes), '')
  )
  returning * into v_recurring;

  return v_recurring;
end;
$$;

create or replace function public.financia_bot_resolve_user_id_by_phone(
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_user_id uuid;
begin
  if v_phone = '' then
    raise exception 'phone is required';
  end if;

  select user_id
    into v_user_id
  from public.user_profiles
  where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone
     or phone = p_phone
     or phone = concat('+', v_phone)
  order by updated_at desc nulls last
  limit 1;

  if v_user_id is null then
    raise exception 'No user profile found for phone %', p_phone;
  end if;

  return v_user_id;
end;
$$;

create or replace function public.financia_bot_upsert_category_by_phone(
  p_phone text,
  p_name text,
  p_direction public.txn_direction,
  p_icon_key text default null
)
returns public.categories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);
  return public.financia_bot_upsert_category(v_user_id, p_name, p_direction, p_icon_key);
end;
$$;

create or replace function public.financia_bot_create_recurring_by_phone(
  p_phone text,
  p_name text,
  p_amount numeric,
  p_category_name text,
  p_direction public.txn_direction default 'gasto',
  p_frequency text default 'monthly',
  p_next_charge_date date default current_date,
  p_merchant text default null,
  p_auto_create boolean default true,
  p_notes text default null
)
returns public.recurring_expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);
  return public.financia_bot_create_recurring(
    v_user_id,
    p_name,
    p_amount,
    p_category_name,
    p_direction,
    p_frequency,
    p_next_charge_date,
    p_merchant,
    p_auto_create,
    p_notes
  );
end;
$$;

revoke execute on function public.financia_bot_resolve_user_id_by_phone(text) from anon, authenticated, public;
revoke execute on function public.financia_bot_upsert_category_by_phone(text,text,public.txn_direction,text) from anon, authenticated, public;
revoke execute on function public.financia_bot_create_recurring_by_phone(text,text,numeric,text,public.txn_direction,text,date,text,boolean,text) from anon, authenticated, public;

grant execute on function public.financia_bot_resolve_user_id_by_phone(text) to service_role;
grant execute on function public.financia_bot_upsert_category_by_phone(text,text,public.txn_direction,text) to service_role;
grant execute on function public.financia_bot_create_recurring_by_phone(text,text,numeric,text,public.txn_direction,text,date,text,boolean,text) to service_role;

create table if not exists public.bot_pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  phone text,
  action_type text not null check (action_type in ('crear_categoria', 'crear_recurrente')),
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmada', 'cancelada', 'error')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

alter table public.bot_pending_actions enable row level security;

create index if not exists bot_pending_actions_user_status_idx
  on public.bot_pending_actions(user_id, status, created_at desc);

drop policy if exists bot_pending_actions_select_own on public.bot_pending_actions;
drop policy if exists bot_pending_actions_insert_own on public.bot_pending_actions;
drop policy if exists bot_pending_actions_update_own on public.bot_pending_actions;

create policy bot_pending_actions_select_own
  on public.bot_pending_actions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy bot_pending_actions_insert_own
  on public.bot_pending_actions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy bot_pending_actions_update_own
  on public.bot_pending_actions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.financia_bot_clear_pending_by_phone(
  p_phone text,
  p_reason text default 'new_intent'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_actions integer := 0;
  v_transactions integer := 0;
begin
  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);

  update public.bot_pending_actions
     set status = 'cancelada',
         cancelled_at = now(),
         updated_at = now(),
         result = result || jsonb_build_object('cancel_reason', p_reason)
   where user_id = v_user_id
     and status = 'pendiente';
  get diagnostics v_actions = row_count;

  update public.transactions
     set status = 'cancelada',
         updated_at = now(),
         meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('cancel_reason', p_reason)
   where user_id = v_user_id
     and status = 'pendiente';
  get diagnostics v_transactions = row_count;

  return jsonb_build_object('user_id', v_user_id, 'actions_cancelled', v_actions, 'transactions_cancelled', v_transactions);
end;
$$;

create or replace function public.financia_bot_stage_action_by_phone(
  p_phone text,
  p_action_type text,
  p_payload jsonb,
  p_clear_existing boolean default true
)
returns public.bot_pending_actions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_action public.bot_pending_actions;
begin
  if p_action_type not in ('crear_categoria', 'crear_recurrente') then
    raise exception 'Unsupported action type %', p_action_type;
  end if;

  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);

  if coalesce(p_clear_existing, true) then
    perform public.financia_bot_clear_pending_by_phone(p_phone, 'new_intent');
  end if;

  insert into public.bot_pending_actions (user_id, phone, action_type, payload, status)
  values (v_user_id, p_phone, p_action_type, coalesce(p_payload, '{}'::jsonb), 'pendiente')
  returning * into v_action;

  return v_action;
end;
$$;

create or replace function public.financia_bot_confirm_pending_by_phone(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_action public.bot_pending_actions;
  v_created_category public.categories;
  v_created_recurring public.recurring_expenses;
  v_payload jsonb;
  v_result jsonb;
begin
  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);

  select *
    into v_action
  from public.bot_pending_actions
  where user_id = v_user_id
    and status = 'pendiente'
  order by created_at desc
  limit 1
  for update skip locked;

  if v_action.id is null then
    return jsonb_build_object('ok', true, 'found', false, 'message', 'No hay acciones pendientes del bot');
  end if;

  v_payload := v_action.payload;

  if v_action.action_type = 'crear_categoria' then
    v_created_category := public.financia_bot_upsert_category(
      v_user_id,
      coalesce(v_payload->>'categoria', v_payload->>'category', v_payload->>'name'),
      coalesce(v_payload->>'direction', 'gasto')::public.txn_direction,
      nullif(v_payload->>'icon_key', '')
    );
    v_result := jsonb_build_object('ok', true, 'type', 'categoria', 'id', v_created_category.id, 'name', v_created_category.name, 'direction', v_created_category.direction);
  elsif v_action.action_type = 'crear_recurrente' then
    v_created_recurring := public.financia_bot_create_recurring(
      v_user_id,
      coalesce(v_payload->>'name', v_payload->>'merchant', v_payload->>'descripcion', v_payload->>'categoria'),
      nullif(v_payload->>'amount', '')::numeric,
      coalesce(v_payload->>'categoria', v_payload->>'category', 'Otros'),
      coalesce(v_payload->>'direction', 'gasto')::public.txn_direction,
      coalesce(v_payload->>'frequency', 'monthly'),
      coalesce(nullif(v_payload->>'next_charge_date', '')::date, current_date),
      nullif(v_payload->>'merchant', ''),
      coalesce((v_payload->>'auto_create')::boolean, true),
      nullif(v_payload->>'notes', '')
    );
    v_result := jsonb_build_object('ok', true, 'type', 'recurrente', 'id', v_created_recurring.id, 'name', v_created_recurring.name, 'direction', v_created_recurring.direction, 'amount', v_created_recurring.amount);
  end if;

  update public.bot_pending_actions
     set status = 'confirmada',
         result = v_result,
         confirmed_at = now(),
         updated_at = now()
   where id = v_action.id;

  return jsonb_build_object('ok', true, 'found', true, 'action_id', v_action.id, 'action_type', v_action.action_type, 'result', v_result);
exception when others then
  if v_action.id is not null then
    update public.bot_pending_actions
       set status = 'error', error = sqlerrm, updated_at = now()
     where id = v_action.id;
  end if;
  raise;
end;
$$;

create or replace function public.financia_bot_cancel_pending_by_phone(
  p_phone text,
  p_reason text default 'user_rejected'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_actions integer := 0;
  v_transactions integer := 0;
begin
  v_user_id := public.financia_bot_resolve_user_id_by_phone(p_phone);

  update public.bot_pending_actions
     set status = 'cancelada', cancelled_at = now(), updated_at = now(), result = result || jsonb_build_object('cancel_reason', p_reason)
   where user_id = v_user_id and status = 'pendiente';
  get diagnostics v_actions = row_count;

  update public.transactions
     set status = 'cancelada', updated_at = now(), meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('cancel_reason', p_reason)
   where user_id = v_user_id and status = 'pendiente';
  get diagnostics v_transactions = row_count;

  return jsonb_build_object('ok', true, 'actions_cancelled', v_actions, 'transactions_cancelled', v_transactions);
end;
$$;

revoke execute on function public.financia_bot_clear_pending_by_phone(text,text) from anon, authenticated, public;
revoke execute on function public.financia_bot_stage_action_by_phone(text,text,jsonb,boolean) from anon, authenticated, public;
revoke execute on function public.financia_bot_confirm_pending_by_phone(text) from anon, authenticated, public;
revoke execute on function public.financia_bot_cancel_pending_by_phone(text,text) from anon, authenticated, public;

grant execute on function public.financia_bot_clear_pending_by_phone(text,text) to service_role;
grant execute on function public.financia_bot_stage_action_by_phone(text,text,jsonb,boolean) to service_role;
grant execute on function public.financia_bot_confirm_pending_by_phone(text) to service_role;
grant execute on function public.financia_bot_cancel_pending_by_phone(text,text) to service_role;
