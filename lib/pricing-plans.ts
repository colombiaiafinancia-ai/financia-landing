import { Crown, Star, Zap, type LucideIcon } from 'lucide-react'
import { PROMOTIONAL_TRIAL_END_LABEL } from '@/lib/trial'

export type PlanTone = 'standard' | 'annual' | 'founder'

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
  'financia_founder_monthly',
] as const

const PLAN_KEY_TO_ID: Record<string, LandingPlan['id']> = {
  financia_monthly: 'monthly',
  financia_annual: 'annual',
  financia_founder_monthly: 'founders',
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
      `Gratis hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`,
      'Acceso completo a la plataforma',
      'Sin compromiso de permanencia',
      'Cobro mes a mes',
      'Cancela cuando quieras',
      'Soporte estándar',
    ],
    tone: 'standard',
    icon: Star,
    href: '/subscribe',
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
      `Gratis hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`,
      '20% de descuento sobre el precio mensual',
      'Un solo cobro al año, sin sorpresas',
      'Precio congelado por 12 meses',
      'Renovación con el mismo descuento',
      'Soporte estándar incluido',
    ],
    tone: 'annual',
    icon: Zap,
    href: '/subscribe',
    highlighted: true,
  },
  {
    id: 'founders',
    eyebrow: 'Fundadores',
    name: 'Founders 100',
    price: '$4.00',
    priceUsd: 4.00,
    oldPrice: '$4.50',
    detail: 'USD / usuario / mes · por 12 meses',
    helper: 'Solo 100 cupos en 2026',
    badge: 'Cupo limitado',
    features: [
      `Gratis hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`,
      'Precio especial de fundador por 12 meses',
      'Acceso anticipado a nuevas funciones',
      'Canal directo con el equipo de producto',
      'Mención en la comunidad de fundadores',
      'Al cierre del año pasas a Plan Anual o Mensual',
    ],
    tone: 'founder',
    icon: Crown,
    href: '/subscribe',
    limited: true,
  },
]

export const PRICING_COMPARISON_ROWS = [
  ['Prueba gratis', `Hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`, `Hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`, `Hasta el ${PROMOTIONAL_TRIAL_END_LABEL}`],
  ['Precio para ti', '$4.50 / mes', '$43.20 / año ($3.60/mes)', '$4.00 / mes'],
  ['Modalidad de pago', 'Mensual recurrente', 'Pago único anual', 'Mensual recurrente'],
  ['Ahorro vs. mensual', '—', '20%', '~11%'],
  ['Duración del beneficio', 'Indefinido', '12 meses (renovable)', '12 meses (no renovable)'],
  ['Compromiso', 'Sin compromiso', '12 meses anticipados', 'Pago mes a mes'],
  ['Disponibilidad', 'Siempre', 'Siempre durante 2026', 'Solo primeros 100 usuarios'],
] as const

export const ANNUAL_PLAN_CONDITIONS = [
  'El descuento aplica sobre el precio de lista vigente.',
  'Pago 100% anticipado; no se admiten pagos parciales.',
  'El plan anual no es reembolsable.',
  'Renovación al precio vigente, conservando el 20% off.',
] as const

export const FOUNDERS_PLAN_CONDITIONS = [
  'Cupos limitados a los primeros 100 clientes en 2026.',
  'Una vez agotado el cupo, la promoción cierra de forma definitiva.',
  'Al cumplir 12 meses, el cliente pasa al Plan Mensual o Anual al precio vigente.',
  'No combinable con otras promociones.',
] as const
