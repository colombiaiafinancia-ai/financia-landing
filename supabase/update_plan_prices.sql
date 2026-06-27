-- Price update 2026-06-26 — converted from USD to COP (~4,200 COP/USD)
-- Run in Supabase dashboard.
-- Checkout route reads amounts and currency from this table → flows directly to Mercado Pago.

update public.subscription_plans
  set amount = 19000, currency_id = 'COP', updated_at = now()
  where plan_key = 'financia_monthly';

update public.subscription_plans
  set amount = 182000, currency_id = 'COP', updated_at = now()
  where plan_key = 'financia_annual';

update public.subscription_plans
  set amount = 17000, currency_id = 'COP', updated_at = now()
  where plan_key = 'financia_founder_monthly';
