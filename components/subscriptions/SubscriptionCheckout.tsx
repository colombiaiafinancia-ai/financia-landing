"use client";

import { useState } from "react";

type SubscriptionCheckoutProps = {
  userId: string;
  payerEmail: string;
  planKey?: string;
  amount: number;
  currencyId?: string;
};

export default function SubscriptionCheckout({
  userId,
  payerEmail,
  planKey = "financia_pro_monthly",
  amount,
  currencyId = "COP",
}: SubscriptionCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubscribe() {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          planKey,
          payerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.init_point) {
        setMessage(data.error || "No se pudo iniciar el checkout.");
        return;
      }

      window.location.href = data.init_point;
    } catch (error: any) {
      console.error("Error iniciando checkout hospedado:", error);
      setMessage(error?.message || "Error iniciando checkout.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-6 shadow-sm backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Financia Pro</h2>

      <p className="mt-2 text-sm text-white/70">
        Activa tu plan mensual por{" "}
        {new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: currencyId,
          maximumFractionDigits: 0,
        }).format(amount)}
        .
      </p>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isLoading}
        className="mt-6 w-full rounded-md bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Redirigiendo..." : "Suscribirme con Mercado Pago"}
      </button>

      {message && (
        <p className="mt-4 break-words text-sm font-medium text-white">
          {message}
        </p>
      )}
    </div>
  );
}
