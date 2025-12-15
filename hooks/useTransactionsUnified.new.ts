/**
 * Hook de Transacciones Unificado - Solo UI State
 * 
 * RESPONSABILIDAD: Manejo de estado de UI únicamente
 * - useState para estado local
 * - useEffect para efectos de lado
 * - Llamadas a casos de uso
 * 
 * NO CONTIENE:
 * ❌ Lógica de negocio
 * ❌ Queries directos a Supabase
 * ❌ Validaciones de dominio
 * ❌ Cálculos de períodos
 * ❌ Transformaciones de datos
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { getCurrentUser } from '@/services/supabase'
import { TransactionService } from '@/features/transactions'
import { calculatePeriodExpenses, getWeeklyTrend, getExpensesByCategory, type Transaction } from '@/features/transactions/domain/transactionLogic'
import { User } from '@supabase/supabase-js'

export interface UseTransactionsUnifiedReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  totalSpent: number
  totalIncome: number
  todayExpenses: number
  weekExpenses: number
  monthExpenses: number
  expensesByCategory: Record<string, number>
  weeklyTrend: Array<{
    week: string
    amount: number
    date: string
  }>
  refetch: () => Promise<void>
  createTransaction: (transactionData: {
    valor: number
    categoria: string
    tipo: 'gasto' | 'ingreso'
    descripcion?: string
  }) => Promise<any>
  deleteTransaction: (transactionId: string) => Promise<boolean>
  user: User | null
}

export const useTransactionsUnified = (): UseTransactionsUnifiedReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Obtener usuario autenticado - Solo una vez
  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('❌ TRANSACTIONS_HOOK - Error getting user:', err)
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
    try {
      setLoading(true)
      setError(null)
      
      console.log('📋 TRANSACTIONS_HOOK - Loading transactions...')
      
      // Verificar autenticación
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        console.log('⚠️ TRANSACTIONS_HOOK - No user authenticated')
        setLoading(false)
        setTransactions([])
        return
      }

      console.log('📋 TRANSACTIONS_HOOK - User authenticated:', currentUser.id)
      
      // Usar caso de uso para obtener transacciones (formato legacy para compatibilidad)
      const data = await TransactionService.getLegacyFormat(currentUser.id)
      
      console.log('✅ TRANSACTIONS_HOOK - Transactions loaded:', data?.length || 0)
      setTransactions(data || [])
    } catch (err) {
      console.error('❌ TRANSACTIONS_HOOK - Error loading transactions:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar transacciones cuando se monte el componente
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Cálculos derivados - Optimizados con useMemo
  const calculations = useMemo(() => {
    return calculatePeriodExpenses(transactions)
  }, [transactions])

  // Gastos por categoría
  const expensesByCategory = useMemo(() => {
    return getExpensesByCategory(transactions)
  }, [transactions])

  // Tendencia semanal - Optimizada
  const weeklyTrend = useMemo(() => {
    return getWeeklyTrend(transactions)
  }, [transactions])

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: {
    valor: number
    categoria: string
    tipo: 'gasto' | 'ingreso'
    descripcion?: string
  }) => {
    console.log('💰 TRANSACTIONS_HOOK - Creating transaction...')
    
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    try {
      // Usar caso de uso para crear transacción (formato legacy para compatibilidad)
      const result = await TransactionService.createLegacy(transactionData, user.id)
      
      console.log('✅ TRANSACTIONS_HOOK - Transaction created:', result)

      // Recargar transacciones después de crear una nueva
      await fetchTransactions()
      return result
    } catch (error) {
      console.error('❌ TRANSACTIONS_HOOK - Error creating transaction:', error)
      throw error
    }
  }, [user, fetchTransactions])

  // Función para eliminar una transacción
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      console.log('🗑️ TRANSACTIONS_HOOK - Deleting transaction:', transactionId)

      if (!user) {
        console.error('❌ TRANSACTIONS_HOOK - No user authenticated')
        return false
      }

      // Usar caso de uso para eliminar transacción (formato legacy para compatibilidad)
      const success = await TransactionService.deleteLegacy(transactionId, user.id)

      if (success) {
        console.log('✅ TRANSACTIONS_HOOK - Transaction deleted successfully')
        // Refrescar datos después de eliminar
        await fetchTransactions()
        return true
      } else {
        console.error('❌ TRANSACTIONS_HOOK - Failed to delete transaction')
        return false
      }
    } catch (error) {
      console.error('💥 TRANSACTIONS_HOOK - Unexpected error deleting transaction:', error)
      return false
    }
  }, [user, fetchTransactions])

  return {
    transactions,
    loading,
    error,
    totalSpent: calculations.totalSpent,
    totalIncome: calculations.totalIncome,
    todayExpenses: calculations.todayExpenses,
    weekExpenses: calculations.weekExpenses,
    monthExpenses: calculations.monthExpenses,
    expensesByCategory,
    weeklyTrend,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
    user
  }
}
