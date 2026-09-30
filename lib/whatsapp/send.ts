import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { hasPlatformAccess } from '@/lib/trial'
import { recipientFields } from './identity'
import { whatsappConfig } from './config'
import { waRpc, WhatsAppError } from './server'
import { deliveryOutcome } from './delivery'

export interface SendInput {
  eventKey?: string
  userId?: string
  reminderDate?: string
  linkVersion?: number
  key: string
  content?: { type: 'text' | 'interactive'; text?: string; interactive?: Record<string, unknown> }
}

export async function sendVerifiedWhatsApp(input: SendInput) {
  const admin = getSupabaseAdminClient()
  const config = whatsappConfig()
  const token = process.env.WHATSAPP_API_KEY
  if (!token) throw new Error('Missing WhatsApp token')
  let userId: string | null = null
  let version: number | null = null
  let recipient: { to?: string; recipient?: string }
  let content: Record<string, unknown>
  let key: string
  if (input.eventKey) {
    const { data: event, error } = await admin.from('whatsapp_events').select('*').eq('event_key', input.eventKey)
      .eq('business_id', config.businessId).eq('phone_number_id', config.phoneNumberId).single()
    if (error || !event) throw new WhatsAppError('Unknown event', 404)
    recipient = recipientFields(event.event)
    const r = event.result
    if (r.status !== 'linked' || r.linked_now || !r.can_operate) {
      if (r.reply === false) return { status: 'skipped', success: false }
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://financiaia.com'}/login?next=${encodeURIComponent('/dashboard#whatsapp')}`
      const text = r.status === 'maintenance' ? '🛠️ Estamos actualizando FinancIA. Escríbenos de nuevo en unos minutos.\n\nEste mensaje *no* registró ningún movimiento.'
        : r.status === 'conflict' ? `⚠️ Este WhatsApp ya está conectado a *otra cuenta* de FinancIA, así que no hicimos ningún cambio.\n\nEntra con la cuenta correcta desde este enlace y revisa la sección *“Vincula tu WhatsApp”*:\n👉 ${link}\n\nSi necesitas ayuda, respóndenos aquí.`
        : r.linked_now ? '✅ ¡Listo! Tu WhatsApp quedó conectado a tu cuenta de FinancIA.\n\nYa puedes escribirme tus gastos e ingresos. Por ejemplo: *“Gasté 20.000 en almuerzo”* o *“¿Cuál es mi balance?”*'
        : r.status === 'linked' ? `Tu WhatsApp está conectado, pero tu cuenta no tiene un plan activo.\n\nActiva tu plan aquí para seguir usando el bot:\n👉 ${link}`
        : r.reason === 'invalid_code' ? `⌛ Ese código ya venció o no es válido.\n\nPide uno nuevo así:\n1️⃣ Entra aquí: ${link}\n2️⃣ Toca *“Generar otro código”*.\n3️⃣ Envía el mensaje que se abre en WhatsApp, sin cambiarlo.`
        : `👋 ¡Hola! Para usar FinancIA por WhatsApp primero debes conectar este número con tu cuenta. Es un paso de seguridad y solo se hace una vez (toma 1 minuto).\n\n1️⃣ Entra a tu cuenta desde este enlace:\n👉 ${link}\n\n2️⃣ En la sección *“Vincula tu WhatsApp”*, elige si tienes @usuario de WhatsApp. Si no sabes qué es, elige *“No tengo @usuario”*.\n\n3️⃣ Toca el botón *“Vincular mi WhatsApp”*. Se abrirá este chat con un mensaje que empieza por *VINCULAR*.\n\n4️⃣ Envía ese mensaje *tal como aparece*, sin cambiarlo.\n\nTe confirmaremos aquí cuando quede listo ✅\n\n¿Aún no tienes cuenta? Créala en https://financiaia.com`
      content = { type: 'text', text: { body: text } }
      key = `${input.eventKey}:notice`
    } else {
      const { data: profile, error: profileError } = await admin.from('user_profiles').select('*').eq('user_id', event.user_id).single()
      if (profileError) throw profileError
      if (!profile.whatsapp_verified_at || profile.whatsapp_link_version !== r.link_version || !hasPlatformAccess(profile)) {
        throw new WhatsAppError('Identity or access changed', 403)
      }
      userId = profile.user_id; version = profile.whatsapp_link_version
      if (input.content?.type === 'text' && typeof input.content.text === 'string' && input.content.text.length > 0 && input.content.text.length <= 4096) {
        content = { type: 'text', text: { body: input.content.text } }
      } else if (input.content?.type === 'interactive' && input.content.interactive) {
        content = { type: 'interactive', interactive: input.content.interactive }
      } else throw new WhatsAppError('Invalid message content')
      if (!/^[\w .-]{1,160}$/.test(input.key)) throw new WhatsAppError('Invalid send key')
      key = `${input.eventKey}:${input.key}`
    }
  } else {
    if (!input.userId || !input.reminderDate) throw new WhatsAppError('Missing reminder identity')
    const { data: profile, error } = await admin.from('user_profiles').select('*').eq('user_id', input.userId).single()
    if (error) throw error
    if (!profile.whatsapp_verified_at || !profile.reminder_opt_in || !hasPlatformAccess(profile) || profile.whatsapp_business_id !== config.businessId ||
        (input.linkVersion !== undefined && input.linkVersion !== profile.whatsapp_link_version)) return { status: 'cancelled', success: false }
    userId = profile.user_id; version = profile.whatsapp_link_version
    if (process.env.WHATSAPP_ROLLOUT_MODE !== 'live' && !(process.env.WHATSAPP_TEST_SENDERS ?? '').split(',').map(s => s.trim())
      .some(id => id && (id === profile.whatsapp_phone || id === profile.whatsapp_user_id))) return { status: 'cancelled', success: false }
    recipient = recipientFields({ whatsapp_user_id: profile.whatsapp_user_id, phone: profile.whatsapp_phone })
    const raw = process.env.WHATSAPP_REMINDER_TEMPLATE_PARAMS || ''
    let parameters: any[] = []
    if (raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) throw new Error('Expected template parameter array')
        parameters = parsed.map(p => typeof p === 'object' && p !== null ? { type: 'text', text: String(p.text ?? p.value ?? ''),
          ...((p.name || p.parameter_name) ? { parameter_name: p.name || p.parameter_name } : {}) } : { type: 'text', text: String(p) })
      } catch {
        parameters = raw.split('|').map(p => p.trim()).filter(Boolean).map(p => {
          const i = p.indexOf('='); return { type: 'text', text: i < 0 ? p : p.slice(i + 1), ...(i < 0 ? {} : { parameter_name: p.slice(0, i) }) }
        })
      }
    }
    content = { type: 'template', template: { name: process.env.WHATSAPP_REMINDER_TEMPLATE_NAME || 'reminders',
      language: { code: process.env.WHATSAPP_REMINDER_TEMPLATE_LANGUAGE || 'es_CO' },
      ...(parameters.length ? { components: [{ type: 'body', parameters }] } : {}) } }
    key = `reminder:${input.userId}:${input.reminderDate}`
  }
  const payload = { messaging_product: 'whatsapp', recipient_type: 'individual', ...recipient, ...content }
  for (;;) {
    const claim = await waRpc('whatsapp_claim_send', { p_key: key, p_event_key: input.eventKey ?? null, p_user_id: userId,
      p_business_id: config.businessId, p_phone_number_id: config.phoneNumberId, p_version: version, p_payload: payload })
    if (!claim.claimed) return { status: claim.status, success: ['accepted','delivered','read'].includes(claim.status), messageId: claim.meta_message_id }
    let status: string = 'unknown'; let messageId: string | null = null; let lastError: string | null = null
    try {
      const response = await fetch(`https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(12_000), redirect: 'error',
      })
      const body = await response.json()
      const outcome = deliveryOutcome(response.ok, body)
      status = outcome.status; messageId = outcome.messageId
      lastError = body?.error ? `Meta ${body.error.code ?? response.status}` : null
    } catch { lastError = 'Delivery outcome unknown; do not retry blindly' }
    if (status === 'retryable' && claim.attempt >= 3) status = 'failed'
    const delay = 1000 * 2 ** (claim.attempt - 1)
    const { error } = await admin.from('whatsapp_outbox').update({ status, meta_message_id: messageId, last_error: lastError,
      next_attempt_at: status === 'retryable' ? new Date(Date.now() + delay).toISOString() : null,
      updated_at: new Date().toISOString() }).eq('send_key', key).eq('status', 'sending')
    if (error) throw error // The sending state prevents a blind repeat if persistence fails.
    if (messageId) status = await waRpc('whatsapp_reconcile_delivery', {
      p_business_id: config.businessId, p_message_id: messageId, p_status: null,
    })
    if (status !== 'retryable') return { status, success: ['accepted','delivered','read'].includes(status), messageId, error: lastError }
    await new Promise(resolve => setTimeout(resolve, delay + 20))
  }
}
