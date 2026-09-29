-- Additive migration. Financial/account keys and historical phone data are untouched.
alter table public.user_profiles
  add column whatsapp_user_id text,
  add column whatsapp_phone text,
  add column whatsapp_username text,
  add column whatsapp_has_username boolean,
  add column whatsapp_username_observed text,
  add column whatsapp_business_id text,
  add column whatsapp_verified_at timestamptz,
  add column whatsapp_link_version integer not null default 0;
create unique index user_profiles_whatsapp_bsuid_key
  on public.user_profiles(whatsapp_business_id,whatsapp_user_id) where whatsapp_user_id is not null;
create unique index user_profiles_whatsapp_phone_key
  on public.user_profiles(whatsapp_business_id,whatsapp_phone) where whatsapp_phone is not null;

create table public.whatsapp_link_codes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  code_hash text not null unique, created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '10 minutes',
  consumed_at timestamptz, invalidated_at timestamptz, result text
);
create index whatsapp_link_codes_user_created on public.whatsapp_link_codes(user_id,created_at desc);
create table public.whatsapp_events (
  event_key text primary key, business_id text not null, phone_number_id text not null,
  message_id text not null, user_id uuid references auth.users(id),
  event jsonb not null, result jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(business_id,phone_number_id,message_id)
);
create index whatsapp_events_user on public.whatsapp_events(user_id);
create table public.whatsapp_operations (
  operation_key text primary key, user_id uuid not null references auth.users(id),
  event_key text not null references public.whatsapp_events(event_key),
  kind text not null, payload jsonb not null, result jsonb not null,
  created_at timestamptz not null default now()
);
create index whatsapp_operations_user on public.whatsapp_operations(user_id);
create index whatsapp_operations_event on public.whatsapp_operations(event_key);
create table public.whatsapp_outbox (
  send_key text primary key, user_id uuid references auth.users(id), event_key text references public.whatsapp_events(event_key),
  business_id text not null, phone_number_id text not null, link_version integer,
  payload jsonb not null, status text not null default 'queued'
    check(status in ('queued','sending','retryable','accepted','delivered','read','failed','unknown','cancelled')),
  attempts integer not null default 0, next_attempt_at timestamptz,
  meta_message_id text unique, last_error text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index whatsapp_outbox_user on public.whatsapp_outbox(user_id);
create index whatsapp_outbox_event on public.whatsapp_outbox(event_key);
create index whatsapp_outbox_retry on public.whatsapp_outbox(next_attempt_at) where status='retryable';
create table public.whatsapp_nonces (nonce text primary key, created_at timestamptz not null default now());
create table public.whatsapp_notices (sender_key text primary key,last_sent_at timestamptz not null);

do $$ declare t text; begin
  foreach t in array array['whatsapp_link_codes','whatsapp_events','whatsapp_operations','whatsapp_outbox','whatsapp_nonces','whatsapp_notices'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to service_role',t);
  end loop;
end $$;

-- Deliberately no browser grants on the new identity columns; profile API validates declarations.
create function public.whatsapp_start_link(p_user_id uuid,p_code_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.user_profiles; c public.whatsapp_link_codes; begin
  select * into p from public.user_profiles where user_id=p_user_id for update;
  if p.user_id is null or p.whatsapp_has_username is null then raise exception 'profile_choice_required'; end if;
  if p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_hash'; end if;
  if (select count(*) from public.whatsapp_link_codes where user_id=p_user_id and created_at>now()-interval '15 minutes')>=5
    then raise exception 'rate_limited'; end if;
  update public.whatsapp_link_codes set invalidated_at=now() where user_id=p_user_id and consumed_at is null and invalidated_at is null;
  insert into public.whatsapp_link_codes(user_id,code_hash) values(p_user_id,p_code_hash) returning * into c;
  return jsonb_build_object('expiresAt',c.expires_at);
end $$;

create function public.whatsapp_resolve(p_business_id text,p_event jsonb,p_code_hash text default null,p_maintenance boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  k text; b text:=nullif(p_event->>'whatsapp_user_id',''); ph text:=nullif(p_event->>'phone','');
  p public.user_profiles; by_b uuid; by_p uuid; c public.whatsapp_link_codes;
  r jsonb; prior jsonb; sender text; notify boolean:=false;
begin
  if p_business_id is null or nullif(p_event->>'message_id','') is null or nullif(p_event->>'business_phone_number_id','') is null
    or (b is null and ph is null) then return jsonb_build_object('status','invalid_event'); end if;
  if (b is not null and b !~ '^[A-Z]{2}\.(ENT\.)?[A-Za-z0-9]{1,128}$') or (ph is not null and ph !~ '^[1-9][0-9]{6,14}$') then
    return jsonb_build_object('status','invalid_event'); end if;
  k:=p_business_id||':'||(p_event->>'business_phone_number_id')||':'||(p_event->>'message_id');
  -- Serializes competing associations, including a code used from two different senders.
  perform pg_advisory_xact_lock(hashtextextended('wa-identity:'||p_business_id,0));
  select result into prior from public.whatsapp_events where event_key=k;
  if found then return prior||jsonb_build_object('duplicate',true); end if;
  select user_id into by_b from public.user_profiles where whatsapp_business_id=p_business_id and whatsapp_user_id=b and whatsapp_verified_at is not null;
  select user_id into by_p from public.user_profiles where whatsapp_business_id=p_business_id and whatsapp_phone=ph and whatsapp_verified_at is not null;
  if p_maintenance then
    r:=jsonb_build_object('status','maintenance','reply',true);
  elsif by_b is not null and by_p is not null and by_b<>by_p then
    r:=jsonb_build_object('status','conflict','reply',true);
  elsif p_code_hash is not null then
    select * into c from public.whatsapp_link_codes where code_hash=p_code_hash for update;
    if c.id is null or c.consumed_at is not null or c.invalidated_at is not null or c.expires_at<=now() then
      r:=jsonb_build_object('status','link_required','reason','invalid_code','reply',true);
    elsif (by_b is not null and by_b<>c.user_id) or (by_p is not null and by_p<>c.user_id) then
      update public.whatsapp_link_codes set result='conflict' where id=c.id;
      r:=jsonb_build_object('status','conflict','reply',true);
    else
      select * into p from public.user_profiles where user_id=c.user_id for update;
      update public.user_profiles set whatsapp_user_id=b,whatsapp_phone=ph,
        whatsapp_business_id=p_business_id,whatsapp_username_observed=nullif(p_event->>'whatsapp_username',''),
        whatsapp_verified_at=now(),whatsapp_link_version=whatsapp_link_version+1
        where user_id=c.user_id returning * into p;
      update public.whatsapp_link_codes set consumed_at=now(),result='linked' where id=c.id;
      r:=jsonb_build_object('status','linked','linked_now',true,'reply',true,'user_id',p.user_id,'link_version',p.whatsapp_link_version);
    end if;
  elsif coalesce(by_b,by_p) is not null then
    select * into p from public.user_profiles where user_id=coalesce(by_b,by_p) for update;
    if (b is not null and p.whatsapp_user_id is not null and b<>p.whatsapp_user_id)
      or (ph is not null and p.whatsapp_phone is not null and ph<>p.whatsapp_phone) then
      r:=jsonb_build_object('status','conflict','reply',true);
    else
      update public.user_profiles set whatsapp_user_id=coalesce(whatsapp_user_id,b),whatsapp_phone=coalesce(whatsapp_phone,ph),
        whatsapp_username_observed=coalesce(nullif(p_event->>'whatsapp_username',''),whatsapp_username_observed)
        where user_id=p.user_id;
      r:=jsonb_build_object('status','linked','user_id',p.user_id,'link_version',p.whatsapp_link_version);
    end if;
  else
    sender:=p_business_id||':'||coalesce(b,ph);
    insert into public.whatsapp_notices(sender_key,last_sent_at) values(sender,now()) on conflict(sender_key) do update
      set last_sent_at=excluded.last_sent_at where public.whatsapp_notices.last_sent_at<now()-interval '15 minutes'
      returning true into notify;
    r:=jsonb_build_object('status','link_required','reply',coalesce(notify,false));
  end if;
  if r->>'status'='linked' then
    r:=r||jsonb_build_object('can_operate',private.has_platform_access((r->>'user_id')::uuid));
  end if;
  r:=r||jsonb_build_object('event_key',k);
  -- A link code is a credential: never persist its clear-text in the event ledger.
  insert into public.whatsapp_events(event_key,business_id,phone_number_id,message_id,user_id,event,result)
    values(k,p_business_id,p_event->>'business_phone_number_id',p_event->>'message_id',(r->>'user_id')::uuid,
      case when p_code_hash is not null then p_event||'{"message":"[link code redacted]"}'::jsonb else p_event end,r);
  return r;
end $$;

create function public.whatsapp_operation(p_event_key text,p_kind text,p_index integer,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.whatsapp_events; p public.user_profiles; k text; r jsonb; cat uuid; tr public.transactions;
begin
  select * into e from public.whatsapp_events where event_key=p_event_key;
  if e.user_id is null or e.result->>'status'<>'linked' or coalesce((e.result->>'linked_now')::boolean,false)
    then raise exception 'unlinked_event' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-user:'||e.user_id::text,0));
  select * into p from public.user_profiles where user_id=e.user_id for update;
  if p.whatsapp_verified_at is null or p.whatsapp_link_version<>(e.result->>'link_version')::integer
    or not private.has_platform_access(p.user_id) then raise exception 'access_denied' using errcode='42501'; end if;
  if p_index<0 or p_index>100 then raise exception 'invalid_item_index'; end if;
  k:=p_event_key||':'||p_kind||':'||p_index;
  select result into r from public.whatsapp_operations where operation_key=k;
  if found then return r; end if;
  if p_kind='interpretation' then
    r:=p_payload;
  elsif p_kind in ('transaction','budget') then
    cat:=(p_payload->>'category_id')::uuid;
    if not exists(select 1 from public.categories where id=cat and (user_id is null or user_id=p.user_id)) then
      raise exception 'invalid_category' using errcode='42501'; end if;
    if coalesce((p_payload->>'valor')::numeric,0)<=0 then raise exception 'invalid_amount'; end if;
    if p_kind='transaction' then
      if p_payload->>'tipo' not in ('ingreso','gasto') then raise exception 'invalid_direction'; end if;
      insert into public.transactions(user_id,direction,amount,category_id,description,status,meta)
        values(p.user_id,(p_payload->>'tipo')::public.txn_direction,(p_payload->>'valor')::numeric,cat,
          p_payload->>'descripcion','pendiente',jsonb_build_object('whatsapp_event_key',p_event_key,'item_index',p_index)) returning * into tr;
      r:=to_jsonb(tr);
    else
      insert into public.category_budgets(user_id,category_id,amount) values(p.user_id,cat,(p_payload->>'valor')::numeric)
        on conflict(user_id,category_id) do update set amount=excluded.amount,updated_at=now();
      select to_jsonb(x) into r from public.category_budgets x where user_id=p.user_id and category_id=cat;
    end if;
  elsif p_kind in ('confirm_ingreso','confirm_gasto') then
    with changed as (update public.transactions set status='confirmada' where user_id=p.user_id and status='pendiente'
      and direction::text=case when p_kind='confirm_ingreso' then 'ingreso' else 'gasto' end returning *)
    select coalesce(jsonb_agg(to_jsonb(changed)),'[]'::jsonb) into r from changed;
  elsif p_kind='cancel' then
    with removed as (delete from public.transactions where user_id=p.user_id and status='pendiente' returning id)
    select jsonb_build_object('cancelled',count(*)) into r from removed;
  else raise exception 'invalid_operation'; end if;
  insert into public.whatsapp_operations(operation_key,user_id,event_key,kind,payload,result) values(k,p.user_id,p_event_key,p_kind,p_payload,r);
  return r;
end $$;

create function public.whatsapp_claim_send(p_key text,p_event_key text,p_user_id uuid,p_business_id text,p_phone_number_id text,p_version integer,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.whatsapp_outbox; p public.user_profiles; begin
  perform pg_advisory_xact_lock(hashtextextended('wa-send:'||p_key,0));
  if p_user_id is not null then
    select * into p from public.user_profiles where user_id=p_user_id for update;
    if p.whatsapp_verified_at is null or p.whatsapp_link_version<>p_version then return '{"claimed":false,"status":"cancelled"}'; end if;
    if p_event_key is null and (not p.reminder_opt_in or not private.has_platform_access(p.user_id)) then
      return '{"claimed":false,"status":"cancelled"}'; end if;
  end if;
  insert into public.whatsapp_outbox(send_key,event_key,user_id,business_id,phone_number_id,link_version,payload)
    values(p_key,p_event_key,p_user_id,p_business_id,p_phone_number_id,p_version,p_payload) on conflict do nothing;
  select * into o from public.whatsapp_outbox where send_key=p_key for update;
  if o.payload<>p_payload or o.user_id is distinct from p_user_id or o.link_version is distinct from p_version then
    return '{"claimed":false,"status":"conflict"}'; end if;
  if o.status not in ('queued','retryable') or o.attempts>=3 or o.next_attempt_at>now() then
    return jsonb_build_object('claimed',false,'status',o.status,'meta_message_id',o.meta_message_id); end if;
  update public.whatsapp_outbox set status='sending',attempts=attempts+1,updated_at=now() where send_key=p_key returning * into o;
  return jsonb_build_object('claimed',true,'attempt',o.attempts);
end $$;

-- Preserve own UUID, trial initialization and metadata declarations, never identity claims.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.user_profiles(user_id,email,name,phone,subscription_status,current_plan,trial_ends_at,
    whatsapp_username,whatsapp_has_username)
  values(new.id,new.email,new.raw_user_meta_data->>'full_name',
    regexp_replace(new.raw_user_meta_data->>'phone','^\+',''),'trial','free',now()+interval '30 days',
    case when new.raw_user_meta_data->>'whatsapp_has_username'='true' then nullif(new.raw_user_meta_data->>'whatsapp_username','') end,
    case new.raw_user_meta_data->>'whatsapp_has_username' when 'true' then true when 'false' then false else null end)
  on conflict(user_id) do nothing;
  return new;
end $$;

revoke all on function public.whatsapp_start_link(uuid,text) from public,anon,authenticated;
revoke all on function public.whatsapp_resolve(text,jsonb,text,boolean) from public,anon,authenticated;
revoke all on function public.whatsapp_operation(text,text,integer,jsonb) from public,anon,authenticated;
revoke all on function public.whatsapp_claim_send(text,text,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.whatsapp_start_link(uuid,text),public.whatsapp_resolve(text,jsonb,text,boolean),
  public.whatsapp_operation(text,text,integer,jsonb),public.whatsapp_claim_send(text,text,uuid,text,text,integer,jsonb) to service_role;
