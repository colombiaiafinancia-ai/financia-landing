import type { RecurringExpenseStatus, RecurringFrequency } from '@/lib/recurring-expenses'

export interface RecurringExpenseDTO {
  readonly id: string
  readonly userId: string
  readonly name: string
  readonly amount: number
  readonly categoryId: string
  readonly categoryName: string
  readonly direction: 'gasto' | 'ingreso'
  readonly merchant: string | null
  readonly frequency: RecurringFrequency
  readonly billingDay: number | null
  readonly nextChargeDate: string
  readonly startsAt: string
  readonly endsAt: string | null
  readonly status: RecurringExpenseStatus
  readonly autoCreate: boolean
  readonly notes: string | null
  readonly formattedAmount: string
  readonly formattedNextChargeDate: string
}

export interface CreateRecurringExpenseDTO {
  readonly name: string
  readonly amount: number
  readonly categoryId: string
  readonly direction?: 'gasto' | 'ingreso'
  readonly merchant?: string | null
  readonly frequency: RecurringFrequency
  readonly billingDay?: number | null
  readonly nextChargeDate: string
  readonly startsAt?: string
  readonly autoCreate?: boolean
  readonly notes?: string | null
}

export interface UpdateRecurringExpenseDTO {
  readonly name?: string
  readonly amount?: number
  readonly categoryId?: string
  readonly direction?: 'gasto' | 'ingreso'
  readonly merchant?: string | null
  readonly frequency?: RecurringFrequency
  readonly billingDay?: number | null
  readonly nextChargeDate?: string
  readonly startsAt?: string
  readonly autoCreate?: boolean
  readonly notes?: string | null
  readonly status?: RecurringExpenseStatus
}
