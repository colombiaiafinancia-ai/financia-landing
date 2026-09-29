import { NextRequest } from 'next/server'
import { internalBody, waError, waJson, WhatsAppError } from '@/lib/whatsapp/server'
import { sendVerifiedWhatsApp } from '@/lib/whatsapp/send'

export async function POST(request: NextRequest) {
  try {
    const body = await internalBody(request)
    if (typeof body.eventKey !== 'string') throw new WhatsAppError('Event key required')
    return waJson(await sendVerifiedWhatsApp({ eventKey: body.eventKey, key: body.key ?? 'reply', content: body.content }))
  } catch (error) { return waError(error) }
}
