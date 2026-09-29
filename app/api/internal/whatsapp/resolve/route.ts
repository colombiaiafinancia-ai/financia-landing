import { NextRequest } from 'next/server'
import { normalizeWhatsApp, linkCode } from '@/lib/whatsapp/identity'
import { hashCode } from '@/lib/whatsapp/security'
import { whatsappConfig } from '@/lib/whatsapp/config'
import { internalBody, waError, waJson, waRpc, WhatsAppError } from '@/lib/whatsapp/server'

export async function POST(request: NextRequest) {
  try {
    const body = await internalBody(request)
    const config = whatsappConfig()
    const { messages, statuses } = normalizeWhatsApp(body.payload)
    // Validate the entire batch before processing any message or delivery receipt.
    if ([...messages, ...statuses].some(event => event.business_phone_number_id !== config.phoneNumberId)) {
      throw new WhatsAppError('Unexpected business number', 403)
    }
    for (const status of statuses) {
      if (!['delivered','read','failed'].includes(status.status) || typeof status.id !== 'string') continue
      await waRpc('whatsapp_reconcile_delivery', { p_business_id: config.businessId,
        p_message_id: status.id, p_status: status.status })
    }
    const allowlist = (process.env.WHATSAPP_TEST_SENDERS ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const items = []
    for (const event of messages) {
      const maintenance = process.env.WHATSAPP_ROLLOUT_MODE !== 'live' && !allowlist.some(id => id === event.phone || id === event.whatsapp_user_id)
      const code = linkCode(event.message)
      const result = await waRpc('whatsapp_resolve', {
        p_business_id: config.businessId, p_event: event, p_code_hash: code ? hashCode(code) : null, p_maintenance: maintenance,
      })
      items.push({ ...event, ...result, id_usuario: result.user_id ?? null,
        numero_usuario: event.phone, id_tel: event.phone,
        process_financial: result.status === 'linked' && result.can_operate === true && !result.linked_now })
    }
    return waJson({ items })
  } catch (error) { return waError(error) }
}
