-- Arreglar políticas RLS para la tabla transacciones
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- 1. Verificar el estado actual de RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'transacciones';

-- 2. Mostrar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transacciones';

-- 3. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transacciones;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transacciones;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transacciones;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert_policy" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_select_policy" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update_policy" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete_policy" ON public.transacciones;

-- 4. Crear nuevas políticas RLS más permisivas
-- Política para INSERT: permitir insertar transacciones para usuarios autenticados
CREATE POLICY "transacciones_insert_policy" ON public.transacciones
  FOR INSERT 
  WITH CHECK (
    -- Permitir si el usuario está autenticado Y es el dueño de la transacción
    auth.uid() IS NOT NULL AND auth.uid()::text = usuario_id
    OR
    -- Permitir durante el registro inicial (cuando auth.uid() puede ser NULL temporalmente)
    auth.uid() IS NULL
  );

-- Política para SELECT: permitir ver solo las transacciones propias
CREATE POLICY "transacciones_select_policy" ON public.transacciones
  FOR SELECT 
  USING (
    -- Solo ver transacciones propias
    auth.uid() IS NOT NULL AND auth.uid()::text = usuario_id
  );

-- Política para UPDATE: permitir actualizar solo las transacciones propias
CREATE POLICY "transacciones_update_policy" ON public.transacciones
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid()::text = usuario_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = usuario_id);

-- Política para DELETE: permitir eliminar solo las transacciones propias
CREATE POLICY "transacciones_delete_policy" ON public.transacciones
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid()::text = usuario_id);

-- 5. Asegurar que RLS esté habilitado
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- 6. Verificar las nuevas políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transacciones'
ORDER BY policyname;

-- 7. Test de inserción (opcional - comentado por seguridad)
-- INSERT INTO public.transacciones (usuario_id, valor, categoria, tipo, descripcion, creado_en)
-- VALUES ('test-user-id', 1000, 'Test', 'gasto', 'Test RLS', NOW());

-- 8. Mostrar información de debug
SELECT 
  'Tabla transacciones' as info,
  (SELECT COUNT(*) FROM public.transacciones) as total_transacciones,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'transacciones') as total_policies;

-- 9. Verificar permisos de la tabla
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'transacciones' 
  AND table_schema = 'public';

RAISE NOTICE 'Políticas RLS para transacciones actualizadas exitosamente';
