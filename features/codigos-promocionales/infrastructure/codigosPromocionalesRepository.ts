import { getSupabaseAdminClient } from '@/services/supabase/admin'
import {
  CodigoPromocionalDTO,
  CreateCodigoPromocionalDTO,
  UpdateCodigoPromocionalDTO,
  mapDbRowToCodigoDTO,
} from '../dto/codigosPromocionalesDTO'

class CodigosPromocionalesRepository {
  private client() {
    return getSupabaseAdminClient()
  }

  async findAll(): Promise<CodigoPromocionalDTO[]> {
    const { data, error } = await this.client()
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map(mapDbRowToCodigoDTO)
  }

  async create(dto: CreateCodigoPromocionalDTO): Promise<CodigoPromocionalDTO> {
    const { data, error } = await this.client()
      .from('promo_codes')
      .insert({
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        type: dto.type,
        trial_days: dto.type === 'trial' ? dto.trialDays : null,
        discount_value: dto.type === 'percentage' ? dto.discountValue : null,
        discount_months: dto.type === 'percentage' ? (dto.discountMonths ?? null) : null,
        is_active: dto.active,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapDbRowToCodigoDTO(data)
  }

  async update(id: string, dto: UpdateCodigoPromocionalDTO): Promise<CodigoPromocionalDTO> {
    const { data, error } = await this.client()
      .from('promo_codes')
      .update({ is_active: dto.active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapDbRowToCodigoDTO(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client()
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') {
        throw new Error('No se puede eliminar un codigo que ya fue utilizado')
      }
      throw new Error(error.message)
    }
  }
}

export const codigosPromocionalesRepository = new CodigosPromocionalesRepository()
