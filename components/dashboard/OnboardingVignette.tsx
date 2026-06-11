'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowRight, ChevronDown, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ONBOARDING_CYAN, ONBOARDING_CYAN_RGB } from '@/components/dashboard/OnboardingSpotlight'

function OnboardingProgressBar({
  stepNumber,
  totalSteps,
  isOnGradient,
}: {
  stepNumber: number
  totalSteps: number
  isOnGradient: boolean
}) {
  const accent = isOnGradient ? '#25D366' : ONBOARDING_CYAN
  const muted = isOnGradient ? 'rgba(255,255,255,0.2)' : `rgba(${ONBOARDING_CYAN_RGB}, 0.2)`

  return (
    <div className="mt-2 flex items-center gap-0.5 sm:gap-1" aria-hidden>
      {Array.from({ length: totalSteps }, (_, i) => {
        const n = i + 1
        const isDone = n < stepNumber
        const isCurrent = n === stepNumber

        return (
          <div key={n} className="flex items-center gap-0.5 sm:gap-1">
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold sm:h-5 sm:w-5 sm:text-[9px]',
                isDone || isCurrent ? 'text-[#0d1a2e]' : 'text-white/35'
              )}
              style={{
                backgroundColor: isDone || isCurrent ? accent : muted,
                boxShadow: isCurrent ? `0 0 10px ${accent}66` : undefined,
              }}
            >
              {n}
            </span>
            {i < totalSteps - 1 && (
              <span
                className="h-0.5 w-3 rounded-full sm:w-5"
                style={{ backgroundColor: n < stepNumber ? accent : muted }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Viñeta compacta para el onboarding guiado in-place.
 */
export function OnboardingVignette({
  stepNumber,
  totalSteps = 4,
  title,
  icon: Icon,
  action,
  tip,
  tipIcon: TipIcon = Lightbulb,
  onSkip,
  variant = 'default',
  compact = false,
}: {
  stepNumber: number
  totalSteps?: number
  title: string
  icon: LucideIcon
  action: string
  tip?: string
  tipIcon?: LucideIcon
  onSkip?: () => void
  variant?: 'default' | 'onGradient'
  compact?: boolean
}) {
  const isOnGradient = variant === 'onGradient'
  const stepLabel = `Paso ${stepNumber} de ${totalSteps}`

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        compact ? 'mb-2 p-2.5' : 'mb-3 p-3',
        isOnGradient
          ? 'border-white/20 bg-black/30 backdrop-blur-sm'
          : 'border-[rgba(34,211,238,0.22)] bg-[#06B6D4]/[0.05] dark:bg-[#06B6D4]/[0.08]'
      )}
      style={
        !isOnGradient
          ? { boxShadow: '0 0 16px rgba(34,211,238,0.08)' }
          : undefined
      }
    >
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            'absolute right-2 top-2 z-[1] rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors sm:text-[11px]',
            isOnGradient
              ? 'border-white/30 bg-white/10 text-white/85 hover:border-white/45 hover:bg-white/15 hover:text-white'
              : 'border-slate-300/80 bg-background/80 text-slate-600 hover:border-[#06B6D4]/35 hover:text-foreground dark:border-white/20 dark:bg-white/[0.07] dark:text-white/70 dark:hover:border-[#06B6D4]/40 dark:hover:text-white'
          )}
        >
          Saltar paso
        </button>
      )}

      <div className={cn('pr-14', compact ? 'mb-1.5' : 'mb-2')}>
        <p
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wide',
            isOnGradient ? 'text-emerald-200/90' : 'text-[#06B6D4]'
          )}
        >
          {stepLabel}
        </p>
        <OnboardingProgressBar
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          isOnGradient={isOnGradient}
        />
      </div>

      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-lg',
            compact ? 'h-7 w-7' : 'h-8 w-8',
            isOnGradient ? 'bg-[#25D366]/25 text-[#25D366]' : 'bg-[#06B6D4]/15 text-[#06B6D4]'
          )}
        >
          <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              'font-semibold leading-snug',
              compact ? 'text-xs' : 'text-sm',
              isOnGradient ? 'text-white' : 'text-foreground'
            )}
          >
            {title}
          </h4>
          <p
            className={cn(
              'mt-0.5 flex items-start gap-1 text-[11px] leading-snug sm:text-xs',
              isOnGradient ? 'text-white/85' : 'text-muted-foreground'
            )}
          >
            <ArrowRight
              className={cn(
                'mt-0.5 h-3 w-3 flex-shrink-0',
                isOnGradient ? 'text-[#25D366]' : 'text-[#06B6D4]'
              )}
            />
            <span>{action}</span>
          </p>
        </div>
      </div>

      {tip && !compact && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/[0.07] px-2 py-1.5">
          <TipIcon className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-300" />
          <p className="text-[10px] leading-snug text-amber-100/85">{tip}</p>
        </div>
      )}
    </div>
  )
}

/** Flecha flotante animada — sin pill de texto (estilo premium). */
export function OnboardingSpotlightArrow({
  align = 'center',
  color = ONBOARDING_CYAN,
  highContrast = false,
  className,
}: {
  align?: 'left' | 'center' | 'right'
  color?: string
  highContrast?: boolean
  className?: string
}) {
  const arrowColor = highContrast ? '#FFFFFF' : color

  return (
    <div
      className={cn(
        'pointer-events-none mb-1 flex w-full flex-col items-center',
        align === 'center' && 'items-center',
        align === 'right' && 'items-end',
        align === 'left' && 'items-start',
        className
      )}
    >
      <span
        className="mb-0.5 block h-2 w-2 animate-pulse rounded-full"
        style={{
          backgroundColor: arrowColor,
          boxShadow: highContrast
            ? '0 0 10px rgba(255,255,255,0.9), 0 0 4px rgba(0,0,0,0.4)'
            : `0 0 10px ${color}99`,
        }}
      />
      <ChevronDown
        className="h-6 w-6 animate-onboarding-arrow sm:h-7 sm:w-7"
        style={{
          color: arrowColor,
          filter: highContrast
            ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.55)) drop-shadow(0 0 8px rgba(255,255,255,0.5))'
            : `drop-shadow(0 0 8px ${color}88)`,
        }}
        strokeWidth={2.5}
      />
    </div>
  )
}

export function getOnboardingButtonSpotlightStyle(color: string = ONBOARDING_CYAN) {
  return {
    boxShadow: `0 0 0 1px rgba(34,211,238,0.35), 0 0 24px rgba(34,211,238,0.2)`,
    animation: 'onboarding-spotlight-pulse 2s ease-in-out infinite',
  } as const
}

export function getOnboardingWhatsAppButtonSpotlightStyle() {
  return {
    boxShadow: '0 0 0 1px rgba(37,211,102,0.5), 0 0 24px rgba(37,211,102,0.35)',
    animation: 'onboarding-spotlight-pulse 2s ease-in-out infinite',
  } as const
}

/** @deprecated Preferir `getOnboardingLocalKeys(userId)` en `@/utils/onboardingLocalStorage` (claves por usuario). */
export const ONBOARDING_STORAGE_KEY = 'financia_onboarding_guided_v1_completed'

/** @deprecated Ver `onboardingLocalStorage` */
export const ONBOARDING_STEP_KEY = 'financia_onboarding_guided_v1_step'

/** @deprecated Ver `onboardingLocalStorage` */
export const ONBOARDING_WELCOME_KEY = 'financia_onboarding_guided_v1_welcome_done'

export type OnboardingStep = 'add-transaction' | 'budgets' | 'whatsapp' | 'notifications' | null
