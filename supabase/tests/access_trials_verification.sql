begin;
-- Temporary test accounts; every insert and update in this test is rolled back.
do $$
declare v_new uuid := gen_random_uuid(); v_old uuid := gen_random_uuid(); v_end timestamptz;
begin
  insert into auth.users(id,email,created_at,raw_user_meta_data)
  values(v_new, v_new::text || '@access-test.invalid', timestamptz '2026-09-23 00:00-05', '{}'::jsonb),
        (v_old, v_old::text || '@access-test.invalid', timestamptz '2026-09-22 23:59:59-05', '{}'::jsonb);
  select trial_ends_at into v_end from public.user_profiles where user_id=v_new;
  if v_end is distinct from timestamptz '2026-10-23 00:00-05' then raise exception '30-day trigger failed'; end if;
  select trial_ends_at into v_end from public.user_profiles where user_id=v_old;
  if v_end is distinct from timestamptz '2027-01-01 00:00-05' then raise exception 'Cohort trigger failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select user_id::text from public.transactions group by user_id order by count(*) desc limit 1), true);
update public.user_profiles set is_super_user=false, subscription_status='trial', current_plan='free', trial_ends_at=now()-interval '1 second'
where user_id=auth.uid();
set local role authenticated;
do $$
begin
  if private.has_platform_access(auth.uid()) then raise exception 'Expired access not blocked'; end if;
  if exists(select 1 from public.transactions) then raise exception 'Expired transaction read not blocked'; end if;
  begin
    insert into public.categories(user_id,name,direction) values(auth.uid(),'__access_test__','gasto');
    raise exception 'Expired insert not blocked';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_profiles set trial_ends_at=now()+interval '1 year' where user_id=auth.uid();
    raise exception 'Self extension not blocked';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
update public.user_profiles set trial_ends_at=now()+interval '1 day' where user_id=auth.uid();
set local role authenticated;
do $$ begin
  if not private.has_platform_access(auth.uid()) then raise exception 'Active trial denied'; end if;
  if not exists(select 1 from public.transactions) then raise exception 'Active trial RLS denied'; end if;
end $$;
reset role;
update public.user_profiles set trial_ends_at=now(),subscription_status='pending',current_plan='financia_monthly' where user_id=auth.uid();
set local role authenticated;
do $$ begin
  if private.has_platform_access(auth.uid()) then raise exception 'Pending or exact expiry incorrectly allowed'; end if;
end $$;
reset role;
update public.user_profiles set subscription_status='active' where user_id=auth.uid();
set local role authenticated;
do $$ begin
  if not private.has_platform_access(auth.uid()) then raise exception 'Paid access denied'; end if;
end $$;
reset role;
update public.user_profiles set subscription_status='cancelled',is_super_user=true where user_id=auth.uid();
set local role authenticated;
do $$ begin
  if not private.has_platform_access(auth.uid()) then raise exception 'Admin access denied'; end if;
end $$;
reset role;
rollback;
select 'PASS: signup 30 days, cutoff cohort, expired read/write blocked, self-extension blocked, active trial, exact expiry, pending, paid, admin; all test changes rolled back' as verification;
