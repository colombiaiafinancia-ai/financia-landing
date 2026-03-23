/**
 * Debe coincidir con el enum Postgres `public.onboarding_status` (Database → Enumerated Types).
 * En tu proyecto los labels llevan espacios en dos valores (como en Supabase).
 */
export const ONBOARDING_STATUS_VALUES = [
  'nuevo',
  'inicio sesion pendiente',
  'verificado',
  'no verificado',
  'completado',
] as const

export type OnboardingStatus = (typeof ONBOARDING_STATUS_VALUES)[number]

export function isOnboardingStatus(v: string): v is OnboardingStatus {
  return (ONBOARDING_STATUS_VALUES as readonly string[]).includes(v)
}

/** Tour guiado del dashboard: solo con estado `verificado` */
export function shouldShowGuidedTourFromDb(status: OnboardingStatus | null): boolean {
  return status === 'verificado'
}
