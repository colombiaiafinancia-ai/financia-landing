'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandingPlan } from '@/lib/pricing-plans'

type PlanCardProps = {
  plan: LandingPlan
  index?: number
  animated?: boolean
  footerNote?: string
  children: React.ReactNode
}

export function PlanCard({ plan, index = 0, animated = true, footerNote, children }: PlanCardProps) {
  const Icon = plan.icon

  const content = (
    <>
      {plan.badge && (
        <span
          className={cn(
            'absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide',
            plan.highlighted && 'bg-[#06B6D4] text-[#0d1a2e]',
            plan.limited && 'bg-amber-500 text-white',
            !plan.highlighted && !plan.limited && 'bg-white/10 text-slate-200'
          )}
        >
          {plan.badge}
        </span>
      )}

      <div
        className={cn(
          'mb-4 flex h-11 w-11 items-center justify-center rounded-xl',
          plan.limited ? 'bg-amber-500/20' : 'bg-[#06B6D4]/15'
        )}
      >
        <Icon className={cn('h-5 w-5', plan.limited ? 'text-amber-300' : 'text-[#06B6D4]')} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{plan.eyebrow}</p>
      <h3 className="mt-1 font-sora text-xl font-bold text-slate-100">{plan.name}</h3>

      <div className="mt-4">
        {plan.oldPrice && (
          <p className="text-lg font-semibold text-slate-500 line-through">{plan.oldPrice}</p>
        )}
        <p
          className={cn(
            'font-sora text-4xl font-extrabold leading-none md:text-[42px]',
            plan.highlighted && 'text-[#06B6D4]',
            plan.limited && 'text-amber-300',
            !plan.highlighted && !plan.limited && 'text-slate-100'
          )}
        >
          {plan.price}
        </p>
        <p className="mt-2 text-xs text-slate-400 sm:text-sm">{plan.detail}</p>
        {footerNote && <p className="mt-1 text-[10px] text-slate-500">{footerNote}</p>}
      </div>

      {plan.helper && (
        <p
          className={cn(
            'mt-4 rounded-lg px-3 py-2 text-xs font-semibold',
            plan.highlighted && 'bg-[#06B6D4]/15 text-cyan-200',
            plan.limited && 'bg-amber-500/15 text-amber-200'
          )}
        >
          {plan.helper}
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                plan.limited ? 'text-amber-400' : 'text-[#06B6D4]'
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">{children}</div>
    </>
  )

  const cardClassName = cn(
    'relative flex flex-col rounded-2xl border p-6 shadow-2xl transition-transform duration-300',
    plan.highlighted &&
      'z-10 border-[#06B6D4] bg-gradient-to-b from-[#06B6D4]/20 to-[#0d1a2e] shadow-[0_0_40px_rgba(6,182,212,0.25)] lg:-translate-y-2 lg:scale-[1.03]',
    plan.limited && 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-[#0d1a2e]',
    !plan.highlighted &&
      !plan.limited &&
      'border-white/10 bg-white/[0.03] backdrop-blur-sm'
  )

  if (!animated) {
    return <article className={cardClassName}>{content}</article>
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      viewport={{ once: true }}
      className={cardClassName}
    >
      {content}
    </motion.article>
  )
}
