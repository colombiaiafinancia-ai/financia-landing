import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { ownUser, waError, waJson, WhatsAppError } from '@/lib/whatsapp/server'

export async function POST(request: NextRequest) {
  try {
    const { user } = await ownUser(request, true)
    const { data, error } = await getSupabaseAdminClient().from('user_profiles').update({ onboarding: 'completado' })
      .eq('user_id', user.id).not('whatsapp_verified_at', 'is', null).select('user_id').maybeSingle()
    if (error) throw error
    if (!data) throw new WhatsAppError('Completa la vinculación de WhatsApp. Puedes seguir usando la web.', 409)
    return waJson({ completed: true })
  } catch (error) { return waError(error) }
}
