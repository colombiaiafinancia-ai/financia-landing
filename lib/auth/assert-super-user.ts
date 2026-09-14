import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/services/supabase/client-server'

/**
 * Verifica que la sesion actual pertenezca a un super usuario.
 * Devuelve una respuesta 401/403 lista para retornar si no lo es, o null si pasa.
 */
export async function assertSuperUser(): Promise<NextResponse | null> {
  const supabase = await getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_super_user')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.is_super_user) {
    return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 })
  }

  return null
}
