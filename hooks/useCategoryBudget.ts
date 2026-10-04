'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { categoryBudgetService, type CategoryBudgetWithSpent } from '@/features/budgets/application/categoryBudgetService'
import {
  dashboardCacheKey,
  isStale,
  resolveInitial,
  writeDashboardCache,
} from '@/lib/dashboard/client-cache'

export type CategoryBudgetSummaryItem = {
  categoryId: string
  categoryName: string
  presupuestado: number
  actual: number
  excedente: number
  porcentajeUsado: number
}

interface UseCategoryBudgetResult {
  budgetSummary: CategoryBudgetSummaryItem[]
  stats: {
    totalPresupuestado: number
    totalGastado: number
    totalExcedente: number
    categoriasConPresupuesto: number
    categoriasSobrepasadas: number
    categoriasBajoPresupuesto: number
  }
  loading: boolean
  refreshing: boolean
  error: string | null
  saveCategoryBudget: (categoryId: string, amount: number) => Promise<void>
  deleteCategoryBudget: (categoryId: string) => Promise<void>
  refetch: () => Promise<void>
}

export const useCategoryBudget = (
  userId: string,
  refreshKey: number = 0,
  initial?: { month: string; items: CategoryBudgetWithSpent[]; fetchedAt?: number } | null
): UseCategoryBudgetResult => {
  const currentMonth =
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7) + '-01'
  const cacheKey = userId ? dashboardCacheKey('budgets', userId, currentMonth) : null

  const [initialState] = useState(() =>
    resolveInitial<CategoryBudgetWithSpent[]>(
      cacheKey,
      initial && initial.month === currentMonth ? initial.items : null,
      initial?.fetchedAt
    )
  )
  const [budgets, setBudgets] = useState<CategoryBudgetWithSpent[]>(initialState.data ?? [])
  const [loading, setLoading] = useState(!initialState.data)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasDataRef = useRef(initialState.data != null)
  const skipInitialFetch = useRef(initialState.data != null && !isStale(initialState.at))

  const fetchBudgets = useCallback(async (showLoading = true) => {
    if (!userId) {
      setBudgets([])
      setLoading(false)
      return
    }

    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)

      const data = await categoryBudgetService.getUserBudgetsWithSpent(userId, currentMonth)
      writeDashboardCache(dashboardCacheKey('budgets', userId, currentMonth), data)
      hasDataRef.current = true
      setBudgets(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar presupuestos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, currentMonth])

  useEffect(() => {
    // Con datos precargados y frescos no hace falta la primera consulta
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }
    // Si ya hay datos (precarga o caché) se refresca sin loader
    fetchBudgets(!hasDataRef.current)
  }, [fetchBudgets, refreshKey])

  const saveCategoryBudget = async (categoryId: string, amount: number) => {
    if (!userId) return
    await categoryBudgetService.saveBudget(userId, categoryId, amount)
    await fetchBudgets(false) // refresca en segundo plano
  }

  const deleteCategoryBudget = async (categoryId: string) => {
    if (!userId) return
    await categoryBudgetService.deleteBudget(userId, categoryId)
    await fetchBudgets(false)
  }

  const stats = useMemo(() => ({
    totalPresupuestado: budgets.reduce((sum, b) => sum + b.budgeted, 0),
    totalGastado: budgets.reduce((sum, b) => sum + b.spent, 0),
    totalExcedente: budgets.reduce((sum, b) => sum + b.remaining, 0),
    categoriasConPresupuesto: budgets.length,
    categoriasSobrepasadas: budgets.filter(b => b.status === 'danger').length,
    categoriasBajoPresupuesto: budgets.filter(b => b.status === 'safe').length
  }), [budgets])

  const budgetSummary = useMemo(() => budgets.map(b => ({
    categoryId: b.categoryId,
    categoryName: b.categoryName,
    presupuestado: b.budgeted,
    actual: b.spent,
    excedente: b.remaining,
    porcentajeUsado: b.percentage
  })), [budgets])

  return {
    budgetSummary,
    stats,
    loading,
    refreshing,
    error,
    saveCategoryBudget,
    deleteCategoryBudget,
    refetch: () => fetchBudgets(true)
  }
}
