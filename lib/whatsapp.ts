// Aquí pondrás tu lógica real de envío de WhatsApp
export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Ejemplo: tu HTTP request existente (ajusta la URL y headers)
    const response = await fetch(process.env.WHATSAPP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: String(error) };
  }
}