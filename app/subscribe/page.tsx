import SubscriptionCheckout from "@/components/subscriptions/SubscriptionCheckout";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const planKey = "financia_pro_monthly";

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

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("amount,currency_id")
    .eq("plan_key", planKey)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    throw new Error("No se encontro el plan activo para la suscripcion");
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <SubscriptionCheckout
        userId={user.id}
        payerEmail={payerEmail}
        planKey={planKey}
        amount={Number(plan.amount)}
        currencyId={plan.currency_id}
      />
    </main>
  );
}
