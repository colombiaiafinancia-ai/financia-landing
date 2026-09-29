-- Retain missing aliases only when the authenticated sender matches the existing verified identity.
create or replace function public.whatsapp_resolve(p_business_id text,p_event jsonb,p_code_hash text default null,p_maintenance boolean default false)
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
      update public.user_profiles set whatsapp_user_id=case when p.whatsapp_business_id=p_business_id and (by_b=c.user_id or by_p=c.user_id)
          then coalesce(b,p.whatsapp_user_id) else b end,
        whatsapp_phone=case when p.whatsapp_business_id=p_business_id and (by_b=c.user_id or by_p=c.user_id)
          then coalesce(ph,p.whatsapp_phone) else ph end,
        whatsapp_business_id=p_business_id,whatsapp_username_observed=case when p.whatsapp_business_id=p_business_id and (by_b=c.user_id or by_p=c.user_id)
          then coalesce(nullif(p_event->>'whatsapp_username',''),p.whatsapp_username_observed) else nullif(p_event->>'whatsapp_username','') end,
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
