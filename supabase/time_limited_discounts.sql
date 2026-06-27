-- Time-limited percentage discount codes
-- Run in Supabase dashboard after apply_promo_at_register.sql has been applied.

-- promo_codes: optional months limit (null = lifetime discount)
alter table public.promo_codes
  add column if not exists discount_months integer
    check (discount_months is null or discount_months > 0);

-- user_profiles: mirror the months limit when code is applied at registration
alter table public.user_profiles
  add column if not exists discount_months integer;

-- user_profiles: computed at subscribe time, cleared when discount expires
alter table public.user_profiles
  add column if not exists discount_ends_at timestamptz;
