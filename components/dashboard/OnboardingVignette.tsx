'use client'

import { cn } from '@/lib/utils'

/**
 * Viñeta pequeña para el onboarding guiado in-place.
 * Se muestra encima o al lado del bloque correspondiente, sin overlay.
 */
export function OnboardingVignette({
  stepLabel,
  title,
  bullets,
  onSkip,
  variant = 'default',
}: {
  stepLabel: string
  title: string
  bullets: string[]
  onSkip?: () => void
  /** Sobre fondos oscuros / degradado (p. ej. tarjeta WhatsApp): texto claro legible */
  variant?: 'default' | 'onGradient'
}) {
  const isOnGradient = variant === 'onGradient'

  return (
    <div
      className={cn(
        'mb-4 rounded-xl border p-4',
        isOnGradient
          ? 'border-white/30 bg-black/20 backdrop-blur-sm'
          : 'border-primary/30 bg-primary/5 dark:bg-primary/10'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={cn(
              'mb-1 text-xs font-medium uppercase tracking-wide',
              isOnGradient ? 'text-emerald-100' : 'text-primary'
            )}
          >
            {stepLabel}
          </p>
          <h4
            className={cn(
              'mb-2 text-sm font-semibold',
              isOnGradient ? 'text-white' : 'text-foreground'
            )}
          >
            {title}
          </h4>
          <ul
            className={cn(
              'space-y-1.5 text-xs leading-relaxed',
              isOnGradient ? 'text-white/95' : 'text-muted-foreground'
            )}
          >
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full',
                    isOnGradient ? 'bg-white' : 'bg-primary'
                  )}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className={cn(
              'flex-shrink-0 text-xs underline',
              isOnGradient
                ? 'text-white/90 hover:text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Omitir
          </button>
        )}
      </div>
    </div>
  )
}

/** @deprecated Preferir `getOnboardingLocalKeys(userId)` en `@/utils/onboardingLocalStorage` (claves por usuario). */
export const ONBOARDING_STORAGE_KEY = 'financia_onboarding_guided_v1_completed'

/** @deprecated Ver `onboardingLocalStorage` */
export const ONBOARDING_STEP_KEY = 'financia_onboarding_guided_v1_step'

/** @deprecated Ver `onboardingLocalStorage` */
export const ONBOARDING_WELCOME_KEY = 'financia_onboarding_guided_v1_welcome_done'

export type OnboardingStep = 'add-transaction' | 'budgets' | 'whatsapp' | null
