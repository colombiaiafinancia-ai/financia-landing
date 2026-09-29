import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { ownUser, waError, waJson, waRpc, WhatsAppError } from '@/lib/whatsapp/server'
import { hashCode } from '@/lib/whatsapp/security'
import { whatsappConfig } from '@/lib/whatsapp/config'

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await ownUser(request, true)
    const config = whatsappConfig()
    const { data: profile, error } = await getSupabaseAdminClient().from('user_profiles')
      .select('whatsapp_verified_at,whatsapp_has_username').eq('user_id', user.id).single()
    if (error) throw error
    if (profile.whatsapp_has_username === null) throw new WhatsAppError('Indica tu @usuario o selecciona «No tengo @usuario».')
    if (profile.whatsapp_verified_at) {
      const { password } = await request.json()
      if (!password || typeof password !== 'string' || !user.email) throw new WhatsAppError('Confirma tu contraseña para cambiar WhatsApp.', 403)
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password })
      if (authError || data.user?.id !== user.id) throw new WhatsAppError('No pudimos confirmar tu contraseña.', 403)
    }
    const code = randomBytes(16).toString('hex')
    const result = await waRpc('whatsapp_start_link', { p_user_id: user.id, p_code_hash: hashCode(code) })
    const url = `https://wa.me/${config.businessPhone}?text=${encodeURIComponent(`VINCULAR ${code}`)}`
    return waJson({ code, url, expiresAt: result.expiresAt })
  } catch (error) { return waError(error) }
}
