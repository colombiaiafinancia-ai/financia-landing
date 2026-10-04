import type { TransactionUseCases } from '@/features/transactions/application/transactionUseCases'
import type { CategoryDTO } from '@/features/categories/application/categoryUseCases'
import type { CategoryBudgetWithSpent } from '@/features/budgets/application/categoryBudgetService'
import type { RecurringExpenseDTO } from '@/features/recurring-expenses/dto/recurringExpenseDTO'
import type { OnboardingStatus } from '@/types/onboardingStatus'

/** Subconjunto serializable del usuario de Supabase que necesita el dashboard. */
export type DashboardUser = {
  id: string
  email: string | null
  user_metadata: Record<string, any>
}

export type DashboardProfile = {
  is_super_user: boolean | null
  subscription_status: string | null
  current_plan: string | null
  trial_ends_at: string | null
  mp_preapproval_id: string | null
  reminder_opt_in: boolean | null
  onboarding: OnboardingStatus | string | null
}

export type TransactionsBundle = Awaited<ReturnType<TransactionUseCases['getTransactionsWithCalculations']>>

export type CategoriesBundle = {
  gastos: CategoryDTO[]
  ingresos: CategoryDTO[]
  owned: CategoryDTO[]
}

export type DashboardInitialData = {
  /** Momento (ms) en que el servidor obtuvo los datos; lo usa la caché del cliente. */
  fetchedAt: number
  transactions: TransactionsBundle | null
  categories: CategoriesBundle | null
  budgets: { month: string; items: CategoryBudgetWithSpent[] } | null
  recurringExpenses: RecurringExpenseDTO[] | null
}
