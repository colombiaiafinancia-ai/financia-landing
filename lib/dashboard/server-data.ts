import { cache } from 'react'
import { createSupabaseClient } from '@/utils/supabase/server'
import { isRefreshTokenError } from '@/services/supabase/types'
import { transactionUseCases } from '@/features/transactions/application/transactionUseCases'
import { categoryUseCases } from '@/features/categories/application/categoryUseCases'
import { categoryBudgetService } from '@/features/budgets/application/categoryBudgetService'
import { categoryRepository } from '@/features/categories/infrastructure/categoryRepository'
import { recurringExpenseUseCases } from '@/features/recurring-expenses/application/recurringExpenseUseCases'
import type { DashboardInitialData, DashboardProfile, DashboardUser } from './types'

const PROFILE_COLUMNS =
  'is_super_user,subscription_status,current_plan,trial_ends_at,mp_preapproval_id,reminder_opt_in,onboarding'

/**
 * Usuario + perfil del dashboard. `cache` lo deduplica por request:
 * layout y page comparten una sola llamada a Auth y una sola consulta a `user_profiles`.
 */
export const getDashboardSession = cache(async (): Promise<{
  user: DashboardUser | null
  profile: DashboardProfile | null
  profileError: boolean
  refreshTokenError: boolean
}> => {
  const supabase = await createSupabaseClient()
  // getClaims valida el JWT localmente (llaves asimétricas) o con getUser() como respaldo
  const { data: claimsData, error: userError } = await supabase.auth.getClaims()

  if (userError && isRefreshTokenError(userError)) {
    await supabase.auth.signOut()
    return { user: null, profile: null, profileError: false, refreshTokenError: true }
  }
  const claims = claimsData?.claims
  if (!claims?.sub) return { user: null, profile: null, profileError: false, refreshTokenError: false }
  const user = {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    user_metadata: (claims.user_metadata as Record<string, any> | undefined) ?? {},
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    user,
    profile: (profile as DashboardProfile | null) ?? null,
    profileError: !!error,
    refreshTokenError: false,
  }
})

function currentBogotaMonth() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7) + '-01'
}

/** Si una sección falla en el servidor devolvemos null y el cliente la carga por su cuenta. */
async function settle<T>(label: string, promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    console.error(`[dashboard] Error precargando ${label}:`, error)
    return null
  }
}

/** Precarga en paralelo todos los datos que el dashboard necesita en la primera pintura. */
export async function loadDashboardInitialData(userId: string): Promise<DashboardInitialData> {
  const month = currentBogotaMonth()
  const fetchedAt = Date.now()
  // Una sola consulta de categorías compartida por transacciones, presupuestos y la lista
  const visibleCategories = categoryRepository.findAllVisibleForUser(userId)
  visibleCategories.catch(() => {}) // el error se reporta en cada sección que la usa
  const [transactions, categories, budgets, recurringExpenses] = await Promise.all([
    settle('transacciones', transactionUseCases.getTransactionsWithCalculations(userId, visibleCategories)),
    settle('categorías', visibleCategories.then((all) => categoryUseCases.groupCategories(all, userId))),
    settle('presupuestos', categoryBudgetService.getUserBudgetsWithSpent(userId, month, visibleCategories)),
    settle('gastos fijos', recurringExpenseUseCases.getAll(userId, visibleCategories)),
  ])

  return {
    fetchedAt,
    transactions,
    categories,
    budgets: budgets ? { month, items: budgets } : null,
    recurringExpenses,
  }
}
