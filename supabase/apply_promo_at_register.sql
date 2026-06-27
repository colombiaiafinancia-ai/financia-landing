-- Migration: support percentage promo codes at registration
-- Run this on the Supabase dashboard SQL editor.

-- (a) Store lifetime discount percentage on user profile
alter table public.user_profiles
  add column if not exists discount_percentage numeric
  check (discount_percentage is null or (discount_percentage > 0 and discount_percentage <= 100));

-- (b) Make promo_redemptions flexible for percentage codes
--     (trial_days / trial_ends_at are not meaningful for percentage discounts)
alter table public.promo_redemptions
  alter column trial_days drop not null;

alter table public.promo_redemptions
  alter column trial_ends_at drop not null;

-- (c) Track redemption type and discount value
alter table public.promo_redemptions
  add column if not exists type text default 'trial'
  check (type in ('trial', 'percentage'));

alter table public.promo_redemptions
  add column if not exists discount_value numeric;

-- (d) Extend FinanzasConsulting26 expiry to end of July 2026
update public.promo_codes
  set expires_at = '2026-07-31 23:59:59 America/Bogota',
      updated_at = now()
  where normalized_code = 'FINANZASCONSULTING26';
