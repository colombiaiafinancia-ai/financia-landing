'use client'

import { useState, useEffect, useCallback } from 'react'
import { TransactionService, type Transaction, type WeeklyData } from '@/features/transactions'
import { getCurrentUser } from '@/services/supabase'
import { User } from '@supabase/supabase-js'

/**
 * Hook refactorizado para transacciones unificadas - Solo maneja UI state
 * 
 * La lógica de negocio y acceso a datos se delegó a TransactionService
 */
export const useTransactionsUnified = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Estados calculados
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [weekExpenses, setWeekExpenses] = useState(0)
  const [monthExpenses, setMonthExpenses] = useState(0)
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({})
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyData[]>([])

  // Obtener usuario autenticado - Solo una vez
  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        // ✅ Usar cliente centralizado
        const currentUser = await getCurrentUser()
        
        if (mounted) {
          if (currentUser) {
            console.log('👤 HOOK - User authenticated:', currentUser.id)
            setUser(currentUser)
          } else {
            console.log('👤 HOOK - No authenticated user')
            setUser(null)
          }
        }
      } catch (err) {
        console.error('❌ HOOK - Error getting user:', err)
        if (mounted) {
          setUser(null)
        }
      }
    }
    
    getUser()
    
    return () => {
      mounted = false
    }
  }, [])

  // Función para cargar transacciones - Memoizada
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('💰 HOOK - Loading transactions with calculations for user:', user.id)
      
      // ✅ Usar caso de uso que incluye todos los cálculos
      const data = await TransactionService.getWithCalculations(user.id)
      
      console.log('✅ HOOK - Transactions loaded:', data.transactions.length)
      
      // Actualizar todos los estados
      setTransactions(data.transactions)
      setTotalSpent(data.totalSpent)
      setTotalIncome(data.totalIncome)
      setTodayExpenses(data.todayExpenses)
      setWeekExpenses(data.weekExpenses)
      setMonthExpenses(data.monthExpenses)
      setExpensesByCategory(data.expensesByCategory)
      setWeeklyTrend(data.weeklyTrend)
      
    } catch (err) {
      console.error('❌ HOOK - Error loading transactions:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar transacciones'
      setError(errorMessage)
      
      // Reset states on error
      setTransactions([])
      setTotalSpent(0)
      setTotalIncome(0)
      setTodayExpenses(0)
      setWeekExpenses(0)
      setMonthExpenses(0)
      setExpensesByCategory({})
      setWeeklyTrend([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cargar transacciones cuando se monte el componente o cambie el usuario
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: {
    valor: number
    categoria: string
    tipo: 'gasto' | 'ingreso'
    descripcion?: string
  }) => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    console.log('💰 HOOK - Creating transaction:', transactionData)
    
    // ✅ Usar caso de uso en lugar de acceso directo
    const newTransaction = await TransactionService.create(user.id, transactionData)
    
    console.log('✅ HOOK - Transaction created:', newTransaction.id)

    // Recargar transacciones después de crear una nueva
    await fetchTransactions()
    return newTransaction
  }, [user, fetchTransactions])

  // Función para eliminar una transacción
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ HOOK - User not authenticated')
      return false
    }

    try {
      console.log('🗑️ HOOK - Deleting transaction:', transactionId)

      // ✅ Usar caso de uso en lugar de acceso directo
      await TransactionService.delete(transactionId, user.id)

      console.log('✅ HOOK - Transaction deleted successfully')
      
      // Refrescar datos después de eliminar
      await fetchTransactions()
      return true
    } catch (error) {
      console.error('❌ HOOK - Error deleting transaction:', error)
      return false
    }
  }, [user, fetchTransactions])

  return {
    transactions,
    loading,
    error,
    totalSpent,
    totalIncome,
    todayExpenses,
    weekExpenses,
    monthExpenses,
    expensesByCategory,
    weeklyTrend,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
    user
  }
}