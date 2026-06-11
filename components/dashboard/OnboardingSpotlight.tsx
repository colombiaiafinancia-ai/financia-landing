'use client'

import { cn } from '@/lib/utils'

export const ONBOARDING_CYAN = '#22D3EE'
export const ONBOARDING_CYAN_RGB = '34,211,238'

/** Borde y glow suaves para la zona iluminada del tour. */
export function onboardingSpotlightSection(isActive: boolean, className?: string) {
  return cn(
    isActive && 'relative z-[45] pointer-events-auto rounded-2xl',
    isActive &&
      'border border-[rgba(34,211,238,0.25)] shadow-[0_0_20px_rgba(34,211,238,0.12)]',
    className
  )
}

/** Capa oscura tipo Duolingo / Linear sobre el resto de la interfaz. */
export function OnboardingSpotlightOverlay({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[35] bg-black/50 transition-opacity duration-300"
      aria-hidden
      style={{ pointerEvents: 'none' }}
    />
  )
}

/** Título general del recorrido guiado. */
export function OnboardingTourHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(34,211,238,0.2)] bg-[#06B6D4]/[0.06]',
        compact ? 'mb-2 px-3 py-2' : 'mb-4 px-4 py-3'
      )}
    >
      <h2
        className={cn(
          'font-sora font-bold text-foreground',
          compact ? 'text-sm' : 'text-base sm:text-lg'
        )}
      >
        Aprende a usar FinancIA
      </h2>
      <p
        className={cn(
          'text-muted-foreground',
          compact ? 'mt-0.5 text-[11px] leading-snug' : 'mt-0.5 text-xs sm:text-sm'
        )}
      >
        Completa estos 4 pasos para configurar tu cuenta.
      </p>
    </div>
  )
}
