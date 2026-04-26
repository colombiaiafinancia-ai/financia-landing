import SubscriptionCheckout from "@/components/subscriptions/SubscriptionCheckout";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SubscribePage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <SubscriptionCheckout
        userId={user.id}
        payerEmail={user.email}
        planKey="financia_pro_monthly"
      />
    </main>
  );
}
