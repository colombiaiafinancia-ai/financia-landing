import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { usernameChoice } from '@/lib/whatsapp/identity'
import { ownUser, waError, waJson, WhatsAppError } from '@/lib/whatsapp/server'

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await ownUser(request, true)
    let choice
    try { choice = usernameChoice(await request.json()) } catch (error) { throw new WhatsAppError((error as Error).message) }
    const { error } = await getSupabaseAdminClient().from('user_profiles').update({
      whatsapp_username: choice.username, whatsapp_has_username: choice.hasUsername,
    }).eq('user_id', user.id)
    if (error) throw error
    return waJson({ saved: true })
  } catch (error) { return waError(error) }
}
