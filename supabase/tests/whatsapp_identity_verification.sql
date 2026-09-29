-- Dedicated synthetic accounts; every change, including auth.users, is rolled back.
begin;
do $$
declare
  u1 uuid:=gen_random_uuid(); u2 uuid:=gen_random_uuid(); b text:='audit-'||gen_random_uuid();
  r jsonb; ev jsonb; k text; p public.user_profiles; cat uuid; v integer; n integer;
begin
  insert into auth.users(id,email,created_at,updated_at,raw_user_meta_data) values
    (u1,u1||'@financia-test.invalid',now(),now(),'{"full_name":"Identity test A","phone":"+573001111111","whatsapp_has_username":false}'),
    (u2,u2||'@financia-test.invalid',now(),now(),'{"full_name":"Identity test B","phone":"+573001111111","whatsapp_has_username":false}');
  if (select count(*) from public.user_profiles where user_id in (u1,u2))<>2 then raise exception 'Registration merged contact phones'; end if;
  perform public.whatsapp_start_link(u1,repeat('a',64));
  ev:=jsonb_build_object('message_id','link1','business_phone_number_id','test-number','whatsapp_user_id','CO.TestA','phone',null,'message','VINCULAR secret');
  r:=public.whatsapp_resolve(b,ev,repeat('a',64),false);
  if r->>'user_id'<>u1::text or r->>'linked_now'<>'true' then raise exception 'BSUID linking failed: %',r; end if;
  if (select event->>'message' from public.whatsapp_events where event_key=r->>'event_key')<>'[link code redacted]' then raise exception 'Code leaked'; end if;
  r:=public.whatsapp_resolve(b,ev,repeat('a',64),false);
  if r->>'duplicate'<>'true' then raise exception 'Replay not detected'; end if;
  perform public.whatsapp_start_link(u2,repeat('b',64));
  r:=public.whatsapp_resolve(b,ev||'{"message_id":"conflict"}',repeat('b',64),false);
  if r->>'status'<>'conflict' then raise exception 'Identity stolen'; end if;
  r:=public.whatsapp_resolve(b,jsonb_build_object('message_id','unlinked','business_phone_number_id','test-number','phone','573001111111'),null,false);
  if r->>'status'<>'link_required' then raise exception 'Contact phone granted access'; end if;
  perform public.whatsapp_start_link(u2,repeat('c',64));
  r:=public.whatsapp_resolve(b,jsonb_build_object('message_id','old-code','business_phone_number_id','test-number','phone','573002222222'),repeat('b',64),false);
  if r->>'reason'<>'invalid_code' then raise exception 'Invalidated code accepted'; end if;
  update public.whatsapp_link_codes set expires_at=now()-interval '1 minute' where code_hash=repeat('c',64);
  r:=public.whatsapp_resolve(b,jsonb_build_object('message_id','expired','business_phone_number_id','test-number','phone','573002222222'),repeat('c',64),false);
  if r->>'reason'<>'invalid_code' then raise exception 'Expired code accepted'; end if;
  r:=public.whatsapp_resolve(b,ev||'{"message_id":"both-identities","phone":"573003333333","message":"Hola"}',null,false);
  perform public.whatsapp_start_link(u1,repeat('d',64));
  r:=public.whatsapp_resolve(b,ev||'{"message_id":"relink-same","phone":"573003333333","whatsapp_user_id":null}',repeat('d',64),false);
  if (select whatsapp_user_id from public.user_profiles where user_id=u1) is distinct from 'CO.TestA' then raise exception 'Existing verified alias lost'; end if;
  r:=public.whatsapp_resolve(b,ev||'{"message_id":"financial","message":"Gasté 100"}',null,false); k:=r->>'event_key';
  select id into cat from public.categories where user_id is null and direction='gasto' limit 1;
  if cat is null then raise exception 'Test requires existing global expense category'; end if;
  perform public.whatsapp_operation(k,'interpretation',0,'{"output":"first"}');
  r:=public.whatsapp_operation(k,'interpretation',0,'{"output":"second"}');
  if r->>'output'<>'first' then raise exception 'Interpretation changed on retry'; end if;
  r:=public.whatsapp_operation(k,'transaction',0,jsonb_build_object('tipo','gasto','valor',100,'category_id',cat,'descripcion','test'));
  perform public.whatsapp_operation(k,'transaction',0,jsonb_build_object('tipo','gasto','valor',999,'category_id',cat));
  if (select count(*) from public.transactions where user_id=u1)<>1 then raise exception 'Duplicate transaction'; end if;
  if (select amount from public.transactions where user_id=u1)<>100 then raise exception 'Replay altered amount'; end if;
  perform public.whatsapp_operation(k,'budget',0,jsonb_build_object('valor',1000,'category_id',cat));
  perform public.whatsapp_operation(k,'confirm_gasto',0,'{}');
  perform public.whatsapp_operation(k,'transaction',1,jsonb_build_object('tipo','gasto','valor',200,'category_id',cat));
  perform public.whatsapp_operation(k,'confirm_gasto',0,'{}');
  if (select count(*) from public.transactions where user_id=u1 and status='pendiente')<>1 then raise exception 'Replay confirmed later pending'; end if;
  perform public.whatsapp_operation(k,'cancel',0,'{}');
  if exists(select 1 from public.transactions where user_id=u1 and status='pendiente') then raise exception 'Cancel failed'; end if;
  r:=public.whatsapp_resolve(b,ev||'{"message_id":"batch","message":"two expenses"}',null,false); k:=r->>'event_key';
  begin
    perform public.whatsapp_batch(k,'stage',jsonb_build_array(
      jsonb_build_object('tipo','gasto','valor',50,'category_id',cat),
      jsonb_build_object('tipo','gasto','valor',-1,'category_id',cat)));
    raise exception 'invalid batch accepted';
  exception when others then
    if sqlerrm<>'invalid_amount' then raise; end if;
  end;
  if exists(select 1 from public.transactions where user_id=u1 and status='pendiente') then raise exception 'partial batch persisted'; end if;
  perform public.whatsapp_batch(k,'stage',jsonb_build_array(jsonb_build_object('tipo','gasto','valor',50,'category_id',cat)));
  perform public.whatsapp_batch(k,'stage','[]');
  if (select count(*) from public.transactions where user_id=u1 and status='pendiente')<>1 then raise exception 'batch replay duplicated'; end if;
  perform public.whatsapp_batch(k,'confirm_all');
  perform public.whatsapp_operation(k,'transaction',2,jsonb_build_object('tipo','gasto','valor',200,'category_id',cat));
  perform public.whatsapp_batch(k,'confirm_all');
  if (select count(*) from public.transactions where user_id=u1 and status='pendiente')<>1 then raise exception 'confirmation replay affected later pending'; end if;
  perform public.financia_bot_stage_action_by_user_id(u1,'crear_categoria','{"name":"test"}',false);
  if (select phone from public.bot_pending_actions where user_id=u1) is distinct from '573003333333' then raise exception 'UUID helper used wrong contact'; end if;
  perform public.financia_bot_cancel_pending_by_user_id(u1);
  perform public.whatsapp_reconcile_delivery(b,'meta-'||b,'delivered');
  select * into p from public.user_profiles where user_id=u1;
  r:=public.whatsapp_claim_send('test-'||b,k,u1,b,'test-number',p.whatsapp_link_version,'{"type":"text"}');
  if r->>'claimed'<>'true' then raise exception 'Send not reserved'; end if;
  r:=public.whatsapp_claim_send('test-'||b,k,u1,b,'test-number',p.whatsapp_link_version,'{"type":"text"}');
  if r->>'claimed'<>'false' then raise exception 'Duplicate send'; end if;
  update public.whatsapp_outbox set meta_message_id='meta-'||b,status='accepted' where send_key='test-'||b;
  if public.whatsapp_reconcile_delivery(b,'meta-'||b)<>'delivered' then raise exception 'Early delivery receipt lost'; end if;
  if public.whatsapp_reconcile_delivery(b,'meta-'||b,'failed')<>'delivered' then raise exception 'Receipt regressed'; end if;
  if public.whatsapp_reconcile_delivery(b,'meta-'||b,'read')<>'read' then raise exception 'Read receipt missing'; end if;
  update public.user_profiles set whatsapp_link_version=whatsapp_link_version+1 where user_id=u1;
  begin
    perform public.whatsapp_operation(k,'transaction',2,jsonb_build_object('tipo','gasto','valor',100,'category_id',cat));
    raise exception 'Old link accepted';
  exception when insufficient_privilege then null; end;
  if has_function_privilege('authenticated','public.whatsapp_resolve(text,jsonb,text,boolean)','execute') then raise exception 'Public resolver exposed'; end if;
  if has_column_privilege('authenticated','public.user_profiles','whatsapp_user_id','update') then raise exception 'Identity editable by browser'; end if;
  raise notice 'WhatsApp SQL integration assertions passed';
end $$;
rollback;
