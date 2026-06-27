import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/services/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, mpPreapprovalId, fullAmount, currencyId, secret } = body;

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    if (!userId || !mpPreapprovalId || !fullAmount) {
      return NextResponse.json({ ok: false, error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Update Mercado Pago preapproval back to full price
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction_amount: Number(fullAmount) }),
    });

    if (!mpRes.ok) {
      const mpError = await mpRes.text();
      console.error("[discount-expiry] MP update failed:", mpError);
    }

    // Clear discount fields from user profile
    const admin = getSupabaseAdminClient();
    await admin
      .from("user_profiles")
      .update({
        discount_percentage: null,
        discount_months: null,
        discount_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[discount-expiry] Error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Error interno" }, { status: 500 });
  }
}
