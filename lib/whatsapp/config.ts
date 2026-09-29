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
