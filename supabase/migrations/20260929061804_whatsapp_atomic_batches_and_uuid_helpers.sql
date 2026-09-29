-- One message's writes finish atomically before a confirmation summary is sent.
create function public.whatsapp_batch(p_event_key text,p_kind text,p_items jsonb default '[]')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.whatsapp_events; r jsonb; item jsonb; i integer:=0; k text;
begin
  select * into e from public.whatsapp_events where event_key=p_event_key;
  if e.user_id is null then raise exception 'unlinked_event' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||e.user_id::text,0));
  -- Revalidate association and access even for an already recorded batch.
  perform public.whatsapp_operation(p_event_key,'interpretation',100,'{}');
  k:=p_event_key||':batch:'||p_kind;
  select result into r from public.whatsapp_operations where operation_key=k;
  if found then return r; end if;
  if p_kind='stage' then
    if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>100 then raise exception 'invalid_items'; end if;
    for item in select value from jsonb_array_elements(p_items) loop
      if item->>'tipo' in ('ingreso','gasto','presupuesto') then
        perform public.whatsapp_operation(p_event_key,case when item->>'tipo'='presupuesto' then 'budget' else 'transaction' end,i,item);
      end if;
      i:=i+1;
    end loop;
    r:=p_items;
  elsif p_kind='confirm_all' then
    r:=jsonb_build_object('ingreso',public.whatsapp_operation(p_event_key,'confirm_ingreso',0,'{}'),
      'gasto',public.whatsapp_operation(p_event_key,'confirm_gasto',0,'{}'));
  else raise exception 'invalid_batch'; end if;
  insert into public.whatsapp_operations(operation_key,user_id,event_key,kind,payload,result)
    values(k,e.user_id,p_event_key,p_kind,p_items,r);
  return r;
end $$;
revoke all on function public.whatsapp_batch(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.whatsapp_batch(text,text,jsonb) to service_role;

-- Persist delivery receipts even when Meta's callback races the send response.
create table public.whatsapp_delivery_receipts (
  business_id text not null, message_id text not null, status text not null check(status in ('delivered','read','failed')),
  received_at timestamptz not null default now(), primary key(business_id,message_id,status)
);
alter table public.whatsapp_delivery_receipts enable row level security;
revoke all on public.whatsapp_delivery_receipts from public,anon,authenticated;
grant select,insert,update,delete on public.whatsapp_delivery_receipts to service_role;
create function public.whatsapp_reconcile_delivery(p_business_id text,p_message_id text,p_status text default null)
returns text language plpgsql security invoker set search_path='' as $$
declare o public.whatsapp_outbox; s text;
begin
  perform pg_advisory_xact_lock(hashtextextended('wa-receipt:'||p_business_id||':'||p_message_id,0));
  if p_status is not null then
    insert into public.whatsapp_delivery_receipts(business_id,message_id,status) values(p_business_id,p_message_id,p_status) on conflict do nothing;
  end if;
  select * into o from public.whatsapp_outbox where business_id=p_business_id and meta_message_id=p_message_id for update;
  if not found then return 'pending'; end if;
  select status into s from public.whatsapp_delivery_receipts where business_id=p_business_id and message_id=p_message_id
    order by case status when 'read' then 3 when 'delivered' then 2 else 1 end desc limit 1;
  if s is null then return o.status; end if;
  if o.status='read' or (o.status='delivered' and s<>'read') then s:=o.status; end if;
  update public.whatsapp_outbox set status=s,updated_at=now() where send_key=o.send_key;
  if o.event_key is null and o.user_id is not null then
    update public.reminder_logs set status=s where user_id=o.user_id and date=split_part(o.send_key,':',3)::date;
  end if;
  return s;
end $$;
revoke all on function public.whatsapp_reconcile_delivery(text,text,text) from public,anon,authenticated;
grant execute on function public.whatsapp_reconcile_delivery(text,text,text) to service_role;

-- UUID helpers preserve legacy signatures and semantics. Backend service only.
create or replace function public.financia_bot_clear_pending_by_user_id(
  p_user_id uuid,
  p_reason text default 'new_intent'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actions integer := 0;
  v_transactions integer := 0;
begin
  v_user_id := p_user_id;
  if not exists(select 1 from public.user_profiles where user_id=v_user_id) then raise exception 'unknown_user'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||v_user_id::text,0));

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
revoke all on function public.financia_bot_clear_pending_by_user_id(uuid,text) from public,anon,authenticated;
grant execute on function public.financia_bot_clear_pending_by_user_id(uuid,text) to service_role;

create or replace function public.financia_bot_stage_action_by_user_id(
  p_user_id uuid,
  p_action_type text,
  p_payload jsonb,
  p_clear_existing boolean default true
)
returns public.bot_pending_actions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_action public.bot_pending_actions;
begin
  if p_action_type not in ('crear_categoria', 'crear_recurrente') then
    raise exception 'Unsupported action type %', p_action_type;
  end if;

  v_user_id := p_user_id;
  if not exists(select 1 from public.user_profiles where user_id=v_user_id) then raise exception 'unknown_user'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||v_user_id::text,0));

  if coalesce(p_clear_existing, true) then
    perform public.financia_bot_clear_pending_by_user_id(p_user_id, 'new_intent');
  end if;

  insert into public.bot_pending_actions (user_id, phone, action_type, payload, status)
  values (v_user_id, (select whatsapp_phone from public.user_profiles where user_id=v_user_id), p_action_type, coalesce(p_payload, '{}'::jsonb), 'pendiente')
  returning * into v_action;

  return v_action;
end;
$$;
revoke all on function public.financia_bot_stage_action_by_user_id(uuid,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.financia_bot_stage_action_by_user_id(uuid,text,jsonb,boolean) to service_role;

create or replace function public.financia_bot_confirm_pending_by_user_id(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_action public.bot_pending_actions;
  v_created_category public.categories;
  v_created_recurring public.recurring_expenses;
  v_payload jsonb;
  v_result jsonb;
begin
  v_user_id := p_user_id;
  if not exists(select 1 from public.user_profiles where user_id=v_user_id) then raise exception 'unknown_user'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||v_user_id::text,0));

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
revoke all on function public.financia_bot_confirm_pending_by_user_id(uuid) from public,anon,authenticated;
grant execute on function public.financia_bot_confirm_pending_by_user_id(uuid) to service_role;

create or replace function public.financia_bot_cancel_pending_by_user_id(
  p_user_id uuid,
  p_reason text default 'user_rejected'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actions integer := 0;
  v_transactions integer := 0;
begin
  v_user_id := p_user_id;
  if not exists(select 1 from public.user_profiles where user_id=v_user_id) then raise exception 'unknown_user'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||v_user_id::text,0));

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
revoke all on function public.financia_bot_cancel_pending_by_user_id(uuid,text) from public,anon,authenticated;
grant execute on function public.financia_bot_cancel_pending_by_user_id(uuid,text) to service_role;
