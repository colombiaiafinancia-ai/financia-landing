-- Fix monthly rollover timing for Colombia.
-- Supabase pg_cron schedules run in UTC; 05:05 UTC is 00:05 in America/Bogota.
select cron.unschedule('monthly-rollover');

select cron.schedule(
  'monthly-rollover',
  '5 5 1 * *',
  'select * from private.apply_monthly_rollover(date_trunc(''month'', now())::date)'
);

-- Backfill August 2026, which was missed because the previous job ran at
-- 00:05 UTC on August 1, still July 31 in America/Bogota.
select * from private.apply_monthly_rollover(date '2026-08-01');
