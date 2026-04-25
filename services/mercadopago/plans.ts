import {
  MERCADOPAGO_API_BASE_URL,
  getMercadoPagoHeaders,
} from "@/lib/mercadopago";

type CreateMercadoPagoPlanInput = {
  reason: string;
  amount: number;
  currencyId: string;
  frequency: number;
  frequencyType: "days" | "months";
  backUrl: string;
};

export async function createMercadoPagoPlan(input: CreateMercadoPagoPlanInput) {
  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}/preapproval_plan`, {
    method: "POST",
    headers: getMercadoPagoHeaders(),
    body: JSON.stringify({
      reason: input.reason,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.amount,
        currency_id: input.currencyId,
      },
      back_url: input.backUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creando plan en Mercado Pago:", data);

    throw new Error(
      data?.message || "No se pudo crear el plan en Mercado Pago"
    );
  }

  return data;
}