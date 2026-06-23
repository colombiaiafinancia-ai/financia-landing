'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PlanCard } from '@/components/pricing/PlanCard'
import {
  ANNUAL_PLAN_CONDITIONS,
  FOUNDERS_PLAN_CONDITIONS,
  PRICING_COMPARISON_ROWS,
  SUBSCRIBE_PLAN_KEYS,
  getLandingPlanByKey,
} from '@/lib/pricing-plans'
import { PROMOTIONAL_TRIAL_END_LABEL } from '@/lib/trial'

export type SubscriptionPlanOption = {
  planKey: string
  name: string
  description: string | null
  amount: number
  currencyId: string
  frequency: number
  frequencyType: string
}

type SubscriptionCheckoutProps = {
  userId: string
  payerEmail: string
  plans: SubscriptionPlanOption[]
  trialEndsAt: string | null
}

function formatCheckoutAmount(amount: number, currencyId: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currencyId,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SubscriptionCheckout({
  userId,
  payerEmail,
  plans,
  trialEndsAt,
}: SubscriptionCheckoutProps) {
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null
  const trialIsActive = Boolean(trialEndDate && trialEndDate.getTime() > Date.now())
  const trialDaysRemaining = trialIsActive && trialEndDate
    ? Math.max(1, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const paidPlans = useMemo(() => {
    const ordered = SUBSCRIBE_PLAN_KEYS.map((planKey) => {
      const plan = plans.find((item) => item.planKey === planKey)
      const display = getLandingPlanByKey(planKey)
      if (!plan || !display) return null
      return { ...plan, display }
    }).filter(Boolean) as Array<SubscriptionPlanOption & { display: NonNullable<ReturnType<typeof getLandingPlanByKey>> }>

    return ordered
  }, [plans])

  async function handleSubscribe(planKey: string) {
    try {
      setLoadingPlanKey(planKey)
      setMessage('')

      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planKey, payerEmail }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok || !data.init_point) {
        setMessage(data.error || 'No se pudo iniciar el checkout.')
        return
      }

      window.location.href = data.init_point
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error('Error iniciando checkout hospedado:', error)
      setMessage(err?.message || 'Error iniciando checkout.')
    } finally {
      setLoadingPlanKey(null)
    }
  }

  function ctaClassName(plan: NonNullable<ReturnType<typeof getLandingPlanByKey>>) {
    return cn(
      'w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
      plan.highlighted && 'bg-[#06B6D4] text-[#0d1a2e] hover:brightness-110',
      plan.limited && 'bg-amber-500 text-white hover:bg-amber-600',
      !plan.highlighted &&
        !plan.limited &&
        'border border-white/15 bg-white/10 text-white hover:bg-white/15'
    )
  }

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-[1]">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard" className="font-sora text-2xl font-extrabold text-slate-100 hover:text-[#06B6D4]">
              FinancIA
            </Link>
            <p className="mt-1 text-sm text-slate-400">Tu asistente financiero impulsado por IA</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-cyan-300/80">
            FinancIA Planes 2026
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="font-sora text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl lg:text-[40px]">
            Escoge tu plan
          </h1>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.1] px-6 py-5 text-cyan-50 shadow-lg shadow-cyan-950/10">
            <p className="font-sora text-xl font-extrabold text-slate-100 md:text-2xl">
              {trialIsActive ? 'Tu prueba promocional esta activa: ' : 'Empiezas gratis hasta el '}
              <span className="text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.28)]">
                {trialIsActive ? `${trialDaysRemaining} dias restantes` : PROMOTIONAL_TRIAL_END_LABEL}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              {trialIsActive
                ? `No necesitas pagar ni buscar descuentos en Mercado Pago. Podras suscribirte cuando termine tu prueba el ${PROMOTIONAL_TRIAL_END_LABEL}.`
                : 'Mercado Pago procesara la suscripcion seleccionada.'}
            </p>
          </div>
        </motion.div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {paidPlans.map((plan, index) => (
            <PlanCard
              key={plan.planKey}
              plan={plan.display}
              index={index}
              animated
              footerNote={`Gratis hasta el ${PROMOTIONAL_TRIAL_END_LABEL}; luego Mercado Pago cobra ${formatCheckoutAmount(plan.amount, plan.currencyId)}`}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.planKey)}
                  disabled={Boolean(loadingPlanKey) || trialIsActive}
                  className={ctaClassName(plan.display)}
                >
                  {trialIsActive
                    ? 'Disponible al terminar la prueba'
                    : loadingPlanKey === plan.planKey
                      ? 'Redirigiendo...'
                      : 'Elegir plan'}
                </button>
              </motion.div>
            </PlanCard>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <h3 className="border-b border-white/10 px-5 py-4 font-sora text-lg font-bold text-slate-100">
            Comparativo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#06B6D4]/15 text-left text-slate-200">
                  <th className="px-4 py-3 font-semibold" />
                  <th className="px-4 py-3 font-semibold">Plan Mensual</th>
                  <th className="px-4 py-3 font-semibold text-[#06B6D4]">Plan Anual 30% OFF</th>
                  <th className="px-4 py-3 font-semibold text-amber-300">Founders 100</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_COMPARISON_ROWS.map((row) => (
                  <tr key={row[0]} className="border-t border-white/10 text-slate-400 even:bg-white/[0.02]">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${row[0]}-${cellIndex}`}
                        className={cn('px-4 py-3', cellIndex === 0 && 'font-semibold text-slate-200')}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="mb-3 font-sora text-sm font-bold uppercase tracking-wide text-[#06B6D4]">
              Condiciones del plan anual
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {ANNUAL_PLAN_CONDITIONS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#06B6D4]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5">
            <h4 className="mb-3 font-sora text-sm font-bold uppercase tracking-wide text-amber-300">
              Sobre Founders 100
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {FOUNDERS_PLAN_CONDITIONS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {message && (
          <p className="mx-auto mt-6 max-w-2xl rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-500 sm:text-sm">
          FinancIA · Planes vigentes 2026 · Precios en USD
        </p>
      </div>
    </div>
  )
}
