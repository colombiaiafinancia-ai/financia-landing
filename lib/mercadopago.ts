export const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en .env.local");
  }

  return token;
}

export function getMercadoPagoHeaders() {
  return {
    Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    "Content-Type": "application/json",
  };
}