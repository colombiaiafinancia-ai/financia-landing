export async function sendWhatsAppMessage(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Número inválido');
    }

    const url = process.env.WHATSAPP_API_URL!;
    const token = process.env.WHATSAPP_API_KEY!;

    // Plantilla sin parámetros
    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: 'recordatorio',       // Nombre exacto de tu plantilla en inglés
        language: { code: 'en' },  // Idioma inglés
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

    const responseBody = await response.text();

    if (!response.ok) {
      let errorDetail = responseBody;
      try {
        const errorJson = JSON.parse(responseBody);
        errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {}
      console.error('❌ WhatsApp API error:', errorDetail);
      throw new Error(`WhatsApp API error: ${errorDetail}`);
    }

    let sentId = null;
    try {
      const okJson = JSON.parse(responseBody);
      sentId = okJson?.messages?.[0]?.id;
    } catch {}

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}