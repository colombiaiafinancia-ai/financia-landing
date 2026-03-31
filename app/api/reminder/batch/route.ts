export async function sendWhatsAppMessage(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = process.env.WHATSAPP_API_URL!;
    const token = process.env.WHATSAPP_API_KEY!;

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: 'recordatorio',        // nombre exacto de tu plantilla aprobada
        language: { code: 'en' },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}