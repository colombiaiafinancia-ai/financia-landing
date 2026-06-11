'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LucideIcon } from 'lucide-react'
import { Bell, Check, MessageCircle, PiggyBank, Receipt, Sparkles, TrendingUp, Wallet } from 'lucide-react'

const BRAND = {
  navy: '#0d1a2e',
  cyan: '#06B6D4',
  cyanGlow: 'rgba(6,182,212,0.35)',
  whatsapp: '#25D366',
} as const

type TourStep = {
  label: string
  icon: LucideIcon
  accent: string
  iconClass: string
  badge?: LucideIcon
  whatsapp?: boolean
}

const TOUR_STEPS: TourStep[] = [
  {
    label: 'Define Presupuesto',
    icon: PiggyBank,
    accent: 'from-[#06B6D4]/25 to-cyan-400/10',
    iconClass: 'text-[#06B6D4]',
    badge: TrendingUp,
  },
  {
    label: 'Registra Transacciones',
    icon: Receipt,
    accent: 'from-[#06B6D4]/20 to-sky-400/10',
    iconClass: 'text-cyan-200',
  },
  {
    label: 'Activa Recordatorios',
    icon: Bell,
    accent: 'from-[#06B6D4]/25 to-teal-400/10',
    iconClass: 'text-[#5ce1e6]',
    badge: Check,
  },
  {
    label: 'Conecta Chat de IA',
    icon: MessageCircle,
    accent: 'from-[#25D366]/30 to-[#06B6D4]/15',
    iconClass: 'text-white',
    whatsapp: true,
  },
]

interface OnboardingWelcomeModalProps {
  open: boolean
  onNext: () => void
  onSkip: () => void
}

export function OnboardingWelcomeModal({
  open,
  onNext,
  onSkip,
}: OnboardingWelcomeModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-[540px] overflow-hidden rounded-[28px] border-[#06B6D4]/45 p-0 text-slate-100 sm:max-w-[580px]"
        style={{
          background: BRAND.navy,
          boxShadow: `0 8px 48px rgba(13,26,46,0.35), 0 0 0 1px rgba(6,182,212,0.12), 0 0 60px ${BRAND.cyanGlow}`,
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(6,182,212,0.18) 0%, transparent 68%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(6,182,212,0.10) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-[1] px-7 pb-7 pt-9 sm:px-9 sm:pb-8 sm:pt-10">
          <div className="mb-5 flex justify-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.35)',
                boxShadow: '0 0 20px rgba(6,182,212,0.12)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-cyan-200 sm:text-xs">
                Recorrido guiado · 4 pasos
              </span>
            </div>
          </div>

          <DialogTitle className="text-center font-sora text-[1.65rem] font-extrabold leading-[1.15] tracking-[-0.5px] text-slate-100 sm:text-[1.9rem]">
            ¡Te damos la bienvenida a{' '}
            <span className="text-[#06B6D4]">FinancIA!</span>
          </DialogTitle>

          <DialogDescription asChild>
            <p className="mx-auto mt-4 max-w-[480px] text-center text-[14px] leading-relaxed text-slate-400 sm:text-[15px]">
              Tu asistente de IA premium para simplificar finanzas. Organiza gastos, crea
              presupuestos y registra transacciones desde la web o WhatsApp.
            </p>
          </DialogDescription>

          <p className="mt-8 text-center text-sm font-semibold text-cyan-100/90">
            Un viaje de{' '}
            <span className="text-[#06B6D4]">4 pasos rápidos</span>:
          </p>

          <div className="mt-5 rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/[0.04] px-2 py-5 sm:px-4">
            <div className="flex items-start justify-between gap-1">
              {TOUR_STEPS.map(({ label, icon: Icon, accent, iconClass, badge: Badge, whatsapp }, index) => (
                <div key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
                  {index < TOUR_STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[calc(50%+1.75rem)] top-7 hidden h-px sm:block"
                      style={{
                        width: 'calc(100% - 3.5rem)',
                        background:
                          'linear-gradient(90deg, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0.15) 100%)',
                      }}
                    />
                  )}

                  <div
                    className={`relative z-[1] flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-[0_4px_16px_rgba(6,182,212,0.12)] ${
                      whatsapp
                        ? 'border-[#25D366]/40 from-[#25D366]/35 to-[#128C7E]/25'
                        : 'border-[#06B6D4]/35'
                    } ${accent}`}
                  >
                    <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={1.75} />
                    {Badge && (
                      <span
                        className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          whatsapp
                            ? 'border-[#25D366]/50 bg-[#25D366]'
                            : 'border-[#06B6D4]/50 bg-[#06B6D4]'
                        }`}
                      >
                        <Badge className="h-2.5 w-2.5 text-[#0d1a2e]" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <span className="mt-3 px-0.5 text-center text-[10px] font-semibold leading-tight text-slate-200 sm:text-[11px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-start sm:gap-5">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] px-8 py-3.5 text-sm font-bold text-[#0d1a2e] transition hover:brightness-110"
              style={{
                background: BRAND.cyan,
                boxShadow: '0 4px 22px rgba(6,182,212,0.45)',
              }}
            >
              <Wallet className="h-4 w-4" />
              Empezar el Tour
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-500 transition-colors hover:text-cyan-200/80"
            >
              Omitir por ahora
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
