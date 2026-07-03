import type { TransactionDTO } from '@/features/transactions/dto/transactionDTO'

export type BudgetLeakSummary = {
  categoryId: string
  categoryName: string
  presupuestado: number
  actual: number
  excedente: number
  porcentajeUsado: number
}

export type MoneyLeakInsight = {
  id: string
  type: 'category_spike' | 'small_repeats' | 'run_rate' | 'budget_risk'
  severity: 'info' | 'warning' | 'danger'
  title: string
  description: string
  estimatedLeak: number
  category?: string
  transactionIds?: string[]
  actionLabel: string
}

export type MoneyLeakCategoryComparison = {
  category: string
  current: number
  benchmark: number
  budgeted: number | null
  excess: number
  percentage: number
  status: 'danger' | 'warning' | 'safe' | 'neutral'
  statusLabel: string
}

type TrendPoint = {
  amount: number
}

export type MoneyLeakInput = {
  transactions: TransactionDTO[]
  expensesByCategory: Record<string, number>
  weeklyTrend: TrendPoint[]
  monthlyTrend: TrendPoint[]
  totalSpent: number
  budgetSummary?: BudgetLeakSummary[]
}

const SMALL_EXPENSE_LIMIT = 20000
const MIN_SMALL_EXPENSE_COUNT = 5
const MIN_SMALL_EXPENSE_TOTAL = 60000
const MIN_CATEGORY_EXCESS = 50000
const CATEGORY_SPIKE_RATIO = 1.25
const MIN_RUN_RATE_EXCESS = 100000

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const isCurrentMonth = (value: string | null, currentMonthKey: string) => {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return getMonthKey(date) === currentMonthKey
}

const getDaysInMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

const getCategoryHistory = (transactions: TransactionDTO[], currentMonthKey: string) => {
  const history = new Map<string, Map<string, number>>()

  for (const tx of transactions) {
    if (tx.type !== 'gasto' || !tx.category || !tx.createdAt) continue
    const date = new Date(tx.createdAt)
    if (Number.isNaN(date.getTime())) continue
    const monthKey = getMonthKey(date)
    if (monthKey === currentMonthKey) continue

    const categoryMonths = history.get(tx.category) ?? new Map<string, number>()
    categoryMonths.set(monthKey, (categoryMonths.get(monthKey) ?? 0) + tx.amount)
    history.set(tx.category, categoryMonths)
  }

  return history
}

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

export const getMoneyLeakCategoryComparisons = ({
  transactions,
  expensesByCategory,
  budgetSummary = [],
}: Pick<MoneyLeakInput, 'transactions' | 'expensesByCategory' | 'budgetSummary'>): MoneyLeakCategoryComparison[] => {
  const currentMonthKey = getMonthKey(new Date())
  const categoryHistory = getCategoryHistory(transactions, currentMonthKey)
  const budgetMap = new Map(budgetSummary.map((budget) => [budget.categoryName, budget]))
  const categories = new Set([
    ...Object.keys(expensesByCategory),
    ...budgetSummary.map((budget) => budget.categoryName),
  ])

  return [...categories]
    .map((category) => {
      const current = expensesByCategory[category] ?? budgetMap.get(category)?.actual ?? 0
      const historicalAverage = average(
        [...(categoryHistory.get(category)?.values() ?? [])].filter((value) => value > 0)
      )
      const budget = budgetMap.get(category)
      const budgeted = budget?.presupuestado ?? null
      const benchmark = budgeted ?? historicalAverage
      const excess = benchmark > 0 ? current - benchmark : 0
      const percentage = benchmark > 0 ? (current / benchmark) * 100 : current > 0 ? 100 : 0

      let status: MoneyLeakCategoryComparison['status'] = 'neutral'
      let statusLabel = 'Sin comparativo'

      if (benchmark > 0) {
        if (percentage >= 110 || excess >= MIN_CATEGORY_EXCESS) {
          status = 'danger'
          statusLabel = 'Fuga'
        } else if (percentage >= 85) {
          status = 'warning'
          statusLabel = 'En riesgo'
        } else {
          status = 'safe'
          statusLabel = 'Va bien'
        }
      } else if (current > 0) {
        status = 'warning'
        statusLabel = 'Sin limite'
      }

      return {
        category,
        current,
        benchmark,
        budgeted,
        excess: Math.max(0, excess),
        percentage,
        status,
        statusLabel,
      }
    })
    .sort((a, b) => {
      const aHasBenchmark = a.benchmark > 0
      const bHasBenchmark = b.benchmark > 0

      if (aHasBenchmark !== bHasBenchmark) {
        return bHasBenchmark ? 1 : -1
      }

      if (aHasBenchmark && bHasBenchmark) {
        const statusScore = { danger: 3, warning: 2, safe: 1, neutral: 0 }
        return (
          statusScore[b.status] - statusScore[a.status] ||
          b.percentage - a.percentage ||
          b.excess - a.excess ||
          b.current - a.current
        )
      }

      return b.current - a.current
    })
}

