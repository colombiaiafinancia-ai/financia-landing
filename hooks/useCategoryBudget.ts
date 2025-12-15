'use client'

import { useState, useEffect } from 'react'
import { CategoryBudgetService, type CategoryBudgetSummary } from '@/features/budgets'

/**
 * Hook refactorizado para presupuestos por categoría - Solo maneja UI state
 * 
 * La lógica de negocio y acceso a datos se delegó a CategoryBudgetService
 */
export const useCategoryBudget = (userId: string) => {
  const [budgetSummary, setBudgetSummary] = useState<CategoryBudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar resumen de presupuesto por categorías
  const loadBudgetSummary = async (expensesByCategory: Record<string, number> = {}) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('💰 HOOK - Loading category budget summary for user:', userId)
      
      // ✅ Usar caso de uso en lugar de servicio legacy
      const summary = await CategoryBudgetService.getSummary(userId, expensesByCategory)
      
      console.log('✅ HOOK - Category budget summary loaded:', summary.length, 'categories')
      setBudgetSummary(summary)
    } catch (err) {
      console.error('❌ HOOK - Error loading category budget summary:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el resumen de presupuesto por categorías'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgetSummary()
  }, [userId])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return

    console.log('💰 HOOK - Setting up real-time subscription for user:', userId)

    // ✅ Usar caso de uso para suscripción
    const subscription = CategoryBudgetService.subscribe(userId, () => {
      console.log('💰 HOOK - Real-time change detected, reloading...')
      loadBudgetSummary()
    })

    return () => {
      console.log('💰 HOOK - Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [userId])

  // Guardar presupuesto de una categoría
  const saveCategoryBudget = async (categoria: string, amount: number) => {
    try {
      setError(null)
      
      console.log('💰 HOOK - Saving category budget:', { categoria, amount })
      
      // ✅ Usar caso de uso en lugar de servicio legacy
      await CategoryBudgetService.save(userId, categoria, amount)
      
      console.log('✅ HOOK - Category budget saved successfully')
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('❌ HOOK - Error saving category budget:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el presupuesto de la categoría'
      setError(errorMessage)
      throw err
    }
  }

  // Eliminar presupuesto de una categoría
  const deleteCategoryBudget = async (categoria: string) => {
    try {
      setError(null)
      
      console.log('💰 HOOK - Deleting category budget:', categoria)
      
      // ✅ Usar caso de uso en lugar de servicio legacy
      await CategoryBudgetService.delete(userId, categoria)
      
      console.log('✅ HOOK - Category budget deleted successfully')
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('❌ HOOK - Error deleting category budget:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el presupuesto de la categoría'
      setError(errorMessage)
      throw err
    }
  }

  // ✅ Usar lógica de dominio para estadísticas (calculadas en el caso de uso)
  const stats = {
    totalPresupuestado: budgetSummary.reduce((sum, item) => sum + item.presupuestado, 0),
    totalGastado: budgetSummary.reduce((sum, item) => sum + item.actual, 0),
    totalExcedente: budgetSummary.reduce((sum, item) => sum + item.excedente, 0),
    categoriasConPresupuesto: budgetSummary.filter(item => item.presupuestado > 0).length,
    categoriasSobrepasadas: budgetSummary.filter(item => item.excedente < 0).length,
    categoriasBajoPresupuesto: budgetSummary.filter(item => item.excedente > 0 && item.presupuestado > 0).length
  }

  return {
    budgetSummary,
    stats,
    loading,
    error,
    saveBudget: saveCategoryBudget,
    deleteBudget: deleteCategoryBudget,
    saveCategoryBudget,
    deleteCategoryBudget,
    loadBudgetSummary: () => loadBudgetSummary()
  }
}