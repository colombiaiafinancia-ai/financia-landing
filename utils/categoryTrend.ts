import type { TransactionDTO } from '@/features/transactions/dto/transactionDTO'
import {
  addDaysToDateKey,
  formatDateKey,
  getBogotaCurrentWeekWindows,
  getBogotaDateKey,
  getTransactionBogotaDateKey,
  parseDateKeyToLocalDate,
} from '@/utils/bogotaDate'

export function filterCategoryExpenses(
  transactions: TransactionDTO[],
  categoryName: string,
  transactionType: 'gasto' | 'ingreso' = 'gasto'
): TransactionDTO[] {
  return transactions.filter(
    (tx) => !tx.isRollover && tx.type === transactionType && tx.category === categoryName
  )
}

export function buildCategoryDailyTrend(
  transactions: TransactionDTO[],
  days = 7
): Array<{ date: string; amount: number }> {
  const result: Array<{ date: string; amount: number }> = []
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const key = getTransactionBogotaDateKey(tx.createdAt)
    if (!key) continue
    totals.set(key, (totals.get(key) || 0) + tx.amount)
  }

  const todayKey = getBogotaDateKey()
  for (let i = days - 1; i >= 0; i--) {
    const key = addDaysToDateKey(todayKey, -i)
    result.push({ date: key, amount: totals.get(key) || 0 })
  }

  return result
}

export function buildCategoryWeeklyTrend(
  transactions: TransactionDTO[]
): Array<{ week: string; amount: number; date: string }> {
  const weeks = getBogotaCurrentWeekWindows(4)
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const key = getTransactionBogotaDateKey(tx.createdAt)
    if (!key) continue
    totals.set(key, (totals.get(key) || 0) + tx.amount)
  }

  return weeks.map((week) => {
    let weekTotal = 0
    totals.forEach((amount, key) => {
      if (key >= week.startKey && key <= week.endKey) weekTotal += amount
    })

    return {
      week: week.label,
      amount: weekTotal,
      date: formatDateKey(week.startKey),
    }
  })
}

export function buildCategoryMonthlyTrend(
  transactions: TransactionDTO[],
  months = 12
): Array<{ month: string; amount: number }> {
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const dateKey = getTransactionBogotaDateKey(tx.createdAt)
    if (!dateKey) continue
    const date = parseDateKeyToLocalDate(dateKey)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    totals.set(monthKey, (totals.get(monthKey) || 0) + tx.amount)
  }

  const result: Array<{ month: string; amount: number }> = []
  const now = parseDateKeyToLocalDate(getBogotaDateKey())

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
