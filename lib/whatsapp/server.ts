import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/utils/supabase/server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'
import { verifyInternal } from './security'
import { whatsappEnabled } from './config'

export class WhatsAppError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export function waJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}
export function waError(error: unknown) {
  if (error instanceof WhatsAppError) return waJson({ error: error.message }, error.status)
  console.error('[whatsapp] request failed', error instanceof Error ? error.message : 'database failure')
  return waJson({ error: 'No pudimos completar la operación. Inténtalo de nuevo.', status: 'temporary_error' }, 503)
}
export function assertEnabled() {
  if (!whatsappEnabled()) throw new WhatsAppError('La vinculación de WhatsApp aún no está habilitada.', 503)
}
export async function ownUser(request: NextRequest, mutate = false) {
  assertEnabled()
  if (mutate && request.headers.get('origin') !== request.nextUrl.origin) throw new WhatsAppError('Origen no permitido.', 403)
  const supabase = await createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new WhatsAppError('Inicia sesión para continuar.', 401)
  if (!user.email_confirmed_at) throw new WhatsAppError('Verifica tu correo primero.', 403)
  return { user, supabase }
}
export async function internalBody(request: NextRequest) {
  assertEnabled()
  const raw = await request.text()
  if (Buffer.byteLength(raw) > 1_000_000) throw new WhatsAppError('Payload too large', 413)
  const nonce = verifyInternal(process.env.WHATSAPP_INTERNAL_SECRET ?? '', request.nextUrl.pathname, request.headers, raw)
  if (!nonce) throw new WhatsAppError('Invalid signature', 401)
  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('whatsapp_nonces').insert({ nonce })
  if (error) throw new WhatsAppError(error.code === '23505' ? 'Request already received' : 'Authentication unavailable', error.code === '23505' ? 409 : 503)
  try {
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected object')
    return body
  } catch { throw new WhatsAppError('Invalid JSON object') }
}
export async function waRpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdminClient().rpc(name, args)
  if (error) {
    if (error.message.includes('rate_limited')) throw new WhatsAppError('Espera unos minutos antes de generar otro código.', 429)
    if (error.code === '42501') throw new WhatsAppError('Vuelve a vincular WhatsApp y verifica tu acceso a FinancIA.', 403)
    throw new Error(`RPC ${name}: ${error.code ?? 'unknown'} ${error.message}`)
  }
  return data
}
