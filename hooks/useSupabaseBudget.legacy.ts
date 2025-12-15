'use client'

import { useState, useEffect } from 'react'
import { budgetService } from '@/services/supabase/budget'
import { transactionService } from '@/services/supabase/transactions'
import { Budget } from '@/types/database'

interface BudgetData {
  totalBudget: number
  spent: number
  month: string
}

export const useSupabaseBudget = (userId: string) => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 0,
    spent: 0,
    month: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  }

  // Cargar datos del presupuesto y gastos
  const loadBudgetData = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      // Cargar presupuesto actual
      const budget = await budgetService.getCurrentBudget(userId)
      
      // Cargar gastos del mes
      const monthlySpent = await transactionService.getMonthlySpent(userId)

      setBudgetData({
        totalBudget: budget?.monto_mensual || 0,
        spent: monthlySpent,
        month: getCurrentMonth()
      })
    } catch (err) {
      console.error('Error loading budget data:', err)
      setError('Error al cargar los datos del presupuesto')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBudgetData()
  }, [userId])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return

    const budgetSubscription = budgetService.subscribeToBudgets(userId, () => {
      loadBudgetData()
    })

    const transactionSubscription = transactionService.subscribeToTransactions(userId, () => {
      loadBudgetData()
    })

    return () => {
      budgetSubscription.unsubscribe()
      transactionSubscription.unsubscribe()
    }
  }, [userId])

  const saveBudget = async (totalBudget: number) => {
    try {
      setError(null)
      await budgetService.saveBudget(userId, totalBudget)
      
      // Actualizar estado local inmediatamente
      setBudgetData(prev => ({
        ...prev,
        totalBudget
      }))
    } catch (err) {
      console.error('Error saving budget:', err)
      setError('Error al guardar el presupuesto')
      throw err
    }
  }

  const addExpense = async (amount: number, categoria: string, descripcion?: string) => {
    try {
      setError(null)
      await transactionService.createTransaction(userId, {
        monto: amount,
        categoria,
        descripcion,
        fecha: new Date().toISOString().split('T')[0]
      })
      
      // El estado se actualizará automáticamente por la suscripción en tiempo real
    } catch (err) {
      console.error('Error adding expense:', err)
      setError('Error al agregar el gasto')
      throw err
    }
  }

  const resetMonth = async () => {
    try {
      setError(null)
      // En lugar de resetear, mostramos los datos reales del mes
      await loadBudgetData()
    } catch (err) {
      console.error('Error resetting month:', err)
      setError('Error al cargar los datos del mes')
    }
  }

  const budgetRemaining = budgetData.totalBudget - budgetData.spent

  return {
    budgetData,
    budgetRemaining,
    saveBudget,
    addExpense,
    resetMonth,
    loadBudgetData,
    isLoading,
    error
  }
} 