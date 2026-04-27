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

    let { data: localSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("mp_preapproval_id", preapprovalId)
      .maybeSingle();

    if (subError || !localSubscription) {
      console.warn("Suscripcion local no encontrada, intentando reconciliar:", {
        preapprovalId,
        subError,
      });

      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("mp_plan_id", mpSubscription.preapproval_plan_id)
        .maybeSingle();

      const payerEmail = String(mpSubscription.payer_email || "").trim();

      const { data: userRecord, error: userError } = await supabase
        .from("usuarios")
        .select("id,gmail")
        .eq("gmail", payerEmail)
        .maybeSingle();

      if (planError || userError || !plan || !userRecord) {
        console.error("No se pudo reconciliar suscripcion hospedada:", {
          preapprovalId,
          payerEmail,
          mpPlanId: mpSubscription.preapproval_plan_id,
          planError,
          userError,
          hasPlan: Boolean(plan),
          hasUser: Boolean(userRecord),
        });

        return NextResponse.json({
          ok: true,
          message:
            "Webhook recibido, pero no se pudo reconciliar con usuario/plan local",
        });
      }

      const { data: insertedSubscription, error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userRecord.id,
          plan_key: plan.plan_key,
          mp_plan_id: plan.mp_plan_id,
          mp_preapproval_id: preapprovalId,
          payer_email: payerEmail,
          external_reference: mpSubscription.external_reference || null,
          status: internalStatus,
          amount: Number(plan.amount),
          currency_id: plan.currency_id,
          started_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insertError || !insertedSubscription) {
        console.error("No se pudo crear suscripcion local desde webhook:", {
          preapprovalId,
          insertError,
        });

        return NextResponse.json({
          ok: true,
          error: "No se pudo crear user_subscriptions desde webhook",
        });
      }

      localSubscription = insertedSubscription;
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
      .eq("user_id", localSubscription.user_id);

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
