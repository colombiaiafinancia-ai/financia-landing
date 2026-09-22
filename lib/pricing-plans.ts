import { Star, Zap, type LucideIcon } from 'lucide-react'

export type PlanTone = 'standard' | 'annual'

export type LandingPlan = {
  id: string
  eyebrow: string
  name: string
  price: string
  priceUsd: number
  oldPrice?: string
  detail: string
  helper?: string
  badge?: string
  features: string[]
  tone: PlanTone
  icon: LucideIcon
  href: string
  highlighted?: boolean
  limited?: boolean
}

export const SUBSCRIBE_PLAN_KEYS = [
  'financia_monthly',
  'financia_annual',
] as const

const PLAN_KEY_TO_ID: Record<string, LandingPlan['id']> = {
  financia_monthly: 'monthly',
  financia_annual: 'annual',
}

export function getLandingPlanByKey(planKey: string): LandingPlan | undefined {
  const id = PLAN_KEY_TO_ID[planKey]
  return LANDING_PLANS.find((plan) => plan.id === id)
}

export const LANDING_PLANS: LandingPlan[] = [
  {
    id: 'monthly',
    eyebrow: 'Mensual',
    name: 'Plan Mensual',
    price: '$4.50',
    priceUsd: 4.50,
    detail: 'USD / usuario / mes',
    features: [
      '30 días de prueba gratis',
      'Acceso completo a la plataforma',
      'Sin compromiso de permanencia',
      'Cobro mes a mes',
      'Cancela cuando quieras',
      'Soporte estándar',
    ],
    tone: 'standard',
    icon: Star,
    href: '/register',
  },
  {
    id: 'annual',
    eyebrow: 'Anual',
    name: 'Plan Anual 20% OFF',
    price: '$43.20',
    priceUsd: 43.20,
    oldPrice: '$54.00',
    detail: 'USD / usuario / año · ~$3.60/mes',
    helper: 'Ahorras USD $10.80 al año',
    badge: 'Más popular',
    features: [
      '30 días de prueba gratis',
      '20% de descuento sobre el precio mensual',
      'Un solo cobro al año, sin sorpresas',
      'Precio congelado por 12 meses',
      'Renovación con el mismo descuento',
      'Soporte estándar incluido',
    ],
    tone: 'annual',
    icon: Zap,
    href: '/register',
    highlighted: true,
  },
]

export const PRICING_COMPARISON_ROWS = [
  ['Prueba gratis', '30 días', '30 días'],
  ['Precio para ti', '$4.50 / mes', '$43.20 / año ($3.60/mes)'],
  ['Modalidad de pago', 'Mensual recurrente', 'Anual recurrente'],
  ['Ahorro vs. mensual', '—', '20%'],
  ['Compromiso', 'Sin compromiso', '12 meses anticipados'],
  ['Disponibilidad', 'Siempre', 'Siempre'],
] as const

export const ANNUAL_PLAN_CONDITIONS = [
  'El descuento aplica sobre el precio de lista vigente.',
  'Pago 100% anticipado; no se admiten pagos parciales.',
  'El plan anual no es reembolsable.',
  'Renovación al precio vigente, conservando el 20% off.',
] as const
