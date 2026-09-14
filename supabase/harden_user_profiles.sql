-- Endurecimiento de public.user_profiles
--
-- Problema: la app escribe en user_profiles desde el navegador (onboarding, recordatorios),
-- y esa misma tabla guarda columnas de privilegio y facturacion (is_super_user, current_plan,
-- subscription_status, trial_ends_at, descuentos). Con una policy RLS del tipo
-- `auth.uid() = user_id`, un usuario podia cambiar esas columnas desde la consola del navegador.
--
-- Solucion: permisos por columna. El rol `authenticated` solo puede insertar/actualizar las
-- columnas que la app realmente usa desde el cliente. Las rutas de servidor usan service_role
-- y no se ven afectadas. RLS sigue aplicando (cada usuario solo toca su propia fila).
--
-- Ejecutar una vez en el SQL editor de Supabase.

begin;

-- 1. Nadie sin sesion puede leer ni escribir perfiles
revoke all on public.user_profiles from anon;

-- 2. Reemplazar permisos de tabla por permisos de columna para usuarios autenticados
revoke insert, update, delete on public.user_profiles from authenticated;

grant insert (user_id, email, name, phone, onboarding, reminder_opt_in, updated_at)
  on public.user_profiles to authenticated;

grant update (email, name, phone, onboarding, reminder_opt_in, updated_at)
  on public.user_profiles to authenticated;

-- SELECT se mantiene tal cual (RLS limita a la propia fila).

commit;

-- Verificacion (con la sesion de un usuario normal, deberia fallar con "permission denied for column"):
--   update public.user_profiles set is_super_user = true where user_id = auth.uid();
--   update public.user_profiles set current_plan = 'financia_annual', subscription_status = 'active' where user_id = auth.uid();
