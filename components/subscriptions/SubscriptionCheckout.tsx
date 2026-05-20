"use client";

import { useMemo, useState } from "react";
import { Check, Crown, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubscriptionPlanOption = {
  planKey: string;
  name: string;
  description: string | null;
  amount: number;
  currencyId: string;
  frequency: number;
  frequencyType: string;
};

type SubscriptionCheckoutProps = {
  userId: string;
  payerEmail: string;
  plans: SubscriptionPlanOption[];
};

const planDetails: Record<
  string,
  {
    eyebrow: string;
    title: string;
    price: string;
    oldPrice?: string;
    detail: string;
    badge?: string;
    helper?: string;
    features: string[];
    tone: "standard" | "annual" | "founder" | "test";
    icon: typeof Star;
  }
> = {
  financia_test_weekly: {
    eyebrow: "Prueba",
    title: "Plan Prueba",
    price: "$2.000 COP",
    detail: "Cobro cada 7 dias",
    badge: "Test",
    helper: "Solo para validar suscripciones.",
    features: [
      "Cobro semanal de prueba",
      "Monto bajo para validar Mercado Pago",
      "Acceso completo durante la prueba",
    ],
    tone: "test",
    icon: Star,
  },
  financia_monthly: {
    eyebrow: "Mensual",
    title: "Plan Mensual",
    price: "$3.50",
    detail: "USD / usuario / mes",
    features: [
      "Acceso completo a la plataforma",
      "Sin compromiso de permanencia",
      "Cobro mes a mes",
      "Cancela cuando quieras",
      "Soporte estandar",
    ],
    tone: "standard",
    icon: Star,
  },
  financia_annual: {
    eyebrow: "Anual",
    title: "Plan Anual 30% OFF",
    price: "$29.40",
    oldPrice: "$42.00",
    detail: "USD / usuario / ano - ~$2.45/mes",
    badge: "Mas popular",
    helper: "Ahorras USD $12.60 al ano",
    features: [
      "30% de descuento sobre el precio mensual",
      "Un solo cobro al ano, sin sorpresas",
      "Precio congelado por 12 meses",
      "Renovacion con el mismo descuento",
      "Soporte estandar incluido",
    ],
    tone: "annual",
    icon: Zap,
  },
  financia_founder_monthly: {
    eyebrow: "Fundadores",
    title: "Founders 100",
    price: "$2.46",
    oldPrice: "$3.50",
    detail: "USD / usuario / mes - por 12 meses",
    badge: "Cupo limitado",
    helper: "Solo 100 cupos en 2026",
    features: [
      "Precio especial de fundador por 12 meses",
      "Acceso anticipado a nuevas funciones",
      "Canal directo con el equipo de producto",
      "Mencion en la comunidad de fundadores",
      "Al cierre del ano pasas a Plan Anual o Mensual",
    ],
    tone: "founder",
    icon: Crown,
  },
  financia_founder_annual: {
    eyebrow: "Fundadores anual",
    title: "Founder Anual",
    price: "$27.06",
    oldPrice: "$29.52",
    detail: "USD / ano - pagas 11 meses",
    badge: "1 mes gratis",
    helper: "Founder anual con un mes gratis",
    features: [
      "12 meses de precio fundador",
      "Un solo pago anual",
      "Un mes gratis frente al Founder mensual",
      "Canal directo con el equipo de producto",
      "Precio especial no renovable",
    ],
    tone: "founder",
    icon: Crown,
  },
};

const comparisonRows = [
  ["Precio para ti", "$3.50 / mes", "$29.40 / ano ($2.45/mes)", "$2.46 / mes", "$27.06 / ano"],
  ["Modalidad de pago", "Mensual recurrente", "Pago unico anual", "Mensual recurrente", "Pago unico anual"],
  ["Ahorro vs. mensual", "-", "30%", "~30%", "~35%"],
  ["Duracion del beneficio", "Indefinido", "12 meses renovable", "12 meses no renovable", "12 meses no renovable"],
  ["Compromiso", "Sin compromiso", "12 meses anticipados", "Pago mes a mes", "12 meses anticipados"],
  ["Disponibilidad", "Siempre", "Siempre durante 2026", "Solo primeros 100 usuarios", "Solo primeros 100 usuarios"],
];

function formatCheckoutAmount(amount: number, currencyId: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currencyId,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SubscriptionCheckout({
  userId,
  payerEmail,
  plans,
}: SubscriptionCheckoutProps) {
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const visiblePlans = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        details: planDetails[plan.planKey] || {
          eyebrow: "Plan",
          title: plan.name,
          price: formatCheckoutAmount(plan.amount, plan.currencyId),
          detail: "Plan de suscripcion",
          features: ["Acceso a FinancIA"],
          tone: "standard" as const,
          icon: Star,
        },
      })),
    [plans]
  );

  const paidPlans = visiblePlans.filter((plan) => plan.planKey !== "financia_test_weekly");
  const testPlan = visiblePlans.find((plan) => plan.planKey === "financia_test_weekly");

  async function handleSubscribe(planKey: string) {
    try {
      setLoadingPlanKey(planKey);
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
      setLoadingPlanKey(null);
    }
  }

  function PlanCard({ plan }: { plan: (typeof visiblePlans)[number] }) {
    const Icon = plan.details.icon;
    const isLoading = loadingPlanKey === plan.planKey;

    return (
      <article
        className={cn(
          "relative flex min-h-[27rem] flex-col rounded-xl border p-4 shadow-sm",
          plan.details.tone === "founder"
            ? "border-amber-400 bg-amber-50 text-[#1f3654]"
            : plan.details.tone === "annual"
              ? "border-[#1f4e7a] bg-[#eaf4fb] text-[#1f3654]"
              : plan.details.tone === "test"
                ? "border-dashed border-slate-300 bg-slate-50 text-[#1f3654]"
                : "border-slate-300 bg-white text-[#1f3654]"
        )}
      >
        {plan.details.badge && (
          <span
            className={cn(
              "absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase",
              plan.details.tone === "founder"
                ? "bg-amber-500 text-white"
                : plan.details.tone === "test"
                  ? "bg-slate-700 text-white"
                  : "bg-[#1f4e7a] text-white"
            )}
          >
            {plan.details.badge}
          </span>
        )}

        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f4e7a]/10">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-bold uppercase text-slate-500">{plan.details.eyebrow}</p>
        <h2 className="text-xl font-bold leading-tight">{plan.details.title}</h2>

        <div className="mt-3">
          {plan.details.oldPrice && (
            <p className="text-sm font-semibold text-slate-400 line-through">{plan.details.oldPrice}</p>
          )}
          <p className="text-4xl font-black leading-none text-[#1f4e7a]">{plan.details.price}</p>
          <p className="mt-1 text-xs text-slate-600">{plan.details.detail}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Cobro Mercado Pago: {formatCheckoutAmount(plan.amount, plan.currencyId)}
          </p>
        </div>

        {plan.details.helper && (
          <p
            className={cn(
              "mt-3 rounded px-2 py-1 text-xs font-bold",
              plan.details.tone === "founder"
                ? "bg-amber-200 text-amber-900"
                : "bg-[#1f4e7a]/10 text-[#1f4e7a]"
            )}
          >
            {plan.details.helper}
          </p>
        )}

        <ul className="mt-5 flex-1 space-y-2 border-t border-slate-200 pt-4 text-xs">
          {plan.details.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1f4e7a]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => handleSubscribe(plan.planKey)}
          disabled={Boolean(loadingPlanKey)}
          className={cn(
            "mt-5 w-full rounded-lg px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
            plan.details.tone === "founder"
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-[#1f4e7a] text-white hover:bg-[#173c61]"
          )}
        >
          {isLoading ? "Redirigiendo..." : "Elegir plan"}
        </button>
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-7xl rounded-xl bg-white p-5 text-[#1f3654] shadow-2xl sm:p-7">
      <header className="mb-2 flex items-end justify-between border-b-2 border-[#1f4e7a] pb-2">
        <div>
          <p className="text-3xl font-black tracking-tight text-[#1f4e7a]">FinancIA</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#1f4e7a]">Planes 2026</p>
          <p className="text-xs text-slate-500">Tu asistente financiero impulsado por IA</p>
        </div>
      </header>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-[#1f4e7a] sm:text-4xl">
          Elige el plan que mejor se adapta a ti
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-600">
          Sin permanencia minima en el plan mensual. Cancela cuando quieras. Soporte y actualizaciones incluidas en todos los planes.
        </p>
      </div>

      {testPlan && (
        <div className="mb-5">
          <PlanCard plan={testPlan} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {paidPlans.map((plan) => (
          <PlanCard key={plan.planKey} plan={plan} />
        ))}
      </div>

      <section className="mt-7">
        <h3 className="mb-3 text-lg font-bold text-[#1f4e7a]">Comparativo rapido</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#1f4e7a] text-white">
                <th className="px-3 py-2 text-left"> </th>
                <th className="px-3 py-2 text-left">Plan Mensual</th>
                <th className="px-3 py-2 text-left">Plan Anual 30% OFF</th>
                <th className="px-3 py-2 text-left">Founders 100</th>
                <th className="px-3 py-2 text-left">Founder Anual</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-200 odd:bg-slate-50">
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className={cn("px-3 py-2", index === 0 && "font-bold")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="border-l-4 border-[#1f4e7a] bg-slate-100 p-4 text-xs">
          <h4 className="mb-2 font-bold uppercase text-[#1f4e7a]">Condiciones del plan anual</h4>
          <ul className="space-y-1 text-slate-600">
            <li>El descuento aplica sobre el precio de lista vigente.</li>
            <li>Pago 100% anticipado; no se admiten pagos parciales.</li>
            <li>El plan anual no es reembolsable.</li>
            <li>Renovacion al precio vigente, conservando el 30% off.</li>
          </ul>
        </div>
        <div className="border-l-4 border-[#1f4e7a] bg-slate-100 p-4 text-xs">
          <h4 className="mb-2 font-bold uppercase text-[#1f4e7a]">Sobre Founders 100</h4>
          <ul className="space-y-1 text-slate-600">
            <li>Cupos limitados a los primeros 100 clientes en 2026.</li>
            <li>Una vez agotado el cupo, la promocion cierra de forma definitiva.</li>
            <li>Al cumplir 12 meses, el cliente pasa al Plan Mensual o Anual al precio vigente.</li>
            <li>No combinable con otras promociones.</li>
          </ul>
        </div>
      </section>

      {message && (
        <p className="mx-auto mt-6 max-w-2xl rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <footer className="mt-5 flex flex-col gap-1 border-t border-[#1f4e7a] pt-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>FinancIA - Planes vigentes 2026 - Precios en USD</span>
        <span className="font-bold text-[#1f4e7a]">Listo para empezar? Contactanos hoy</span>
      </footer>
    </div>
  );
}
