export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'
export type RecurringExpenseStatus = 'active' | 'paused' | 'ended'

export function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getPeriodKey(dateKey: string, frequency: RecurringFrequency): string {
  const [year, month, day] = dateKey.split('-')
  if (frequency === 'weekly') return `${year}-W${getWeekNumber(dateKey)}`
  if (frequency === 'yearly') return year
  return `${year}-${month}`
}

export function getNextChargeDate(
  currentDateKey: string,
  frequency: RecurringFrequency,
  billingDay?: number | null
): string {
  const [year, month, day] = currentDateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
    return toDateKey(date)
  }

  if (frequency === 'yearly') {
    const targetDay = clampDay(year + 1, month, billingDay || day)
    return toDateKey(new Date(year + 1, month - 1, targetDay))
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const targetDay = clampDay(nextYear, nextMonth, billingDay || day)
  return toDateKey(new Date(nextYear, nextMonth - 1, targetDay))
}

export function buildRecurringTransactionMeta(
  recurringExpenseId: string,
  period: string,
  frequency: RecurringFrequency
) {
  return {
    type: 'recurring_expense',
    recurring_expense_id: recurringExpenseId,
    period,
    frequency,
  }
}

function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate()
  return Math.min(Math.max(1, day), lastDay)
}

function getWeekNumber(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayNumber = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return String(week).padStart(2, '0')
}

