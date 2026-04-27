import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/services/supabase/client-server";
import { createMercadoPagoPlan } from "@/services/mercadopago/plans";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { planKey, mpPlanId } = body;

    if (!planKey) {
      return NextResponse.json(
        { ok: false, error: "Falta planKey" },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabaseClient();

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("plan_key", planKey)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { ok: false, error: "Plan no encontrado en Supabase" },
        { status: 404 }
      );
    }

    if (plan.mp_plan_id) {
      return NextResponse.json({
        ok: true,
        message: "El plan ya existe en Mercado Pago",
        mp_plan_id: plan.mp_plan_id,
      });
    }

    if (mpPlanId) {
      const { error: updateError } = await supabase
        .from("subscription_plans")
        .update({
          mp_plan_id: String(mpPlanId).trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("plan_key", planKey);

      if (updateError) {
        return NextResponse.json(
          {
            ok: false,
            error: "No se pudo guardar mp_plan_id en Supabase",
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "mp_plan_id guardado en Supabase",
        mp_plan_id: String(mpPlanId).trim(),
      });
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

    const mpPlan = await createMercadoPagoPlan({
      reason: plan.name,
      amount: Number(plan.amount),
      currencyId: plan.currency_id,
      frequency: Number(plan.frequency),
      frequencyType: plan.frequency_type,
      backUrl,
    });

    const { error: updateError } = await supabase
      .from("subscription_plans")
      .update({
        mp_plan_id: mpPlan.id,
        updated_at: new Date().toISOString(),
      })
      .eq("plan_key", planKey);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Plan creado en Mercado Pago, pero no se guardó en Supabase",
          mp_plan_id: mpPlan.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mp_plan_id: mpPlan.id,
      plan: mpPlan,
    });
  } catch (error: any) {
    console.error("Error en create-plan:", error);

    const errorMessage = error.message || "Error creando plan";
    const isMercadoPagoPolicyError =
      errorMessage.includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES") ||
      errorMessage.includes("At least one policy returned UNAUTHORIZED");

    return NextResponse.json(
      {
        ok: false,
        error: isMercadoPagoPolicyError
          ? "Mercado Pago rechazo la creacion del plan por credenciales o ambiente. Revisa que el access token pertenezca a una cuenta/app habilitada para suscripciones."
          : errorMessage,
      },
      { status: isMercadoPagoPolicyError ? 403 : 500 }
    );
  }
}
