export type CodigoPromoType = 'trial' | 'percentage'

export interface CodigoPromocionalDTO {
  id: string
  code: string
  normalizedCode: string
  name: string
  description: string | null
  type: CodigoPromoType
  trialDays: number | null
  discountValue: number | null
  discountMonths: number | null
  active: boolean
  redemptionsCount: number
  createdAt: string
}

export interface CreateCodigoPromocionalDTO {
  code: string
  name: string
  description?: string
  type: CodigoPromoType
  trialDays?: number | null
  discountValue?: number | null
  discountMonths?: number | null
  active: boolean
}

export interface UpdateCodigoPromocionalDTO {
  active?: boolean
}

export function mapDbRowToCodigoDTO(row: {
  id: string
  code: string
  normalized_code: string
  name: string
  description: string | null
  type: string
  trial_days: number | null
  discount_value: number | null
  discount_months: number | null
  is_active: boolean
  redemptions_count: number
  created_at: string
}): CodigoPromocionalDTO {
  return {
    id: row.id,
    code: row.code,
    normalizedCode: row.normalized_code,
    name: row.name,
    description: row.description,
    type: row.type as CodigoPromoType,
    trialDays: row.trial_days,
    discountValue: row.discount_value !== null ? Number(row.discount_value) : null,
    discountMonths: row.discount_months !== null ? Number(row.discount_months) : null,
    active: row.is_active,
    redemptionsCount: row.redemptions_count,
    createdAt: row.created_at,
  }
}
