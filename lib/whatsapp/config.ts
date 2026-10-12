export const whatsappEnabled = () => process.env.WHATSAPP_IDENTITY_ENABLED === 'true'
export function whatsappConfig() {
  const businessId = process.env.WHATSAPP_BUSINESS_ID
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const businessPhone = process.env.WHATSAPP_BUSINESS_PHONE
  const version = process.env.WHATSAPP_GRAPH_VERSION
  if (!businessId || !phoneNumberId || !businessPhone || !version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error('WhatsApp identity configuration is incomplete')
  }
  return { businessId, phoneNumberId, businessPhone, version }
}

/**
 * Vinculación desde la web (elegir @usuario y generar el código VINCULAR): activa salvo que se apague con 'false'.
 * Es independiente de `whatsappEnabled`, que sigue controlando los recordatorios y las rutas internas.
 */
export const whatsappLinkingEnabled = () => process.env.WHATSAPP_IDENTITY_ENABLED !== 'false'

/** Número del bot al que el usuario envía "VINCULAR <código>". */
export const whatsappBusinessPhone = () => process.env.WHATSAPP_BUSINESS_PHONE || '573227031301'
