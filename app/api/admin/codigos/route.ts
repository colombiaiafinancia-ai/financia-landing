import { NextRequest, NextResponse } from 'next/server'
import { assertSuperUser } from '@/lib/auth/assert-super-user'
import { codigosPromocionalesRepository } from '@/features/codigos-promocionales'
import type { CreateCodigoPromocionalDTO, CodigoPromoType } from '@/features/codigos-promocionales'

export async function GET() {
  const denied = await assertSuperUser()
  if (denied) return denied

  try {
    const codes = await codigosPromocionalesRepository.findAll()
    return NextResponse.json({ ok: true, data: codes })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await assertSuperUser()
  if (denied) return denied

  try {
    const body = await req.json() as Partial<CreateCodigoPromocionalDTO>
    const { code, name, description, type, trialDays, discountValue, discountMonths, active } = body

    if (!code?.trim()) {
      return NextResponse.json({ ok: false, error: 'El campo codigo es requerido' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'El campo nombre es requerido' }, { status: 400 })
    }
    const validTypes: CodigoPromoType[] = ['trial', 'percentage']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ ok: false, error: 'Tipo debe ser trial o percentage' }, { status: 400 })
    }
    if (type === 'trial' && (!trialDays || Number(trialDays) <= 0)) {
      return NextResponse.json({ ok: false, error: 'Dias de prueba debe ser mayor a 0' }, { status: 400 })
    }
    if (type === 'percentage' && (!discountValue || Number(discountValue) <= 0)) {
      return NextResponse.json({ ok: false, error: 'Porcentaje de descuento debe ser mayor a 0' }, { status: 400 })
    }

    const created = await codigosPromocionalesRepository.create({
      code: code.trim(),
      name: name.trim(),
      description,
      type,
      trialDays: type === 'trial' ? Number(trialDays) : null,
      discountValue: type === 'percentage' ? Number(discountValue) : null,
      discountMonths: type === 'percentage' && discountMonths ? Number(discountMonths) : null,
      active: active !== false,
    })
    return NextResponse.json({ ok: true, data: created }, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
