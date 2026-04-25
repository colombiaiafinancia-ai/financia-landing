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
    let mounted = true;

    async function initMercadoPago() {
      try {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

        if (!publicKey || publicKey.trim() === "") {
          setMessage(
            "Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY. Revisa Vercel Environment Variables y haz redeploy."
          );
          return;
        }

        await loadMercadoPago();

        if (!window.MercadoPago) {
          setMessage("No se pudo cargar Mercado Pago en el navegador.");
          return;
        }

        if (!mounted) return;

        const mp = new window.MercadoPago(publicKey, {
          locale: "es-CO",
        });

        cardFormRef.current = mp.cardForm({
          amount: "19900",
          iframe: false,

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
              placeholder: "Código de seguridad",
            },

            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Nombre del titular",
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
                console.error("Error montando CardForm:", error);
                setMessage("No se pudo cargar el formulario de pago.");
                return;
              }

              setIsReady(true);
              setMessage("");
            },

            onSubmit: async (event: any) => {
              event.preventDefault();

              try {
                setIsPaying(true);
                setMessage("");

                if (!cardFormRef.current) {
                  setMessage("El formulario de pago aún no está listo.");
                  return;
                }

                const cardFormData = cardFormRef.current.getCardFormData();

                console.log("Mercado Pago cardFormData:", cardFormData);

                const cardTokenId = cardFormData?.token;

                if (!cardTokenId) {
                  setMessage(
                    "No se pudo generar el token de la tarjeta. Revisa los datos de prueba y la Public Key."
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

                if (!response.ok || !data.ok) {
                  console.error("Error creando suscripción:", data);
                  setMessage(data.error || "No se pudo crear la suscripción.");
                  return;
                }

                setMessage("Suscripción creada correctamente.");
              } catch (error) {
                console.error("Error procesando suscripción:", error);
                setMessage("Ocurrió un error procesando la suscripción.");
              } finally {
                setIsPaying(false);
              }
            },

            onFetching: (resource: string) => {
              console.log("Mercado Pago fetching:", resource);
            },
          },
        });
      } catch (error) {
        console.error("Error inicializando Mercado Pago:", error);
        setMessage("Error inicializando Mercado Pago.");
      }
    }

    initMercadoPago();

    return () => {
      mounted = false;
    };
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

      {message && <p className="mt-4 text-sm font-medium text-white">{message}</p>}

      {!isReady && !message && (
        <p className="mt-4 text-sm text-white/60">
          Cargando formulario de pago...
        </p>
      )}
    </div>
  );
}