'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    eyebrow: 'Mensual',
    name: 'Plan Mensual',
    price: '$3.50',
    detail: 'USD / usuario / mes',
    helper: 'Sin permanencia minima. Cancela cuando quieras.',
    badge: null,
    features: [
      'Acceso completo a la plataforma',
      'Sin compromiso de permanencia',
      'Cobro mes a mes',
      'Cancela cuando quieras',
      'Soporte estandar',
    ],
    href: '/subscribe',
    tone: 'standard',
    icon: Star,
  },
  {
    eyebrow: 'Anual',
    name: 'Plan Anual 30% OFF',
    price: '$29.40',
    detail: 'USD / ano - $2.45/mes',
    helper: 'Ahorras USD $12.60 al ano.',
    badge: 'Mas popular',
    features: [
      '30% de descuento sobre el precio mensual',
      'Un solo cobro al ano',
      'Renovacion anual con el mismo descuento',
      'Soporte estandar incluido',
    ],
    href: '/subscribe',
    tone: 'annual',
    icon: Zap,
  },
  {
    eyebrow: 'Fundadores',
    name: 'Founders 100',
    price: '$2.46',
    detail: 'USD / usuario / mes por 12 meses',
    helper: 'Solo 100 cupos en 2026.',
    badge: 'Cupo limitado',
    features: [
      'Precio especial de fundador por 12 meses',
      'Acceso anticipado a nuevas funciones',
      'Canal directo con el equipo de producto',
      'Mencion en la comunidad de fundadores',
    ],
    href: '/subscribe',
    tone: 'founder',
    icon: Crown,
  },
  {
    eyebrow: 'Fundadores anual',
    name: 'Founder Anual',
    price: '$27.06',
    detail: 'USD / ano - pagas 11 meses',
    helper: 'Un mes gratis frente al founder mensual.',
    badge: '1 mes gratis',
    features: [
      '12 meses de acceso fundador',
      'Un solo pago anual',
      'Precio especial no renovable',
      'Canal directo con el equipo de producto',
    ],
    href: '/subscribe',
    tone: 'founder',
    icon: Crown,
  },
] as const

const comparisonRows = [
  ['Precio para ti', '$3.50 / mes', '$29.40 / ano', '$2.46 / mes', '$27.06 / ano'],
  ['Modalidad de pago', 'Mensual recurrente', 'Pago unico anual', 'Mensual recurrente', 'Pago unico anual'],
  ['Ahorro vs mensual', '-', '30%', '~30%', '~35%'],
  ['Duracion del beneficio', 'Indefinido', '12 meses renovable', '12 meses no renovable', '12 meses no renovable'],
]

const PricingSection = () => {
  return (
    <section id="plan" className="py-20 bg-gradient-to-br from-[#0D1D35] to-[#0D1D35]/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Elige el plan que mejor se adapta a ti
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            Sin permanencia minima en el plan mensual. Cancela cuando quieras. Soporte y actualizaciones incluidos.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
                className={cn(
                  'relative flex min-h-[31rem] flex-col rounded-2xl border p-5 shadow-xl',
                  plan.tone === 'founder'
                    ? 'border-amber-400 bg-amber-50 text-[#0D1D35]'
                    : plan.tone === 'annual'
                      ? 'border-[#5ce1e6] bg-[#5ce1e6]/10 text-white'
                      : 'border-white/15 bg-white text-[#0D1D35]'
                )}
              >
                {plan.badge && (
                  <span
                    className={cn(
                      'absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                      plan.tone === 'founder'
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#5ce1e6] text-[#0D1D35]'
                    )}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1D35]/10">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">{plan.eyebrow}</p>
                <h3 className="mt-1 text-xl font-bold">{plan.name}</h3>
                <p className="mt-3 text-4xl font-black">{plan.price}</p>
                <p className="mt-1 text-xs opacity-70">{plan.detail}</p>
                <p className="mt-3 rounded-md bg-[#0D1D35]/8 px-2 py-1.5 text-xs font-semibold">
                  {plan.helper}
                </p>

                <ul className="mt-5 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.a
                  href={plan.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-bold transition',
                    plan.tone === 'founder'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-[#5ce1e6] text-[#0D1D35] hover:bg-[#4dd0e1]'
                  )}
                >
                  Elegir plan
                </motion.a>
              </motion.article>
            )
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-5 bg-[#5ce1e6]/15 px-4 py-3 text-xs font-bold text-white">
            <span>Comparativo</span>
            <span>Mensual</span>
            <span>Anual</span>
            <span>Founders</span>
            <span>Founder anual</span>
          </div>
          {comparisonRows.map((row) => (
            <div key={row[0]} className="grid grid-cols-5 border-t border-white/10 px-4 py-3 text-xs text-white/80">
              {row.map((cell, index) => (
                <span key={`${row[0]}-${cell}`} className={index === 0 ? 'font-semibold text-white' : ''}>
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
