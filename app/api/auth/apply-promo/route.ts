import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/services/supabase/client-server'
import { getSupabaseAdminClient } from '@/services/supabase/admin'

export async function POST() {
  const supabase = await getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const promoCode: string | null = (user.user_metadata?.promo_code as string | undefined) ?? null
  if (!promoCode) return NextResponse.json({ ok: true, applied: false })

  const admin = getSupabaseAdminClient()

  // Idempotency: skip if already redeemed
  const { data: existingRedemption } = await admin
    .from('promo_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingRedemption) return NextResponse.json({ ok: true, applied: false })

  const { data: promo, error: promoError } = await admin
    .from('promo_codes')
    .select('id, type, trial_days, discount_value, discount_months, redemptions_count, is_active')
    .eq('normalized_code', promoCode)
    .maybeSingle()

  if (promoError || !promo || !promo.is_active) {
    return NextResponse.json({ ok: true, applied: false })
  }

  if (promo.type === 'trial') {
    const { data: redemption, error: redemptionError } = await admin.rpc('redeem_promo_code', {
      p_user_id: user.id,
      p_code: promoCode,
      p_email: user.email ?? null,
    })
    const result = Array.isArray(redemption) ? redemption[0] : redemption
    if (redemptionError || !result?.ok) {
      console.error('[apply-promo] RPC error:', redemptionError || result)
      return NextResponse.json({ ok: false, error: 'No se pudo aplicar el codigo' }, { status: 500 })
    }
  } else if (promo.type === 'percentage') {
    await admin
      .from('user_profiles')
      .update({
        discount_percentage: promo.discount_value,
        discount_months: promo.discount_months ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    const { error: insertError } = await admin.from('promo_redemptions').insert({
      promo_code_id: promo.id,
      user_id: user.id,
      email: user.email ?? null,
      type: 'percentage',
      discount_value: promo.discount_value,
    })
    if (insertError && insertError.code !== '23505') {
      console.error('[apply-promo] Insert error:', insertError)
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
    }

    await admin
      .from('promo_codes')
      .update({ redemptions_count: promo.redemptions_count + 1, updated_at: new Date().toISOString() })
      .eq('id', promo.id)
  }

  return NextResponse.json({ ok: true, applied: true })
}
