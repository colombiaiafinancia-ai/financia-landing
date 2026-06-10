-- Codigos promocionales y redenciones.
-- La validacion y el canje se ejecutan desde el servidor con service_role.

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  normalized_code text generated always as (
    upper(regexp_replace(code, '\s+', '', 'g'))
  ) stored unique,
  name text not null,
  description text,
  trial_days integer not null check (trial_days > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemptions_count integer not null default 0 check (redemptions_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id),
  user_id uuid not null references auth.users(id),
  email text,
  trial_days integer not null check (trial_days > 0),
  trial_ends_at timestamptz not null,
  redeemed_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

revoke all on public.promo_codes from anon, authenticated;
revoke all on public.promo_redemptions from anon, authenticated;

create or replace function public.redeem_promo_code(
  p_user_id uuid,
  p_code text,
  p_email text default null
)
returns table(ok boolean, message text, trial_days integer, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_promo public.promo_codes%rowtype;
  v_trial_ends_at timestamptz;
begin
  select * into v_promo
  from public.promo_codes
  where normalized_code = v_code
  for update;

  if not found or not v_promo.is_active
    or (v_promo.starts_at is not null and now() < v_promo.starts_at)
    or (v_promo.expires_at is not null and now() > v_promo.expires_at)
    or (v_promo.max_redemptions is not null and v_promo.redemptions_count >= v_promo.max_redemptions)
  then
    return query select false, 'Codigo promocional no disponible', null::integer, null::timestamptz;
    return;
  end if;

  v_trial_ends_at := now() + make_interval(days => v_promo.trial_days);

  update public.user_profiles
  set subscription_status = 'trial',
      current_plan = coalesce(current_plan, 'free'),
      trial_ends_at = greatest(coalesce(trial_ends_at, v_trial_ends_at), v_trial_ends_at),
      updated_at = now()
  where user_id = p_user_id
    and coalesce(is_super_user, false) = false
    and coalesce(current_plan, 'free') = 'free';

  insert into public.promo_redemptions (
    promo_code_id, user_id, email, trial_days, trial_ends_at
  ) values (
    v_promo.id, p_user_id, p_email, v_promo.trial_days, v_trial_ends_at
  )
  on conflict (promo_code_id, user_id) do nothing;

  if found then
    update public.promo_codes
    set redemptions_count = redemptions_count + 1,
        updated_at = now()
    where id = v_promo.id;
  end if;

  return query select true, 'Codigo promocional aplicado', v_promo.trial_days, v_trial_ends_at;
end;
$$;

revoke all on function public.redeem_promo_code(uuid, text, text) from public, anon, authenticated;
grant execute on function public.redeem_promo_code(uuid, text, text) to service_role;

insert into public.promo_codes (
  code, name, description, trial_days, starts_at, expires_at, is_active
) values (
  'FinanzasConsulting26',
  'Fondos de empleados - Finanzas Consulting 2026',
  'Codigo para asistentes a la reunion de fondos de empleados.',
  30,
  '2026-06-11 00:00:00 America/Bogota',
  '2026-06-13 23:59:59 America/Bogota',
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  trial_days = excluded.trial_days,
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  is_active = excluded.is_active,
  updated_at = now();
