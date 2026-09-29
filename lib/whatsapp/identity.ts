/** Transport identity is deliberately separate from the account's contact phone. */
export interface WhatsAppEvent {
  whatsapp_user_id: string | null
  phone: string | null
  whatsapp_username: string | null
  name: string | null
  message: string | null
  message_type: string
  message_id: string
  business_phone_number_id: string
  audio: Record<string, unknown> | null
  image: Record<string, unknown> | null
  interactive: Record<string, any> | null
}

export function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function phoneIdentity(value: unknown): string | null {
  const raw = cleanString(value)
  // Never turn a BSUID into a phone number by stripping its letters.
  if (!raw || !/^\+?[0-9 ()-]+$/.test(raw)) return null
  const digits = raw.replace(/\D/g, '')
  return /^[1-9]\d{6,14}$/.test(digits) ? digits : null
}

export function bsuidIdentity(value: unknown): string | null {
  const raw = cleanString(value)
  return raw && /^[A-Z]{2}\.(?:ENT\.)?[A-Za-z0-9]{1,128}$/.test(raw) ? raw : null
}

export function usernameChoice(input: { hasUsername?: unknown; username?: unknown }) {
  if (typeof input.hasUsername !== 'boolean') throw new Error('Indica tu @usuario o selecciona «No tengo @usuario».')
  const username = cleanString(input.username)?.replace(/^@/, '') ?? null
  if (input.hasUsername && (!username || username.length > 128 || /[\s\x00-\x1f@]/.test(username))) {
    throw new Error('Escribe tu @usuario de WhatsApp sin espacios.')
  }
  return { hasUsername: input.hasUsername, username: input.hasUsername ? username : null }
}

export function normalizeWhatsApp(payload: any): { messages: WhatsAppEvent[]; statuses: any[] } {
  const root = payload?.body ?? payload
  const values = Array.isArray(root?.entry)
    ? root.entry.flatMap((entry: any) => Array.isArray(entry?.changes) ? entry.changes.map((change: any) => change?.value) : [])
    : [root]
  const messages: WhatsAppEvent[] = []
  const statuses: any[] = []
  for (const value of values) {
    if (!value || typeof value !== 'object') continue
    const business = cleanString(value.metadata?.phone_number_id)
    if (!business) continue
    statuses.push(...(Array.isArray(value.statuses) ? value.statuses : [])
      .filter((status: any) => status && typeof status === 'object')
      .map((status: any) => ({ ...status, business_phone_number_id: business })))
    const contacts = Array.isArray(value.contacts) ? value.contacts : []
    const inbound = Array.isArray(value.messages) ? value.messages : []
    for (const message of inbound) {
      if (!message || typeof message !== 'object') continue
      let contact = contacts.find((c: any) =>
        (message.from_user_id && c?.user_id === message.from_user_id) ||
        (message.from && c?.wa_id === message.from))
      if (!contact && contacts.length === 1 && inbound.length === 1) contact = contacts[0]
      // Conflicting message/contact fields must never establish an alias.
      if (message.from_user_id && contact?.user_id && message.from_user_id !== contact.user_id) continue
      if (message.from && contact?.wa_id && phoneIdentity(message.from) !== phoneIdentity(contact.wa_id)) continue
      const id = cleanString(message.id)
      const bsuid = bsuidIdentity(cleanString(message.from_user_id) ?? contact?.user_id)
      const phone = phoneIdentity(cleanString(message.from) ?? contact?.wa_id)
      if (!id || !business || (!bsuid && !phone)) continue
      messages.push({
        whatsapp_user_id: bsuid, phone,
        whatsapp_username: cleanString(contact?.profile?.username),
        name: cleanString(contact?.profile?.name),
        message: cleanString(message.text?.body),
        message_type: cleanString(message.type) ?? 'unknown', message_id: id,
        business_phone_number_id: business,
        audio: message.audio ?? null, image: message.image ?? null,
        interactive: message.interactive ?? null,
      })
    }
  }
  return { messages, statuses }
}

export function recipientFields(identity: { whatsapp_user_id?: unknown; phone?: unknown }) {
  const bsuid = bsuidIdentity(identity.whatsapp_user_id)
  if (bsuid) return { recipient: bsuid }
  const phone = phoneIdentity(identity.phone)
  if (phone) return { to: phone }
  throw new Error('No hay un destinatario de WhatsApp válido.')
}

export function linkCode(text: unknown): string | null {
  const match = cleanString(text)?.match(/^VINCULAR\s+([a-f0-9]{32})$/i)
  return match ? match[1].toLowerCase() : null
}

export function safeLoginDestination(value: string | null): string {
  return value === '/dashboard#whatsapp' ? value : '/dashboard'
}
