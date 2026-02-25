'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CategoryBudgetService,
  BudgetDTOMapper,
  type CategoryBudgetSummaryDTO,
  type BudgetStatsDTO
} from '@/features/budgets'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'

/**
 * Hook refactorizado para presupuestos por categoría - Usa AsyncState y DTOs
 *
 * Fix: memoriza expensesByCategory para que recargas (realtime/save/delete/refetch)
 * no vuelvan a calcular el summary con {} y "pierdan" categorías.
 */

export const useCategoryBudget = (
  userId: string
): AsyncState<CategoryBudgetSummaryDTO[]> & {
  budgetSummary: CategoryBudgetSummaryDTO[]
  stats: BudgetStatsDTO
  saveBudget: (categoria: string, amount: number) => Promise<void>
  deleteBudget: (categoria: string) => Promise<void>
  saveCategoryBudget: (categoria: string, amount: number) => Promise<void>
  deleteCategoryBudget: (categoria: string) => Promise<void>
  loadBudgetSummary: (expensesByCategory?: Record<string, number>) => Promise<void>
  // Aliases de compatibilidad
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} => {
  const [state, setState] = useState<AsyncState<CategoryBudgetSummaryDTO[]>>(
    AsyncStateUtils.createInitial<CategoryBudgetSummaryDTO[]>()
  )

  const [stats, setStats] = useState<BudgetStatsDTO>({
    totalPresupuestado: 0,
    totalGastado: 0,
    totalExcedente: 0,
    categoriasConPresupuesto: 0,
    categoriasSobrepasadas: 0,
    categoriasBajoPresupuesto: 0,
    porcentajeEjecucion: 0
  })

  const errorHandler = ErrorHandler

  // ✅ Guarda el último expensesByCategory que haya llegado al hook
  const lastExpensesRef = useRef<Record<string, number>>({})

  // Cargar resumen de presupuesto por categorías
  const loadBudgetSummary = useCallback(
    async (expensesByCategory?: Record<string, number>) => {
      if (!userId) return
      const raw = await CategoryBudgetService.getCurrent(userId)
      console.log('💥 DEBUG getCurrentCategoryBudgets:', raw)

      // ✅ si te pasan un mapa, lo memorizas
      if (expensesByCategory) {
        lastExpensesRef.current = expensesByCategory
      }

      // ✅ si NO te pasan nada, reutilizas el último conocido (evita caer en {})
      const effectiveExpenses = expensesByCategory ?? lastExpensesRef.current

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        console.log('💰 HOOK - Loading category budget summary for user:', userId)
        console.log('💰 HOOK - expensesByCategory keys:', Object.keys(effectiveExpenses).length)
        const raw = await CategoryBudgetService.getCurrent(userId)
        console.log('💥 DEBUG - RAW getCurrentCategoryBudgets:', raw)
        const [summaryData, statsData] = await Promise.all([
          CategoryBudgetService.getSummary(userId, effectiveExpenses),
          CategoryBudgetService.getStats(userId, effectiveExpenses)
        ])

        const summaryDTOs = summaryData.map(BudgetDTOMapper.categoryBudgetSummaryToDTO)
        const statsDTO = BudgetDTOMapper.statsToDTO(statsData)

        console.log('✅ HOOK - Category budget summary loaded:', {
          categories: summaryDTOs.length,
          totalPresupuestado: statsDTO.totalPresupuestado,
          totalGastado: statsDTO.totalGastado
        })

        // ✅ Importante: refetch NO debe capturar el expenses viejo; usa el último memoizado
        setState(AsyncStateUtils.createWithData(summaryDTOs, () => loadBudgetSummary()))
        setStats(statsDTO)
      } catch (err) {
        console.error('❌ HOOK - Error loading category budget summary:', err)

        const errorMessage = errorHandler.handle(err, 'categoryBudget', {
          action: 'load',
          userId,
          expensesCategoriesCount: Object.keys(effectiveExpenses).length
        })

        // ✅ refetch igual: recarga usando el último memoizado
        setState(AsyncStateUtils.createWithError(errorMessage, () => loadBudgetSummary()))

        // Reset stats on error
        setStats({
          totalPresupuestado: 0,
          totalGastado: 0,
          totalExcedente: 0,
          categoriasConPresupuesto: 0,
          categoriasSobrepasadas: 0,
          categoriasBajoPresupuesto: 0,
          porcentajeEjecucion: 0
        })
      }
    },
    [userId, errorHandler]
  )

  // Carga inicial
  useEffect(() => {
    loadBudgetSummary()
  }, [loadBudgetSummary])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return

    console.log('💰 HOOK - Setting up real-time subscription for user:', userId)

    try {
      const subscription = CategoryBudgetService.subscribe(userId, () => {
        console.log('💰 HOOK - Real-time change detected, reloading...')
        // ✅ ahora recarga con el último expensesByCategory memoizado (no con {})
        loadBudgetSummary()
      })

      return () => {
        console.log('💰 HOOK - Cleaning up subscription')
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('❌ HOOK - Error setting up subscription:', error)
      errorHandler.handle(error, 'categoryBudget', { action: 'subscribe', userId })
    }
  }, [userId, loadBudgetSummary, errorHandler])

  // Guardar presupuesto de una categoría
  const saveCategoryBudget = useCallback(
    async (categoria: string, amount: number) => {
      try {
        console.log('💰 HOOK - Saving category budget:', { categoria, amount })

        await CategoryBudgetService.save(userId, categoria, amount)

        console.log('✅ HOOK - Category budget saved successfully')

        // ✅ recarga con lastExpensesRef, no con {}
        await loadBudgetSummary()
      } catch (err) {
        console.error('❌ HOOK - Error saving category budget:', err)

        const errorMessage = errorHandler.handle(err, 'categoryBudget', {
          action: 'save',
          userId,
          categoria,
          amount
        })

        setState(prev => ({ ...prev, error: errorMessage }))
        throw new Error(errorMessage)
      }
    },
    [userId, loadBudgetSummary, errorHandler]
  )

  // Eliminar presupuesto de una categoría
  const deleteCategoryBudget = useCallback(
    async (categoria: string) => {
      try {
        console.log('💰 HOOK - Deleting category budget:', categoria)

        await CategoryBudgetService.delete(userId, categoria)

        console.log('✅ HOOK - Category budget deleted successfully')

        // ✅ recarga con lastExpensesRef, no con {}
        await loadBudgetSummary()
      } catch (err) {
        console.error('❌ HOOK - Error deleting category budget:', err)

        const errorMessage = errorHandler.handle(err, 'categoryBudget', {
          action: 'delete',
          userId,
          categoria
        })

        setState(prev => ({ ...prev, error: errorMessage }))
        throw new Error(errorMessage)
      }
    },
    [userId, loadBudgetSummary, errorHandler]
  )

  return {
    ...state,
    budgetSummary: state.data || [],
    stats,
    saveBudget: saveCategoryBudget,
    deleteBudget: deleteCategoryBudget,
    saveCategoryBudget,
    deleteCategoryBudget,
    loadBudgetSummary,
    // Aliases de compatibilidad
    loading: state.isLoading,
    error: state.error,
    refetch: state.refetch
  }
}