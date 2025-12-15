'use client'

import { useState, useEffect } from 'react'
import { categoryBudgetService } from '@/services/supabase/categoryBudget'
import { CategoryBudgetSummary } from '@/types/database'

export const useCategoryBudget = (userId: string) => {
  const [budgetSummary, setBudgetSummary] = useState<CategoryBudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar resumen de presupuesto por categorías
  const loadBudgetSummary = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      const summary = await categoryBudgetService.getCategoryBudgetSummary(userId)
      setBudgetSummary(summary)
    } catch (err) {
      console.error('Error loading category budget summary:', err)
      setError('Error al cargar el resumen de presupuesto por categorías')
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

    const subscription = categoryBudgetService.subscribeToCategoryBudgets(userId, () => {
      loadBudgetSummary()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Guardar presupuesto de una categoría
  const saveCategoryBudget = async (categoria: string, amount: number) => {
    try {
      setError(null)
      await categoryBudgetService.saveCategoryBudget(userId, categoria, amount)
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('Error saving category budget:', err)
      setError('Error al guardar el presupuesto de la categoría')
      throw err
    }
  }

  // Eliminar presupuesto de una categoría
  const deleteCategoryBudget = async (categoria: string) => {
    try {
      setError(null)
      await categoryBudgetService.deleteCategoryBudget(userId, categoria)
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('Error deleting category budget:', err)
      setError('Error al eliminar el presupuesto de la categoría')
      throw err
    }
  }

  // Estadísticas calculadas
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
    loadBudgetSummary
  }
} 