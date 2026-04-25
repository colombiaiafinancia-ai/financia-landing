import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { getMercadoPagoSubscription } from "@/services/mercadopago/subscriptions";

function mapMercadoPagoStatus(status: string) {
  const map: Record<string, string> = {
    authorized: "active",
    pending: "pending",
    paused: "paused",
    cancelled: "cancelled",
  };

  return map[status] || "unknown";
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

    const body = await req.json().catch(() => ({}));

    const type =
      body?.type ||
      body?.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic");

    const preapprovalId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    console.log("Webhook Mercado Pago recibido:", {
      type,
      preapprovalId,
      body,
    });

    if (!preapprovalId) {
      return NextResponse.json({
        ok: true,
        message: "Webhook recibido sin preapprovalId",
      });
    }

    if (type && !String(type).includes("preapproval")) {
      return NextResponse.json({
        ok: true,
        message: "Evento ignorado",
        type,
      });
    }

    const mpSubscription = await getMercadoPagoSubscription(preapprovalId);

    const internalStatus = mapMercadoPagoStatus(mpSubscription.status);

    const supabase = getSupabaseAdminClient();

    const { data: localSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("mp_preapproval_id", preapprovalId)
      .single();

    if (subError || !localSubscription) {
      console.error("Suscripción local no encontrada:", {
        preapprovalId,
        subError,
      });

      return NextResponse.json({
        ok: true,
        message: "Suscripción local no encontrada",
      });
    }

    const { error: updateSubscriptionError } = await supabase
      .from("user_subscriptions")
      .update({
        status: internalStatus,
        updated_at: new Date().toISOString(),
        cancelled_at:
          internalStatus === "cancelled" ? new Date().toISOString() : null,
      })
      .eq("mp_preapproval_id", preapprovalId);

    if (updateSubscriptionError) {
      console.error(
        "Error actualizando user_subscriptions:",
        updateSubscriptionError
      );

      return NextResponse.json({
        ok: true,
        error: "No se pudo actualizar user_subscriptions",
      });
    }

    const { error: updateUserError } = await supabase
      .from("user_profiles")
      .update({
        subscription_status: internalStatus,
        current_plan:
          internalStatus === "active" ? localSubscription.plan_key : "free",
        mp_preapproval_id:
          internalStatus === "active" ? preapprovalId : null,
      })
      .eq("id", localSubscription.user_id);

    if (updateUserError) {
      console.error("Error actualizando user_profiles:", updateUserError);

      return NextResponse.json({
        ok: true,
        error: "No se pudo actualizar user_profiles",
      });
    }

    return NextResponse.json({
      ok: true,
      status: internalStatus,
    });
  } catch (error: any) {
    console.error("Error en webhook de suscripciones:", error);

    return NextResponse.json({
      ok: true,
      error: error.message || "Error procesando webhook",
    });
  }
}