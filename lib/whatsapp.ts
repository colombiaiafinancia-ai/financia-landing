export async function sendWhatsAppMessage(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Numero invalido');
    }

    const url = process.env.WHATSAPP_API_URL!;
    const token = process.env.WHATSAPP_API_KEY!;
    const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE_NAME || 'reminders';
    const templateLanguage = process.env.WHATSAPP_REMINDER_TEMPLATE_LANGUAGE || 'es_CO';
    const templateParams = parseTemplateParams(process.env.WHATSAPP_REMINDER_TEMPLATE_PARAMS || '');

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        ...(templateParams.length > 0
          ? {
              components: [
                {
                  type: 'body',
                  parameters: templateParams.map((param) => ({
                    type: 'text',
                    text: param.text,
                    ...(param.name ? { parameter_name: param.name } : {}),
                  })),
                },
              ],
            }
          : {}),
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
      console.error('WhatsApp API error:', errorDetail);
      throw new Error(`WhatsApp API error: ${errorDetail}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseTemplateParams(value: string): Array<{ name?: string; text: string }> {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (item && typeof item === 'object') {
          return {
            name: item.name || item.parameter_name,
            text: String(item.text ?? item.value ?? ''),
          };
        }
        return { text: String(item) };
      });
    }
  } catch {}

  return trimmed
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) return { text: item };

      return {
        name: item.slice(0, separatorIndex).trim(),
        text: item.slice(separatorIndex + 1).trim(),
      };
    });
}