export const detectMoneyLeaks = ({
  transactions,
  expensesByCategory,
  monthlyTrend,
  totalSpent,
  budgetSummary = [],
}: MoneyLeakInput): MoneyLeakInsight[] => {
  const now = new Date()
  const currentMonthKey = getMonthKey(now)
  const currentMonthTransactions = transactions.filter((tx) =>
    tx.type === 'gasto' && isCurrentMonth(tx.createdAt, currentMonthKey)
  )
  const insights: MoneyLeakInsight[] = []

  const categoryHistory = getCategoryHistory(transactions, currentMonthKey)
  for (const [category, currentTotal] of Object.entries(expensesByCategory)) {
    const monthTotals = [...(categoryHistory.get(category)?.values() ?? [])].filter((value) => value > 0)
    const historicalAverage = average(monthTotals)
    const excess = currentTotal - historicalAverage

    if (
      historicalAverage > 0 &&
      currentTotal >= historicalAverage * CATEGORY_SPIKE_RATIO &&
      excess >= MIN_CATEGORY_EXCESS
    ) {
      insights.push({
        id: `category-spike-${category}`,
        type: 'category_spike',
        severity: excess >= historicalAverage * 0.5 ? 'danger' : 'warning',
        title: `${category} subio frente a tu promedio`,
        description: `Este mes vas en ${formatCurrency(currentTotal)}. Tu promedio reciente era ${formatCurrency(historicalAverage)}.`,
        estimatedLeak: excess,
        category,
        transactionIds: currentMonthTransactions
          .filter((tx) => tx.category === category)
          .map((tx) => tx.id),
        actionLabel: 'Revisar categoria',
      })
    }
  }

  const smallExpenses = currentMonthTransactions.filter((tx) => tx.amount <= SMALL_EXPENSE_LIMIT)
  const smallExpensesTotal = smallExpenses.reduce((sum, tx) => sum + tx.amount, 0)
  if (
    smallExpenses.length >= MIN_SMALL_EXPENSE_COUNT &&
    smallExpensesTotal >= MIN_SMALL_EXPENSE_TOTAL
  ) {
    insights.push({
      id: 'small-repeats',
      type: 'small_repeats',
      severity: smallExpensesTotal >= MIN_SMALL_EXPENSE_TOTAL * 2 ? 'danger' : 'warning',
      title: 'Gastos pequenos repetidos',
      description: `${smallExpenses.length} compras menores a ${formatCurrency(SMALL_EXPENSE_LIMIT)} suman ${formatCurrency(smallExpensesTotal)} este mes.`,
      estimatedLeak: smallExpensesTotal,
      transactionIds: smallExpenses.map((tx) => tx.id),
      actionLabel: 'Ver gastos pequenos',
    })
  }

  const dayOfMonth = Math.max(now.getDate(), 1)
  const daysInMonth = getDaysInMonth(now)
  const projectedMonthlySpend = (totalSpent / dayOfMonth) * daysInMonth
  const previousMonthlyAverage = average(
    monthlyTrend
      .slice(0, -1)
      .map((item) => Number(item.amount) || 0)
      .filter((value) => value > 0)
  )
  const projectedExcess = projectedMonthlySpend - previousMonthlyAverage

  if (
    previousMonthlyAverage > 0 &&
    projectedMonthlySpend > previousMonthlyAverage * 1.2 &&
    projectedExcess >= MIN_RUN_RATE_EXCESS
  ) {
    insights.push({
      id: 'run-rate',
      type: 'run_rate',
      severity: projectedExcess >= previousMonthlyAverage * 0.35 ? 'danger' : 'warning',
      title: 'Ritmo de gasto alto',
      description: `A este ritmo cerrarias el mes cerca de ${formatCurrency(projectedMonthlySpend)}, ${formatCurrency(projectedExcess)} por encima de tu promedio.`,
      estimatedLeak: projectedExcess,
      actionLabel: 'Bajar ritmo semanal',
    })
  }

  const expectedMonthProgress = (dayOfMonth / daysInMonth) * 100
  for (const budget of budgetSummary) {
    const isAheadOfPace = budget.porcentajeUsado >= expectedMonthProgress + 20
    const isNearLimitEarly = budget.porcentajeUsado >= 80 && expectedMonthProgress < 75

    if ((isAheadOfPace || isNearLimitEarly) && budget.presupuestado > 0) {
      const leak = Math.max(0, budget.actual - (budget.presupuestado * expectedMonthProgress) / 100)
      insights.push({
        id: `budget-risk-${budget.categoryId}`,
        type: 'budget_risk',
        severity: budget.porcentajeUsado >= 100 ? 'danger' : 'warning',
        title: `${budget.categoryName} va mas rapido que el mes`,
        description: `Has usado ${budget.porcentajeUsado.toFixed(0)}% del presupuesto y el mes va en ${expectedMonthProgress.toFixed(0)}%.`,
        estimatedLeak: leak,
        category: budget.categoryName,
        actionLabel: budget.porcentajeUsado >= 100 ? 'Presupuesto excedido' : 'Ajustar limite',
      })
    }
  }

  return insights
    .sort((a, b) => {
      const severityScore = { danger: 2, warning: 1, info: 0 }
      return severityScore[b.severity] - severityScore[a.severity] || b.estimatedLeak - a.estimatedLeak
    })
    .slice(0, 4)
}
