import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/services/supabase/client-server'
import { codigosPromocionalesRepository } from '@/features/codigos-promocionales'
import type { UpdateCodigoPromocionalDTO } from '@/features/codigos-promocionales'

async function assertSuperUser() {
  const supabase = await getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_super_user')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.is_super_user) {
    return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 })
  }

  return null
}

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
