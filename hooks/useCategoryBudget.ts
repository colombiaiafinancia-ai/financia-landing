'use client'

import { useState, useEffect, useCallback } from 'react'
import { categoryBudgetService, type CategoryBudgetWithSpent } from '@/features/budgets/application/categoryBudgetService'

interface UseCategoryBudgetResult {
  budgetSummary: Array<{
    categoryId: string
    categoryName: string
    presupuestado: number
    actual: number
    excedente: number
    porcentajeUsado: number
  }>
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

export const useCategoryBudget = (userId: string): UseCategoryBudgetResult => {
  const [budgets, setBudgets] = useState<CategoryBudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentMonth = new Date().toISOString().slice(0, 10).replace(/-/g, '-').substring(0, 7) + '-01' // YYYY-MM-01

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
    fetchBudgets(true)
  }, [fetchBudgets])

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

  const stats = {
    totalPresupuestado: budgets.reduce((sum, b) => sum + b.budgeted, 0),
    totalGastado: budgets.reduce((sum, b) => sum + b.spent, 0),
    totalExcedente: budgets.reduce((sum, b) => sum + b.remaining, 0),
    categoriasConPresupuesto: budgets.length,
    categoriasSobrepasadas: budgets.filter(b => b.status === 'danger').length,
    categoriasBajoPresupuesto: budgets.filter(b => b.status === 'safe').length
  }

  const budgetSummary = budgets.map(b => ({
    categoryId: b.categoryId,
    categoryName: b.categoryName,
    presupuestado: b.budgeted,
    actual: b.spent,
    excedente: b.remaining,
    porcentajeUsado: b.percentage
  }))

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