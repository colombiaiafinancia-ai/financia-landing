import { NextRequest } from 'next/server'
import { internalBody, waError, waJson, waRpc, WhatsAppError } from '@/lib/whatsapp/server'

export async function POST(request: NextRequest) {
  try {
    const body = await internalBody(request)
    if (typeof body.eventKey !== 'string' || !['interpretation','transaction','budget','confirm_ingreso','confirm_gasto','cancel','stage','confirm_all'].includes(body.kind)) {
      throw new WhatsAppError('Invalid operation')
    }
    const result = ['stage','confirm_all'].includes(body.kind)
      ? await waRpc('whatsapp_batch', { p_event_key: body.eventKey, p_kind: body.kind, p_items: body.payload ?? [] })
      : await waRpc('whatsapp_operation', { p_event_key: body.eventKey, p_kind: body.kind,
        p_index: body.index ?? 0, p_payload: body.payload ?? {} })
    return waJson({ result })
  } catch (error) { return waError(error) }
}
