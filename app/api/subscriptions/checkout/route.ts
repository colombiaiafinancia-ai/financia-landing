import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/services/supabase/client-server";
import { createMercadoPagoPendingSubscription } from "@/services/mercadopago/subscriptions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, planKey, payerEmail } = body;

    if (!userId || !planKey || !payerEmail) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos: userId, planKey o payerEmail" },
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
      return NextResponse.json(
        { ok: false, error: "Plan no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const backUrl = process.env.MERCADOPAGO_BACK_URL;

    if (!backUrl || !backUrl.startsWith("https://")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "MERCADOPAGO_BACK_URL debe ser una URL publica con https. No uses localhost ni http.",
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
            "frequency_type invalido. Debe ser exactamente 'days' o 'months'.",
          received: plan.frequency_type,
        },
        { status: 400 }
      );
    }

    const trialFrequency = plan.trial_frequency
      ? Number(plan.trial_frequency)
      : null;
    const trialFrequencyType = plan.trial_frequency_type
      ? String(plan.trial_frequency_type).trim().toLowerCase()
      : null;

    if (
      trialFrequency &&
      trialFrequencyType !== "days" &&
      trialFrequencyType !== "months"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "trial_frequency_type invalido. Debe ser exactamente 'days' o 'months'.",
          received: plan.trial_frequency_type,
        },
        { status: 400 }
      );
    }

    const normalizedTrialFrequencyType =
      trialFrequencyType === "days" || trialFrequencyType === "months"
        ? trialFrequencyType
        : null;

    const externalReference = `user:${userId}:plan:${plan.plan_key}`;

    const subscription = await createMercadoPagoPendingSubscription({
      reason: plan.name,
      externalReference,
      payerEmail,
      amount: Number(plan.amount),
      currencyId: plan.currency_id,
      frequency: Number(plan.frequency),
      frequencyType,
      trialFrequency,
      trialFrequencyType: normalizedTrialFrequencyType,
      backUrl,
    });

    const initPoint = subscription.init_point || subscription.sandbox_init_point;

    if (!subscription.id || !initPoint) {
      console.error(
        "Mercado Pago no devolvio init_point para suscripcion pending:",
        subscription
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Mercado Pago no devolvio un link de checkout para la suscripcion.",
        },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_key: plan.plan_key,
        mp_plan_id: plan.mp_plan_id || null,
        mp_preapproval_id: subscription.id,
        payer_email: payerEmail,
        external_reference: externalReference,
        status: "pending",
        amount: Number(plan.amount),
        currency_id: plan.currency_id,
        started_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error guardando suscripcion pending:", insertError);

      return NextResponse.json(
        {
          ok: false,
          error: "Suscripcion creada en Mercado Pago, pero no guardada en Supabase.",
          mp_preapproval_id: subscription.id,
          init_point: initPoint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      init_point: initPoint,
      mp_preapproval_id: subscription.id,
      external_reference: externalReference,
      plan: {
        plan_key: plan.plan_key,
        mp_plan_id: plan.mp_plan_id || null,
        amount: Number(plan.amount),
        currency_id: plan.currency_id,
      },
    });
  } catch (error: any) {
    console.error("Error creando checkout hospedado:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error creando checkout hospedado",
      },
      { status: 500 }
    );
  }
}
