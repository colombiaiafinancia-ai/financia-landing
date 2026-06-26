import type { TransactionDTO } from '@/features/transactions/dto/transactionDTO'

function parseTxDate(createdAt: string | null): Date | null {
  if (!createdAt) return null
  const dateOnly = createdAt.split('T')[0]
  const [year, month, day] = dateOnly.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function filterCategoryExpenses(
  transactions: TransactionDTO[],
  categoryName: string,
  transactionType: 'gasto' | 'ingreso' = 'gasto'
): TransactionDTO[] {
  return transactions.filter(
    (tx) => tx.type === transactionType && tx.category === categoryName
  )
}

export function buildCategoryDailyTrend(
  transactions: TransactionDTO[],
  days = 7
): Array<{ date: string; amount: number }> {
  const result: Array<{ date: string; amount: number }> = []
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const date = parseTxDate(tx.createdAt)
    if (!date) continue
    const key = toDateKey(date)
    totals.set(key, (totals.get(key) || 0) + tx.amount)
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = toDateKey(date)
    result.push({ date: key, amount: totals.get(key) || 0 })
  }

  return result
}

export function buildCategoryWeeklyTrend(
  transactions: TransactionDTO[]
): Array<{ week: string; amount: number; date: string }> {
  const today = new Date()
  const weeks: Array<{ week: string; amount: number; date: string }> = []

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekStartKey = toDateKey(weekStart)
    const weekEndKey = toDateKey(weekEnd)

    let weekTotal = 0
    for (const tx of transactions) {
      const date = parseTxDate(tx.createdAt)
      if (!date) continue
      const key = toDateKey(date)
      if (key >= weekStartKey && key <= weekEndKey) {
        weekTotal += tx.amount
      }
    }

    const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
    weeks.push({
      week: weekLabel,
      amount: weekTotal,
      date: weekStart.toLocaleDateString('es-CO'),
    })
  }

  return weeks
}

export function buildCategoryMonthlyTrend(
  transactions: TransactionDTO[],
  months = 12
): Array<{ month: string; amount: number }> {
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const date = parseTxDate(tx.createdAt)
    if (!date) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    totals.set(key, (totals.get(key) || 0) + tx.amount)
  }

  const result: Array<{ month: string; amount: number }> = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    result.push({
      month: date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
      amount: totals.get(key) || 0,
    })
  }

  return result
}
