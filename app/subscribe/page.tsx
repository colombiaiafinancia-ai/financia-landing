import SubscriptionCheckout, { type SubscriptionPlanOption } from "@/components/subscriptions/SubscriptionCheckout";
import { isRefreshTokenError } from "@/services/supabase/types";
import { createSupabaseClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SUBSCRIBE_PLAN_KEYS } from "@/lib/pricing-plans";

const planOrder = [...SUBSCRIBE_PLAN_KEYS];

export default async function SubscribePage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && isRefreshTokenError(userError)) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (!user?.id || !user.email) {
    redirect("/login");
  }

  const payerEmail =
    process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim() || user.email;

  const { data: plans, error: plansError } = await supabase
    .from("subscription_plans")
    .select("plan_key,name,description,amount,currency_id,frequency,frequency_type")
    .in("plan_key", planOrder)
    .eq("is_active", true);

  if (plansError || !plans || plans.length === 0) {
    throw new Error("No se encontraron planes activos para la suscripcion");
  }

  const orderedPlans = [...plans]
    .sort((a, b) => planOrder.indexOf(a.plan_key) - planOrder.indexOf(b.plan_key))
    .map((plan) => ({
      planKey: plan.plan_key,
      name: plan.name,
      description: plan.description,
      amount: Number(plan.amount),
      currencyId: plan.currency_id,
      frequency: Number(plan.frequency),
      frequencyType: plan.frequency_type,
    })) satisfies SubscriptionPlanOption[];

  return (
    <main
      className="min-h-screen px-[6%] py-10 text-white sm:py-12"
      style={{ background: "#0d1a2e" }}
    >
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <span className="hidden text-xs font-semibold uppercase tracking-[2px] text-cyan-300/80 sm:inline">
          7 dias gratis
        </span>
      </header>
      <SubscriptionCheckout
        userId={user.id}
        payerEmail={payerEmail}
        plans={orderedPlans}
      />
    </main>
  );
}
