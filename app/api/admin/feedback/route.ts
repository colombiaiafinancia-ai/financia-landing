import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/services/supabase/client-server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'

async function assertSuperUser() {
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

export async function GET() {
  const denied = await assertSuperUser()
  if (denied) return denied

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('feedback_suggestions')
    .select('id, user_id, user_email, user_name, topic, message, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
