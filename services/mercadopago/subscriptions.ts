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

type CreateMercadoPagoSubscriptionCheckoutInput = {
  preapprovalPlanId: string;
  reason: string;
  externalReference: string;
  payerEmail: string;
  backUrl: string;
};

type CreateMercadoPagoPendingSubscriptionInput = {
  reason: string;
  externalReference: string;
  payerEmail: string;
  amount: number;
  currencyId: string;
  frequency: number;
  frequencyType: "days" | "months";
  trialFrequency?: number | null;
  trialFrequencyType?: "days" | "months" | null;
  backUrl: string;
};

function formatMercadoPagoError(data: any, fallback: string) {
  const cause = Array.isArray(data?.cause)
    ? data.cause
        .map((item: any) => item?.description || item?.message || item?.code)
        .filter(Boolean)
        .join(" | ")
    : "";

  return [data?.message, cause].filter(Boolean).join(" - ") || fallback;
}

export async function createMercadoPagoSubscription(
  input: CreateMercadoPagoSubscriptionInput
) {
  const payload = {
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
  };

  console.log("Payload Mercado Pago preapproval:", {
    ...payload,
    card_token_id: `${input.cardTokenId.slice(0, 12)}...`,
  });

  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}/preapproval`, {
    method: "POST",
    headers: getMercadoPagoHeaders({ idempotencyKey: randomUUID() }),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creando suscripcion en Mercado Pago:", data);
    throw new Error(
      formatMercadoPagoError(data, "No se pudo crear la suscripcion en Mercado Pago")
    );
  }

  return data;
}

export async function createMercadoPagoSubscriptionCheckout(
  input: CreateMercadoPagoSubscriptionCheckoutInput
) {
  const payload = {
    preapproval_plan_id: input.preapprovalPlanId,
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: "pending",
  };

  console.log("Payload Mercado Pago hosted preapproval:", payload);

  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}/preapproval`, {
    method: "POST",
    headers: getMercadoPagoHeaders({ idempotencyKey: randomUUID() }),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creando checkout de suscripcion en Mercado Pago:", data);
    throw new Error(
      formatMercadoPagoError(
        data,
        "No se pudo crear el checkout de suscripcion en Mercado Pago"
      )
    );
  }

  return data;
}

export async function createMercadoPagoPendingSubscription(
  input: CreateMercadoPagoPendingSubscriptionInput
) {
  const autoRecurring: Record<string, any> = {
    frequency: input.frequency,
    frequency_type: input.frequencyType,
    transaction_amount: input.amount,
    currency_id: input.currencyId,
  };

  if (input.trialFrequency && input.trialFrequencyType) {
    autoRecurring.free_trial = {
      frequency: input.trialFrequency,
      frequency_type: input.trialFrequencyType,
    };
  }

  const payload = {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    auto_recurring: autoRecurring,
    back_url: input.backUrl,
    status: "pending",
  };

  console.log("Payload Mercado Pago pending preapproval:", payload);

  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}/preapproval`, {
    method: "POST",
    headers: getMercadoPagoHeaders({ idempotencyKey: randomUUID() }),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creando suscripcion pending en Mercado Pago:", data);
    throw new Error(
      formatMercadoPagoError(
        data,
        "No se pudo crear la suscripcion pending en Mercado Pago"
      )
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
    console.error("Error consultando suscripcion:", data);
    throw new Error(
      formatMercadoPagoError(data, "No se pudo consultar la suscripcion en Mercado Pago")
    );
  }

  return data;
}

export async function cancelMercadoPagoSubscription(preapprovalId: string) {
  const response = await fetch(
    `${MERCADOPAGO_API_BASE_URL}/preapproval/${preapprovalId}`,
    {
      method: "PUT",
      headers: getMercadoPagoHeaders({ idempotencyKey: randomUUID() }),
      body: JSON.stringify({
        status: "cancelled",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Error cancelando suscripcion:", data);
    throw new Error(
      formatMercadoPagoError(data, "No se pudo cancelar la suscripcion en Mercado Pago")
    );
  }

  return data;
}
