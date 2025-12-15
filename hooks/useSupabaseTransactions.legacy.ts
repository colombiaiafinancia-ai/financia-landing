'use client'

import { useState, useEffect } from 'react'
import { transactionService } from '@/services/supabase/transactions'
import { Transaction, CategorySummary, WeeklySummary } from '@/types/database'

export const useSupabaseTransactions = (userId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los datos de transacciones
  const loadTransactionData = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      // Cargar en paralelo para mejor performance
      const [
        monthlyTransactions,
        categoryData,
        weeklyData
      ] = await Promise.all([
        transactionService.getMonthlyTransactions(userId),
        transactionService.getCategorySummary(userId),
        transactionService.getWeeklySummary(userId)
      ])

      setTransactions(monthlyTransactions)
      setCategorySummary(categoryData)
      setWeeklySummary(weeklyData)
    } catch (err) {
      console.error('Error loading transaction data:', err)
      setError('Error al cargar los datos de transacciones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransactionData()
  }, [userId])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return

    const subscription = transactionService.subscribeToTransactions(userId, () => {
      loadTransactionData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Agregar nueva transacción
  const addTransaction = async (monto: number, categoria: string, descripcion?: string) => {
    try {
      setError(null)
      await transactionService.createTransaction(userId, {
        monto,
        categoria,
        descripcion,
        fecha: new Date().toISOString().split('T')[0]
      })
      
      // Los datos se actualizarán automáticamente por la suscripción
    } catch (err) {
      console.error('Error adding transaction:', err)
      setError('Error al agregar la transacción')
      throw err
    }
  }

  // Eliminar transacción
  const deleteTransaction = async (transactionId: string) => {
    try {
      setError(null)
      await transactionService.deleteTransaction(transactionId)
      
      // Los datos se actualizarán automáticamente por la suscripción
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError('Error al eliminar la transacción')
      throw err
    }
  }

  // Obtener transacciones de un mes específico
  const getTransactionsByMonth = async (year: number, month: number) => {
    try {
      setError(null)
      return await transactionService.getMonthlyTransactions(userId, year, month)
    } catch (err) {
      console.error('Error getting transactions by month:', err)
      setError('Error al obtener transacciones del mes')
      return []
    }
  }

  // Calcular estadísticas rápidas
  const stats = {
    totalTransactions: transactions.length,
    totalSpent: transactions.reduce((sum, t) => sum + t.monto, 0),
    averageTransaction: transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.monto, 0) / transactions.length 
      : 0,
    mostUsedCategory: categorySummary.length > 0 ? categorySummary[0].categoria : null,
    thisWeekSpent: weeklySummary.length > 0 ? weeklySummary[weeklySummary.length - 1].total : 0,
    lastWeekSpent: weeklySummary.length > 1 ? weeklySummary[weeklySummary.length - 2].total : 0
  }

  return {
    transactions,
    categorySummary,
    weeklySummary,
    stats,
    addTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    loadTransactionData,
    isLoading,
    error
  }
} 