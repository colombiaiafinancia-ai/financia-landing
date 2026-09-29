import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { ownUser, waError, waJson } from '@/lib/whatsapp/server'

export async function GET(request: NextRequest) {
  try {
    const { user } = await ownUser(request)
    const admin = getSupabaseAdminClient()
    const { data: profile, error } = await admin.from('user_profiles').select(
      'phone,whatsapp_phone,whatsapp_user_id,whatsapp_username,whatsapp_has_username,whatsapp_username_observed,whatsapp_verified_at,whatsapp_link_version'
    ).eq('user_id', user.id).single()
    if (error) throw error
    const { data: code, error: codeError } = await admin.from('whatsapp_link_codes').select('expires_at,consumed_at,invalidated_at,result')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (codeError) throw codeError
    const pending = code && !code.consumed_at && !code.invalidated_at
    return waJson({ profile, linked: !!profile.whatsapp_verified_at,
      state: pending ? (code.result === 'conflict' ? 'conflict' : Date.parse(code.expires_at) <= Date.now() ? 'expired' : 'waiting')
        : profile.whatsapp_verified_at ? 'linked' : 'pending' })
  } catch (error) { return waError(error) }
}
