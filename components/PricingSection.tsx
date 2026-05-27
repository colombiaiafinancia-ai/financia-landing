'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PlanCard } from '@/components/pricing/PlanCard'
import {
  ANNUAL_PLAN_CONDITIONS,
  FOUNDERS_PLAN_CONDITIONS,
  LANDING_PLANS,
  PRICING_COMPARISON_ROWS,
} from '@/lib/pricing-plans'
import { cn } from '@/lib/utils'

const PricingSection = () => {
  return (
    <section
      id="plan"
      className="relative overflow-hidden px-[6%] py-16 md:py-20"
      style={{ background: '#0d1a2e' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-[1] mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-cyan-300/80">
            FinancIA Planes 2026
          </p>
          <h2 className="font-sora text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl lg:text-[40px]">
            Escoge tu plan
          </h2>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.1] px-6 py-5 text-cyan-50 shadow-lg shadow-cyan-950/10">
            <p className="font-sora text-xl font-extrabold text-slate-100 md:text-2xl">
              Prueba gratis por{' '}
              <span className="text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.28)]">
                7 dias
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              El pago se realiza despues de terminar la prueba. Puedes cancelar antes del primer cobro.
            </p>
          </div>
        </motion.div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {LANDING_PLANS.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={plan.href}
                  className={cn(
                    'block w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold transition',
                    plan.highlighted && 'bg-[#06B6D4] text-[#0d1a2e] hover:brightness-110',
                    plan.limited && 'bg-amber-500 text-white hover:bg-amber-600',
                    !plan.highlighted &&
                      !plan.limited &&
                      'border border-white/15 bg-white/10 text-white hover:bg-white/15'
                  )}
                >
                  Elegir plan
                </Link>
              </motion.div>
            </PlanCard>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
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
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={cn('px-4 py-3', index === 0 && 'font-semibold text-slate-200')}
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5"
          >
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
          </motion.div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 sm:text-sm">
          FinancIA · Planes vigentes 2026 · Precios en USD
        </p>
      </div>
    </section>
  )
}

export default PricingSection
