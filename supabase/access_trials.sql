-- Access rules effective 2026-09-22, America/Bogota. Safe to reapply.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Invoker rights preserve profile ownership RLS. Service jobs can check a supplied user.
create or replace function private.has_platform_access(p_user_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.user_profiles p where p.user_id = p_user_id
    and (p.is_super_user is true
      or (p.subscription_status = 'active' and p.current_plan is not null and p.current_plan <> 'free')
      or p.trial_ends_at > now())
  );
$$;
revoke all on function private.has_platform_access(uuid) from public, anon;
grant execute on function private.has_platform_access(uuid) to authenticated, service_role;

-- The trigger needs auth.users.created_at; users cannot choose their signup date.
create or replace function private.initialize_profile_trial()
returns trigger language plpgsql security definer set search_path = '' as $$
declare registered_at timestamptz;
begin
  if auth.uid() is not null and auth.uid() <> new.user_id then
    raise exception 'Unauthorized profile' using errcode = '42501';
  end if;
  select created_at into registered_at from auth.users where id = new.user_id;
  if registered_at is null then
    raise exception 'Auth user required' using errcode = '23503';
  end if;
  new.trial_ends_at := case
    when registered_at < timestamptz '2026-09-23 00:00:00-05'
      then timestamptz '2027-01-01 00:00:00-05'
    else registered_at + interval '30 days'
  end;
  if coalesce(new.current_plan, 'free') = 'free' then new.subscription_status := 'trial'; end if;
  return new;
end;
$$;
revoke all on function private.initialize_profile_trial() from public, anon, authenticated;
drop trigger if exists initialize_profile_trial on public.user_profiles;
create trigger initialize_profile_trial before insert on public.user_profiles
for each row execute function private.initialize_profile_trial();

-- Keep the existing signup behavior, replacing its old seven-day fallback.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.handle_new_user()'::regprocedure) into definition;
  execute replace(definition, 'interval ''7 days''', 'interval ''30 days''');
end;
$$;

-- Include registered accounts that did not yet have a profile.
insert into public.user_profiles (user_id, email, name)
select u.id, u.email, u.raw_user_meta_data->>'full_name' from auth.users u
where u.created_at < timestamptz '2026-09-23 00:00:00-05'
  and not exists (select 1 from public.user_profiles p where p.user_id = u.id)
on conflict (user_id) do nothing;
update public.user_profiles p
set trial_ends_at = greatest(p.trial_ends_at, timestamptz '2027-01-01 00:00:00-05'), updated_at = now()
from auth.users u where u.id = p.user_id
  and u.created_at < timestamptz '2026-09-23 00:00:00-05';

-- Prevent clients from granting themselves access or deleting/recreating their profile.
revoke all on public.user_profiles from anon;
revoke insert, update, delete on public.user_profiles from authenticated;
grant insert (user_id, email, name, phone, onboarding, reminder_opt_in, updated_at)
  on public.user_profiles to authenticated;
grant update (email, name, phone, onboarding, reminder_opt_in, updated_at)
  on public.user_profiles to authenticated;

update public.subscription_plans set is_active = false, updated_at = now()
where plan_key not in ('financia_monthly', 'financia_annual');

-- Restrictive policies add expiry checks to existing ownership policies.
-- Profiles and billing remain reachable to let an expired user pay and reactivate.
do $$
declare tbl text;
begin
  foreach tbl in array array['transactions','categories','category_budgets','recurring_expenses',
    'user_day_summary','user_day_category_summary','user_month_summary','user_month_category_summary',
    'bot_pending_actions','Respuestas_bot'] loop
    execute format('drop policy if exists platform_access_required on public.%I', tbl);
    execute format('create policy platform_access_required on public.%I as restrictive for all to authenticated using ((select private.has_platform_access(auth.uid()))) with check ((select private.has_platform_access(auth.uid())))', tbl);
  end loop;
end;
$$;

-- Bot functions run as definer, so enforce the same rule in their shared resolver.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.financia_bot_resolve_user_id_by_phone(text)'::regprocedure) into definition;
  if position('private.has_platform_access' in definition) = 0 then
    execute replace(definition, '  return v_user_id;', E'  if not private.has_platform_access(v_user_id) then\n    raise exception ''Tu acceso gratuito terminó. Elige un plan para continuar.'' using errcode = ''42501'';\n  end if;\n\n  return v_user_id;');
  end if;
  select pg_get_functiondef('public.get_users_eligible_for_reminder(uuid)'::regprocedure) into definition;
  if position('private.has_platform_access' in definition) = 0 then
    execute replace(definition, 'and p.reminder_opt_in = true', 'and p.reminder_opt_in = true and private.has_platform_access(u.id)');
  end if;
end;
$$;
commit;
