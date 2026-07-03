'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  FileText,
  Gauge,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import type { TransactionDTO } from '@/features/transactions/dto/transactionDTO'
import {
  detectMoneyLeaks,
  getMoneyLeakCategoryComparisons,
  type BudgetLeakSummary,
  type MoneyLeakCategoryComparison,
  type MoneyLeakInsight,
} from '@/lib/money-leaks'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type TrendPoint = {
  amount: number
}

interface MoneyLeakDetectorProps {
  transactions: TransactionDTO[]
  expensesByCategory: Record<string, number>
  weeklyTrend: TrendPoint[]
  monthlyTrend: TrendPoint[]
  totalSpent: number
  budgetSummary: BudgetLeakSummary[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))

const getInsightIcon = (type: MoneyLeakInsight['type']) => {
  switch (type) {
    case 'category_spike':
      return TrendingUp
    case 'small_repeats':
      return FileText
    case 'run_rate':
      return Gauge
    case 'budget_risk':
      return AlertTriangle
    default:
      return PiggyBank
  }
}

const getCategoryClasses = (status: MoneyLeakCategoryComparison['status']) => {
  switch (status) {
    case 'danger':
      return {
        card: 'border-red-500/35 bg-red-500/12',
        icon: 'bg-red-500/15 text-red-700 dark:text-red-300',
        text: 'text-red-700 dark:text-red-300',
        bar: 'bg-red-500',
      }
    case 'warning':
      return {
        card: 'border-amber-500/35 bg-amber-500/12',
        icon: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        text: 'text-amber-800 dark:text-amber-200',
        bar: 'bg-amber-500',
      }
    case 'safe':
      return {
        card: 'border-green-500/30 bg-green-500/10',
        icon: 'bg-green-500/15 text-green-700 dark:text-green-300',
        text: 'text-green-700 dark:text-green-300',
        bar: 'bg-green-500',
      }
    default:
      return {
        card: 'border-border bg-muted/40 dark:border-white/10 dark:bg-white/5',
        icon: 'bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/60',
        text: 'text-muted-foreground dark:text-white/60',
        bar: 'bg-slate-400',
      }
  }
}

