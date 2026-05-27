import SubscriptionCheckout, { type SubscriptionPlanOption } from "@/components/subscriptions/SubscriptionCheckout";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { SUBSCRIBE_PLAN_KEYS } from "@/lib/pricing-plans";

const planOrder = ["financia_test_weekly", ...SUBSCRIBE_PLAN_KEYS];

export default async function SubscribePage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <SubscriptionCheckout
        userId={user.id}
        payerEmail={payerEmail}
        plans={orderedPlans}
      />
    </main>
  );
}
