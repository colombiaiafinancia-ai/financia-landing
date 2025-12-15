/**
 * Hook de Presupuesto por Categoría - Solo UI State
 * 
 * RESPONSABILIDAD: Manejo de estado de UI únicamente
 * - useState para estado local
 * - useEffect para efectos de UI
 * - Llamadas a casos de uso
 * 
 * NO CONTIENE:
 * ❌ Lógica de negocio
 * ❌ Acceso directo a Supabase
 * ❌ Validaciones de dominio
 * ❌ Cálculos complejos
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 2 - Hooks Simplificados
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CategoryBudgetService } from '@/features/budgets'
import { TransactionService } from '@/features/transactions'
import type { CategoryBudgetSummary, BudgetStats } from '@/features/budgets/domain/budgetLogic'

export const useCategoryBudgetNew = (userId: string) => {
  // Estado de UI únicamente
  const [budgetSummary, setBudgetSummary] = useState<CategoryBudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar resumen de presupuesto por categorías
  const loadBudgetSummary = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      // Obtener gastos por categoría usando caso de uso de transacciones
      const expensesByCategory = await TransactionService.getExpensesByCategory(userId)
      
      // Obtener resumen usando caso de uso de presupuestos por categoría
      const summary = await CategoryBudgetService.getSummary(userId, expensesByCategory)
      setBudgetSummary(summary)
    } catch (err) {
      console.error('Error loading category budget summary:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el resumen de presupuesto por categorías')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Cargar datos al montar el componente o cambiar userId
  useEffect(() => {
    loadBudgetSummary()
  }, [loadBudgetSummary])

  // Guardar presupuesto de una categoría
  const saveCategoryBudget = useCallback(async (categoria: string, amount: number) => {
    try {
      setError(null)
      
      // Usar caso de uso para guardar presupuesto por categoría
      await CategoryBudgetService.save(userId, categoria, amount)
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('Error saving category budget:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el presupuesto de la categoría')
      throw err
    }
  }, [userId, loadBudgetSummary])

  // Eliminar presupuesto de una categoría
  const deleteCategoryBudget = useCallback(async (categoria: string) => {
    try {
      setError(null)
      
      // Usar caso de uso para eliminar presupuesto por categoría
      await CategoryBudgetService.delete(userId, categoria)
      
      // Recargar datos
      await loadBudgetSummary()
    } catch (err) {
      console.error('Error deleting category budget:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar el presupuesto de la categoría')
      throw err
    }
  }, [userId, loadBudgetSummary])

  // Estadísticas calculadas usando useMemo para optimización
  const stats = useMemo((): BudgetStats => {
    const totalPresupuestado = budgetSummary.reduce((sum, item) => sum + item.presupuestado, 0)
    const totalGastado = budgetSummary.reduce((sum, item) => sum + item.actual, 0)
    const totalExcedente = budgetSummary.reduce((sum, item) => sum + item.excedente, 0)
    const categoriasConPresupuesto = budgetSummary.filter(item => item.presupuestado > 0).length
    const categoriasSobrepasadas = budgetSummary.filter(item => item.excedente < 0).length
    const categoriasBajoPresupuesto = budgetSummary.filter(item => item.excedente > 0 && item.presupuestado > 0).length

    return {
      totalPresupuestado,
      totalGastado,
      totalExcedente,
      categoriasConPresupuesto,
      categoriasSobrepasadas,
      categoriasBajoPresupuesto
    }
  }, [budgetSummary])

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
