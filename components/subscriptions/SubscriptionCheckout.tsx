"use client";

import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

type SubscriptionCheckoutProps = {
  userId: string;
  payerEmail: string;
  planKey?: string;
};

export default function SubscriptionCheckout({
  userId,
  payerEmail,
  planKey = "financia_pro_monthly",
}: SubscriptionCheckoutProps) {
  const cardFormRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initMercadoPago() {
      try {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

        console.log("MP Public Key:", {
          exists: Boolean(publicKey),
          startsWith: publicKey?.slice(0, 8),
          length: publicKey?.length,
        });

        if (!publicKey) {
          setMessage(
            "Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY. Revisa Vercel y haz redeploy."
          );
          return;
        }

        await loadMercadoPago();

        if (!window.MercadoPago) {
          setMessage("Mercado Pago no cargó en el navegador.");
          return;
        }

        const mp = new window.MercadoPago(publicKey, {
          locale: "es-CO",
        });

        cardFormRef.current = mp.cardForm({
          amount: "19900",
          iframe: true,

          form: {
            id: "form-checkout",

            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "Número de tarjeta",
            },

            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/YY",
            },

            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "CVV",
            },

            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Nombre del titular",
            },

            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emisor",
            },

            installments: {
              id: "form-checkout__installments",
              placeholder: "Cuotas",
            },

            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: "Tipo de documento",
            },

            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "Número de documento",
            },

            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "Email",
            },
          },

          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.error("MP onFormMounted error:", error);
                setMessage(`Error montando CardForm: ${JSON.stringify(error)}`);
                return;
              }

              console.log("MP CardForm montado correctamente");
              setIsReady(true);
              setMessage("");
            },

            onReady: () => {
              console.log("MP CardForm ready");
              setIsReady(true);
            },

            onBinChange: (bin: string) => {
              console.log("MP onBinChange:", bin);
            },

            onValidityChange: (error: any, field: string) => {
              console.log("MP onValidityChange:", {
                field,
                error,
              });
            },

            onFetching: (resource: string) => {
              console.log("MP onFetching:", resource);
              return () => {
                console.log("MP fetched:", resource);
              };
            },

            onError: (error: any, event: any) => {
              console.error("MP onError:", {
                error,
                event,
              });

              const readableError =
                Array.isArray(error) && error.length > 0
                  ? error.map((e) => e.message || JSON.stringify(e)).join(" | ")
                  : error?.message || JSON.stringify(error);

              setMessage(`Error Mercado Pago: ${readableError}`);
            },

            onCardTokenReceived: (error: any, token: any) => {
              console.log("MP onCardTokenReceived:", {
                error,
                token,
              });

              if (error) {
                setMessage(
                  `Error creando token: ${
                    error?.message || JSON.stringify(error)
                  }`
                );
              }
            },

            onSubmit: async (event: any) => {
              event.preventDefault();

              try {
                setIsPaying(true);
                setMessage("");

                if (!cardFormRef.current) {
                  setMessage("El formulario de pago todavía no está listo.");
                  return;
                }

                const cardFormData = cardFormRef.current.getCardFormData();

                console.log("MP cardFormData final:", cardFormData);

                const cardTokenId = cardFormData?.token;

                if (!cardTokenId) {
                  setMessage(
                    "No se generó token. Mira la consola para ver onError, onValidityChange y cardFormData."
                  );
                  return;
                }

                const response = await fetch("/api/subscriptions/create", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId,
                    planKey,
                    payerEmail,
                    cardTokenId,
                  }),
                });

                const data = await response.json();

                console.log("Respuesta /api/subscriptions/create:", data);

                if (!response.ok || !data.ok) {
                  setMessage(data.error || "No se pudo crear la suscripción.");
                  return;
                }

                setMessage("Suscripción creada correctamente.");
              } catch (error: any) {
                console.error("Error general onSubmit:", error);
                setMessage(
                  `Error general: ${error?.message || JSON.stringify(error)}`
                );
              } finally {
                setIsPaying(false);
              }
            },
          },
        });
      } catch (error: any) {
        console.error("Error inicializando Mercado Pago:", error);
        setMessage(
          `Error inicializando Mercado Pago: ${
            error?.message || JSON.stringify(error)
          }`
        );
      }
    }

    initMercadoPago();
  }, [userId, payerEmail, planKey]);

  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-6 shadow-sm backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Financia Pro</h2>

      <p className="mt-2 text-sm text-white/70">
        Activa tu plan mensual por $19.900 COP.
      </p>

      <form id="form-checkout" className="mt-6 space-y-4">
        <div
          id="form-checkout__cardNumber"
          className="min-h-11 rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <div
          id="form-checkout__expirationDate"
          className="min-h-11 rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <div
          id="form-checkout__securityCode"
          className="min-h-11 rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <input
          id="form-checkout__cardholderName"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black placeholder:text-gray-500"
          placeholder="Nombre del titular"
          autoComplete="cc-name"
        />

        <select
          id="form-checkout__issuer"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <select
          id="form-checkout__installments"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <select
          id="form-checkout__identificationType"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black"
        />

        <input
          id="form-checkout__identificationNumber"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black placeholder:text-gray-500"
          placeholder="Número de documento"
        />

        <input
          id="form-checkout__cardholderEmail"
          className="w-full rounded-md border border-white/40 bg-white px-3 py-2 text-black placeholder:text-gray-500"
          placeholder="Email"
          defaultValue={payerEmail}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={!isReady || isPaying}
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPaying ? "Procesando..." : "Suscribirme"}
        </button>
      </form>

      {message && (
        <p className="mt-4 break-words text-sm font-medium text-white">
          {message}
        </p>
      )}
    </div>
  );
}
