import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/services/supabase/client-server";
import { createMercadoPagoSubscription } from "@/services/mercadopago/subscriptions";

function mapMercadoPagoStatus(status: string) {
  const map: Record<string, string> = {
    authorized: "active",
    pending: "pending",
    paused: "paused",
    cancelled: "cancelled",
  };

  return map[status] || status || "unknown";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userId, planKey, payerEmail, cardTokenId } = body;

    if (!userId || !planKey || !payerEmail || !cardTokenId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan datos: userId, planKey, payerEmail o cardTokenId",
        },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabaseClient();

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("plan_key", planKey)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error("Plan no encontrado o inactivo:", {
        planKey,
        planError,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Plan no encontrado o inactivo",
        },
        { status: 404 }
      );
    }

    if (!plan.mp_plan_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El plan todavía no tiene mp_plan_id. Primero crea el plan en Mercado Pago.",
        },
        { status: 400 }
      );
    }

    const frequencyType = String(plan.frequency_type).trim().toLowerCase();

    if (frequencyType !== "days" && frequencyType !== "months") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "frequency_type inválido. Debe ser exactamente 'days' o 'months'.",
          received: plan.frequency_type,
        },
        { status: 400 }
      );
    }

    const backUrl = process.env.MERCADOPAGO_BACK_URL;

    if (!backUrl || !backUrl.startsWith("https://")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "MERCADOPAGO_BACK_URL debe ser una URL pública con https. No uses localhost.",
        },
        { status: 400 }
      );
    }

    const externalReference = `user:${userId}:plan:${plan.plan_key}`;

    console.log("Debug create subscription:", {
      userId,
      planKey: plan.plan_key,
      mpPlanId: plan.mp_plan_id,
      payerEmail,
      cardTokenIdStart: cardTokenId?.slice(0, 12),
      cardTokenIdLength: cardTokenId?.length,
      accessTokenStart: process.env.MERCADOPAGO_ACCESS_TOKEN?.slice(0, 10),
      backUrl,
      amount: Number(plan.amount),
      currencyId: plan.currency_id,
      frequency: Number(plan.frequency),
      frequencyType,
    });

    const subscription = await createMercadoPagoSubscription({
      preapprovalPlanId: plan.mp_plan_id,
      reason: plan.name,
      externalReference,
      payerEmail,
      cardTokenId,
      amount: Number(plan.amount),
      currencyId: plan.currency_id,
      frequency: Number(plan.frequency),
      frequencyType,
      backUrl,
    });

    const mpStatus = subscription.status || "pending";
    const internalStatus = mapMercadoPagoStatus(mpStatus);

    console.log("Suscripción creada en Mercado Pago:", {
      mpPreapprovalId: subscription.id,
      mpStatus,
      internalStatus,
      externalReference: subscription.external_reference,
    });

    const { error: insertError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_key: plan.plan_key,
        mp_plan_id: plan.mp_plan_id,
        mp_preapproval_id: subscription.id,
        payer_email: payerEmail,
        external_reference: externalReference,
        status: internalStatus,
        amount: Number(plan.amount),
        currency_id: plan.currency_id,
        started_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error guardando suscripción en Supabase:", insertError);

      return NextResponse.json(
        {
          ok: false,
          error:
            "Suscripción creada en Mercado Pago, pero no guardada en Supabase",
          mp_preapproval_id: subscription.id,
        },
        { status: 500 }
      );
    }

    const { error: updateUserError } = await supabase
      .from("user_profiles")
      .update({
        subscription_status: internalStatus,
        current_plan: internalStatus === "active" ? plan.plan_key : "free",
        mp_preapproval_id:
          internalStatus === "active" ? subscription.id : null,
      })
      .eq("id", userId);

    if (updateUserError) {
      console.error("Error actualizando user_profiles:", updateUserError);

      return NextResponse.json(
        {
          ok: false,
          error:
            "Suscripción guardada, pero no se pudo actualizar el perfil del usuario",
          mp_preapproval_id: subscription.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        internalStatus,
        external_reference: subscription.external_reference,
      },
    });
  } catch (error: any) {
    console.error("Error creando suscripción:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error creando suscripción",
      },
      { status: 500 }
    );
  }
}