import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifica la firma `x-signature` que Mercado Pago envia en cada webhook.
 *
 * Formato del header: `ts=<unix>,v1=<hmac-sha256-hex>`
 * Manifest firmado:   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * (cada parte solo se incluye si esta presente; `data.id` alfanumerico va en minusculas)
 *
 * Docs: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoSignature(req: Request): { ok: boolean; reason?: string } {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, reason: "MERCADOPAGO_WEBHOOK_SECRET no configurado" };
  }

  const signature = req.headers.get("x-signature");
  if (!signature) return { ok: false, reason: "Falta header x-signature" };

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2).map((s) => s?.trim());
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return { ok: false, reason: "x-signature malformado" };

  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const requestId = req.headers.get("x-request-id");

  let manifest = "";
  if (dataId) manifest += `id:${/^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "Firma invalida" };
  }

  return { ok: true };
}
