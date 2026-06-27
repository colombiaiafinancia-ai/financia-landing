-- Extension to promo_codes: adds support for percentage discount codes.
-- The existing trial-based flow (redeem_promo_code function) is NOT modified.
-- Run this AFTER promo_codes.sql has already been applied.

-- 1. trial_days is no longer required — percentage codes don't use it
alter table public.promo_codes
  alter column trial_days drop not null;

-- 2. Distinguish code types: 'trial' (existing) vs 'percentage' (new)
alter table public.promo_codes
  add column if not exists type text not null default 'trial'
    check (type in ('trial', 'percentage'));

-- 3. Percentage value (e.g. 20 = 20% off). NULL for trial codes.
alter table public.promo_codes
  add column if not exists discount_value numeric
    check (discount_value is null or discount_value > 0);

-- 4. Integrity: trial codes must have trial_days; percentage codes must have discount_value
alter table public.promo_codes
  add constraint promo_codes_type_integrity check (
    (type = 'trial'      and trial_days      is not null) or
    (type = 'percentage' and discount_value  is not null)
  );

-- 5. Tag existing rows as 'trial' (they were created before the type column existed)
update public.promo_codes
set type = 'trial'
where type is distinct from 'trial' or type is null;

-- 6. Seed SOLVI26 as a lifetime 20% percentage discount code
insert into public.promo_codes (
  code, name, description, type, discount_value, trial_days, is_active
) values (
  'SOLVI26',
  'SOLVI - 20% descuento de por vida',
  'Codigo promocional SOLVI: 20% de descuento vitalicio en la suscripcion.',
  'percentage',
  20,
  null,
  true
)
on conflict (code) do update set
  name           = excluded.name,
  description    = excluded.description,
  type           = excluded.type,
  discount_value = excluded.discount_value,
  is_active      = excluded.is_active,
  updated_at     = now();
