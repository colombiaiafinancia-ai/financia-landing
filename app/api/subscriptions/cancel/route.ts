import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/services/supabase/client-server";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { cancelMercadoPagoSubscription } from "@/services/mercadopago/subscriptions";

export async function POST() {
  try {
    const authSupabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesion para cancelar tu plan" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError || !subscription?.mp_preapproval_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "No encontramos una suscripcion activa o pendiente para cancelar",
        },
        { status: 404 }
      );
    }

    await cancelMercadoPagoSubscription(subscription.mp_preapproval_id);

    const now = new Date().toISOString();

    const { error: updateSubscriptionError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: now,
        updated_at: now,
      })
      .eq("mp_preapproval_id", subscription.mp_preapproval_id);

    if (updateSubscriptionError) {
      console.error(
        "Error actualizando user_subscriptions al cancelar:",
        updateSubscriptionError
      );
    }

    const { error: updateProfileError } = await supabase
      .from("user_profiles")
      .update({
        subscription_status: "cancelled",
        current_plan: "free",
        mp_preapproval_id: null,
      })
      .eq("user_id", user.id);

    if (updateProfileError) {
      console.error("Error actualizando user_profiles al cancelar:", updateProfileError);
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
    });
  } catch (error: any) {
    console.error("Error cancelando suscripcion:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error cancelando suscripcion",
      },
      { status: 500 }
    );
  }
}
