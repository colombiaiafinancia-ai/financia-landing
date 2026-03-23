import type { OnboardingStep } from '@/components/dashboard/OnboardingVignette'

const VALID_STEPS: OnboardingStep[] = ['budgets', 'add-transaction', 'whatsapp']

/** Claves por usuario para no mezclar sesiones en el mismo navegador */
export function getOnboardingLocalKeys(userId: string) {
  return {
    completed: `financia_onboarding_guided_v1_completed:${userId}`,
    step: `financia_onboarding_guided_v1_step:${userId}`,
    welcome: `financia_onboarding_guided_v1_welcome_done:${userId}`,
  }
}

export function readStoredStep(userId: string): OnboardingStep {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(getOnboardingLocalKeys(userId).step)
  if (raw && VALID_STEPS.includes(raw as OnboardingStep)) {
    return raw as OnboardingStep
  }
  return 'budgets'
}
