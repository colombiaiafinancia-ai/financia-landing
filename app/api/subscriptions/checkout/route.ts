import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/services/supabase/client-server";
import { createMercadoPagoPendingSubscription } from "@/services/mercadopago/subscriptions";
import { getEffectiveTrialEndsAt, PROMOTIONAL_TRIAL_END_LABEL } from "@/lib/trial";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      return NextResponse.json(
        { ok: false, error: "Usuario no autorizado" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("trial_ends_at, discount_percentage, discount_months, discount_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const effectiveTrialEndsAt = getEffectiveTrialEndsAt(profile?.trial_ends_at || null);

    if (effectiveTrialEndsAt) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Tu prueba gratis sigue activa hasta el ${PROMOTIONAL_TRIAL_END_LABEL}. No necesitas pagar ni buscar descuentos en Mercado Pago.`,
        },
        { status: 409 }
      );
    }

    const discountEndsAt = profile?.discount_ends_at ? new Date(profile.discount_ends_at) : null;
    const discountExpired = discountEndsAt ? discountEndsAt.getTime() < Date.now() : false;
    const discountPct = profile?.discount_percentage && !discountExpired ? Number(profile.discount_percentage) : 0;
    const discountMonths = profile?.discount_months ? Number(profile.discount_months) : null;

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
    const isDev = process.env.NODE_ENV === "development";

    if (!backUrl || (!backUrl.startsWith("https://") && !isDev)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "MERCADOPAGO_BACK_URL debe ser una URL publica con https. No uses localhost ni http.",
        },
        { status: 400 }
      );
    }

    const resolvedBackUrl = backUrl.startsWith("https://")
      ? backUrl
      : `http://localhost:${process.env.PORT || 3000}/dashboard`;

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

    const externalReference = `user:${userId}:plan:${plan.plan_key}`;

    // COP prices sent to Mercado Pago — display stays in USD, MP always receives COP
    const COP_PRICES: Record<string, number> = {
      financia_monthly: 19000,
      financia_annual: 182000,
      financia_founder_monthly: 17000,
    }
    const baseAmountCOP = COP_PRICES[planKey] ?? Math.round(Number(plan.amount) * 4200)
    const finalAmount = discountPct > 0
      ? Math.max(1600, Math.round(baseAmountCOP * (1 - discountPct / 100)))
      : baseAmountCOP;

    const subscription = await createMercadoPagoPendingSubscription({
      reason: plan.name,
      externalReference,
      payerEmail,
      amount: finalAmount,
      currencyId: 'COP',
      frequency: Number(plan.frequency),
      frequencyType,
      backUrl: resolvedBackUrl,
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
        amount: finalAmount,
        currency_id: 'COP',
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

    // If discount is time-limited, schedule a QStash job to revert to full price when it expires
    if (discountMonths && discountPct > 0) {
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + discountMonths);

      const appUrl = process.env.APP_URL;
      const qstashUrl = process.env.QSTASH_URL;
      const qstashToken = process.env.QSTASH_TOKEN;

      if (appUrl && qstashUrl && qstashToken) {
        await fetch(`${qstashUrl}/v2/publish/${appUrl}/api/webhooks/discount-expiry`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            "Upstash-Not-Before": String(Math.floor(endsAt.getTime() / 1000)),
          },
          body: JSON.stringify({
            userId,
            mpPreapprovalId: subscription.id,
            fullAmount: baseAmountCOP,
            currencyId: 'COP',
            secret: process.env.CRON_SECRET,
          }),
        }).catch((err) => console.error("Error scheduling discount expiry job:", err));

        await supabase
          .from("user_profiles")
          .update({ discount_ends_at: endsAt.toISOString() })
          .eq("user_id", userId);
      }
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