export const MoneyLeakDetector = ({
  transactions,
  expensesByCategory,
  weeklyTrend,
  monthlyTrend,
  totalSpent,
  budgetSummary,
}: MoneyLeakDetectorProps) => {
  const [selectedLeakCategory, setSelectedLeakCategory] = useState<string | null>(null)

  const insights = useMemo(
    () =>
      detectMoneyLeaks({
        transactions,
        expensesByCategory,
        weeklyTrend,
        monthlyTrend,
        totalSpent,
        budgetSummary,
      }),
    [budgetSummary, expensesByCategory, monthlyTrend, totalSpent, transactions, weeklyTrend]
  )

  const categoryComparisons = useMemo(
    () =>
      getMoneyLeakCategoryComparisons({
        transactions,
        expensesByCategory,
        budgetSummary,
      }),
    [budgetSummary, expensesByCategory, transactions]
  )

  const potentialLeak = insights.reduce((sum, insight) => sum + insight.estimatedLeak, 0)
  const hasInsights = insights.length > 0
  const hasCategoryComparisons = categoryComparisons.length > 0
  const visibleComparisons = categoryComparisons.slice(0, 6)
  const currentMonthRange = useMemo(() => {
    const now = new Date()
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(),
    }
  }, [])
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedLeakCategory) return []
    return transactions
      .filter((tx) => {
        if (tx.type !== 'gasto' || tx.category !== selectedLeakCategory || !tx.createdAt) return false
        const occurredAt = new Date(tx.createdAt).getTime()
        return occurredAt >= currentMonthRange.start && occurredAt < currentMonthRange.end
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
  }, [currentMonthRange, selectedLeakCategory, transactions])
  const selectedCategoryTotal = selectedCategoryTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  )

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-4 text-card-foreground dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/5 dark:to-white/2 dark:text-white dark:backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Detector de fugas
              </h3>
            </div>
          </div>
        </div>

        {hasInsights && (
          <div className="shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-right">
            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
              Posible ahorro
            </p>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              {formatCurrency(potentialLeak)}
            </p>
          </div>
        )}
      </div>

      {hasCategoryComparisons ? (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Comparativo por categoria
            </p>
            <p className="text-xs text-muted-foreground dark:text-white/60">
              {categoryComparisons.length > visibleComparisons.length
                ? `${visibleComparisons.length} principales de ${categoryComparisons.length}`
                : `${categoryComparisons.length} categorias`}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleComparisons.map((category) => {
              const classes = getCategoryClasses(category.status)
              const progress = Math.min(Math.max(category.percentage, 0), 140)
              const hasBenchmark = category.benchmark > 0

              return (
                <div
                  key={category.category}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLeakCategory(category.category)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedLeakCategory(category.category)
                    }
                  }}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 transition hover:-translate-y-0.5',
                    classes.card,
                    selectedLeakCategory === category.category &&
                      'ring-2 ring-primary ring-offset-2 ring-offset-card dark:ring-[#9DFAD7] dark:ring-offset-[#0D1D35]'
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {category.category}
                      </p>
                      <p className={cn('text-xs font-medium', classes.text)}>
                        {category.statusLabel}
                      </p>
                    </div>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', classes.icon)}>
                      {category.status === 'safe' ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground dark:text-white/60">
                        Actual
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(category.current)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground dark:text-white/60">
                        {category.budgeted !== null ? 'Presupuesto' : 'Promedio'}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-white/70">
                        {hasBenchmark ? formatCurrency(category.benchmark) : 'Sin datos'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={cn('h-full rounded-full', classes.bar)}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground dark:text-white/60">
                    <span>{hasBenchmark ? `${category.percentage.toFixed(0)}% usado` : 'Sin base'}</span>
                    {category.excess > 0 && (
                      <span className={classes.text}>+{formatCurrency(category.excess)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          Registra gastos o crea presupuestos para ver el comparativo por categoria.
        </div>
      )}

      {hasInsights ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Desglose detectado
          </p>
          {insights.map((insight) => {
            const Icon = getInsightIcon(insight.type)
            const isDanger = insight.severity === 'danger'

            return (
              <div
                key={insight.id}
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  isDanger
                    ? 'border-red-500/25 bg-red-500/10'
                    : 'border-amber-500/25 bg-amber-500/10'
                )}
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      isDanger
                        ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {insight.title}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-bold',
                          isDanger
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-amber-800 dark:text-amber-200'
                        )}
                      >
                        {formatCurrency(insight.estimatedLeak)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/70">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-700 dark:text-green-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            No detectamos fugas fuertes
          </h4>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground dark:text-white/70">
            Tus gastos del mes no muestran subidas relevantes, gastos pequenos repetidos ni presupuestos en riesgo.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Analisis basado en tus transacciones, resumenes diarios/mensuales y presupuestos por categoria.
      </div>

      <Dialog
        open={selectedLeakCategory !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLeakCategory(null)
        }}
      >
        <DialogContent className="max-w-lg border border-border bg-card text-card-foreground dark:border-white/20 dark:bg-[#0D1D35] dark:text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedLeakCategory ? `Desglose mensual: ${selectedLeakCategory}` : 'Desglose mensual'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <span className="text-muted-foreground dark:text-white/70">
                {selectedCategoryTransactions.length} movimientos este mes
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(selectedCategoryTotal)}
              </span>
            </div>

            {selectedCategoryTransactions.length === 0 ? (
              <p className="rounded-lg border border-border bg-background px-3 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                No hay gastos registrados en esta categoria durante el mes actual.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {selectedCategoryTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {tx.description || 'Sin descripcion'}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-white/60">
                        {tx.formattedDate}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-amber-700 dark:text-amber-300">
                      {tx.formattedAmount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
