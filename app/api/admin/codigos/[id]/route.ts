import { NextRequest, NextResponse } from 'next/server'
import { assertSuperUser } from '@/lib/auth/assert-super-user'
import { codigosPromocionalesRepository } from '@/features/codigos-promocionales'
import type { UpdateCodigoPromocionalDTO } from '@/features/codigos-promocionales'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertSuperUser()
  if (denied) return denied

  try {
    const { id } = await params
    const body = await req.json() as UpdateCodigoPromocionalDTO

    if (body.active === undefined) {
      return NextResponse.json({ ok: false, error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const updated = await codigosPromocionalesRepository.update(id, body)
    return NextResponse.json({ ok: true, data: updated })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertSuperUser()
  if (denied) return denied

  try {
    const { id } = await params
    await codigosPromocionalesRepository.delete(id)
    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
