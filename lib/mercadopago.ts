export const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en .env.local");
  }

  return token;
}

type MercadoPagoHeadersOptions = {
  idempotencyKey?: string;
};

export function getMercadoPagoHeaders(options: MercadoPagoHeadersOptions = {}) {
  const token = getMercadoPagoAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (options.idempotencyKey) {
    headers["X-Idempotency-Key"] = options.idempotencyKey;
  }

  if (token.startsWith("TEST-")) {
    headers["X-scope"] = "stage";
  }

  return headers;
}
