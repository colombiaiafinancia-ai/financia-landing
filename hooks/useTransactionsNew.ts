/**
 * Hook de Transacciones - Solo UI State
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
import { TransactionService } from '@/features/transactions'
import { getCurrentUser } from '@/services/supabase'
import { User } from '@supabase/supabase-js'
import type { 
  Transaction, 
  TransactionCreateData, 
  TransactionPeriodCalculations,
  WeeklyData 
} from '@/features/transactions/domain/transactionLogic'

export const useTransactionsNew = () => {
  // Estado de UI únicamente
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Cargar usuario
  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        if (mounted) {
          console.error('Error getting user:', err)
          setUser(null)
        }
      }
    }
    
    getUser()
    
    return () => {
      mounted = false
    }
  }, [])

  // Cargar transacciones
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Usar caso de uso para obtener transacciones
      const userTransactions = await TransactionService.getAll(user.id)
      setTransactions(userTransactions)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cargar transacciones cuando cambie el usuario
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: TransactionCreateData) => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setError(null)
      
      // Usar caso de uso para crear transacción
      const newTransaction = await TransactionService.create(user.id, transactionData)
      
      // Actualizar estado local
      setTransactions(prev => [newTransaction, ...prev])
      
      return newTransaction
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError(err instanceof Error ? err.message : 'Error al crear transacción')
      throw err
    }
  }, [user])

  // Eliminar transacción
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!user) {
      return false
    }

    try {
      setError(null)
      
      // Usar caso de uso para eliminar transacción
      await TransactionService.delete(transactionId, user.id)
      
      // Actualizar estado local
      setTransactions(prev => prev.filter(t => t.id !== transactionId))
      
      return true
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar transacción')
      return false
    }
  }, [user])

  // Cálculos derivados usando useMemo para optimización
  const calculations = useMemo((): TransactionPeriodCalculations => {
    if (!transactions.length) {
      return {
        todayExpenses: 0,
        weekExpenses: 0,
        monthExpenses: 0,
        totalSpent: 0,
        totalIncome: 0
      }
    }

    // Usar lógica de dominio para cálculos
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate())
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    let todayExpenses = 0
    let weekExpenses = 0
    let monthExpenses = 0
    let totalSpent = 0
    let totalIncome = 0
    
    transactions.forEach(t => {
      if (!t.creado_en) return
      
      const transactionDate = new Date(t.creado_en)
      const valor = t.valor || 0
      
      if (t.tipo === 'gasto') {
        totalSpent += valor
        
        if (transactionDate >= todayStart && transactionDate <= todayEnd) {
          todayExpenses += valor
        }
        
        if (transactionDate >= weekStart && transactionDate <= todayEnd) {
          weekExpenses += valor
        }
        
        if (transactionDate >= firstDayOfMonth && transactionDate <= todayEnd) {
          monthExpenses += valor
        }
      } else if (t.tipo === 'ingreso') {
        totalIncome += valor
      }
    })
    
    return {
      todayExpenses,
      weekExpenses,
      monthExpenses,
      totalSpent,
      totalIncome
    }
  }, [transactions])

  // Gastos por categoría
  const expensesByCategory = useMemo(() => {
    return transactions
      .filter(t => t.tipo === 'gasto' && t.categoria)
      .reduce((acc, t) => {
        if (t.categoria) {
          acc[t.categoria] = (acc[t.categoria] || 0) + (t.valor || 0)
        }
        return acc
      }, {} as Record<string, number>)
  }, [transactions])

  // Tendencia semanal
  const weeklyTrend = useMemo((): WeeklyData[] => {
    if (transactions.length === 0) {
      return []
    }
    
    const weeks = []
    const today = new Date()
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
      
      const weekTransactions = transactions.filter(t => {
        if (!t.creado_en || t.tipo !== 'gasto') return false
        const transactionDate = new Date(t.creado_en)
        return transactionDate >= weekStart && transactionDate <= weekEnd
      })
      
      const weekTotal = weekTransactions.reduce((sum, t) => sum + (t.valor || 0), 0)
      const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
      
      weeks.push({
        amount: weekTotal,
        date: weekStart.toLocaleDateString('es-CO'),
        week: weekLabel
      })
    }
    
    return weeks
  }, [transactions])

  return {
    // Estado
    transactions,
    loading,
    error,
    user,
    
    // Cálculos
    totalSpent: calculations.totalSpent,
    totalIncome: calculations.totalIncome,
    todayExpenses: calculations.todayExpenses,
    weekExpenses: calculations.weekExpenses,
    monthExpenses: calculations.monthExpenses,
    expensesByCategory,
    weeklyTrend,
    
    // Operaciones
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  }
}
