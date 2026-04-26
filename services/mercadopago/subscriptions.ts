import {
  MERCADOPAGO_API_BASE_URL,
  getMercadoPagoHeaders,
} from "@/lib/mercadopago";
import { randomUUID } from "crypto";

type CreateMercadoPagoSubscriptionInput = {
  preapprovalPlanId: string;
  reason: string;
  externalReference: string;
  payerEmail: string;
  cardTokenId: string;
  amount: number;
  currencyId: string;
  frequency: number;
  frequencyType: "days" | "months";
  backUrl: string;
};

export async function createMercadoPagoSubscription(
  input: CreateMercadoPagoSubscriptionInput
) {
  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}/preapproval`, {
    method: "POST",
    headers: getMercadoPagoHeaders({ idempotencyKey: randomUUID() }),
    body: JSON.stringify({
      preapproval_plan_id: input.preapprovalPlanId,
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      card_token_id: input.cardTokenId,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.amount,
        currency_id: input.currencyId,
      },
      back_url: input.backUrl,
      status: "authorized",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creando suscripción en Mercado Pago:", data);

    const cause = Array.isArray(data?.cause)
      ? data.cause
          .map((item: any) => item?.description || item?.message || item?.code)
          .filter(Boolean)
          .join(" | ")
      : "";

    throw new Error(
      [data?.message, cause].filter(Boolean).join(" - ") ||
        "No se pudo consultar la suscripcion en Mercado Pago"
    );
  }

  return data;
}

export async function getMercadoPagoSubscription(preapprovalId: string) {
  const response = await fetch(
    `${MERCADOPAGO_API_BASE_URL}/preapproval/${preapprovalId}`,
    {
      method: "GET",
      headers: getMercadoPagoHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Error consultando suscripción:", data);

    const cause = Array.isArray(data?.cause)
      ? data.cause
          .map((item: any) => item?.description || item?.message || item?.code)
          .filter(Boolean)
          .join(" | ")
      : "";

    throw new Error(
      [data?.message, cause].filter(Boolean).join(" - ") ||
        "No se pudo crear la suscripcion en Mercado Pago"
    );
  }

  return data;
}
