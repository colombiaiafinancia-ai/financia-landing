import { NextResponse } from 'next/server'
import { assertSuperUser } from '@/lib/auth/assert-super-user'
import { getSupabaseAdminClient } from '@/services/supabase/admin'

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
