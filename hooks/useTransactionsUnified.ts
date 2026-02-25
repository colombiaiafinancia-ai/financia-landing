'use client'

import { useState, useEffect, useCallback } from 'react'
import { TransactionService, TransactionDTOMapper, type TransactionDTO, type TransactionSummaryDTO, type CreateTransactionDTO } from '@/features/transactions'
import { getCurrentUser } from '@/services/supabase'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'
import { User } from '@supabase/supabase-js'
import { CategoryBudgetService } from '@/features/budgets'

export const useTransactionsUnified = (): AsyncState<TransactionSummaryDTO> & {
  transactions: TransactionDTO[]
  totalSpent: number
  totalIncome: number
  todayExpenses: number
  weekExpenses: number
  monthExpenses: number
  expensesByCategory: Record<string, number>
  weeklyTrend: import('@/features/transactions').WeeklyDataDTO[]
  user: User | null
  createTransaction: (data: CreateTransactionDTO) => Promise<TransactionDTO>
  deleteTransaction: (transactionId: string) => Promise<boolean>
  // Aliases de compatibilidad
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} => {
  const [state, setState] = useState<AsyncState<TransactionSummaryDTO>>(
    AsyncStateUtils.createInitial<TransactionSummaryDTO>()
  )
  const [optimisticTransactions, setOptimisticTransactions] = useState<TransactionDTO[]>([])

  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<TransactionDTO[]>([])
  const errorHandler = ErrorHandler

  // Obtener usuario autenticado - Solo una vez
  const loadUser = useCallback(async () => {
    try {
      // ✅ Usar cliente centralizado
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        console.log('👤 HOOK - User authenticated:', currentUser.id)
        setUser(currentUser)
      } else {
        console.log('👤 HOOK - No authenticated user')
        setUser(null)
      }
    } catch (err) {
      console.error('❌ HOOK - Error getting user:', err)
      errorHandler.handle(err, 'transactions', { action: 'auth' })
      setUser(null)
    }
  }, [errorHandler])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Función para cargar transacciones - Memoizada
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      // Usuario no autenticado - estado vacío pero válido
      const emptyDto: TransactionSummaryDTO = {
        totalSpent: 0,
        totalIncome: 0,
        balance: 0,
        todayExpenses: 0,
        weekExpenses: 0,
        monthExpenses: 0,
        transactionCount: 0,
        expensesByCategory: [],
        weeklyTrend: [],
        formattedTotalSpent: '$0',
        formattedTotalIncome: '$0',
        formattedBalance: '$0'
      }
      
      setState(AsyncStateUtils.createWithData(emptyDto, fetchTransactions))
      setTransactions([])
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      console.log('💰 HOOK - Loading transactions with calculations for user:', user.id)
      
      // ✅ Usar caso de uso que incluye todos los cálculos
      const data = await TransactionService.getWithCalculations(user.id)
      
      // ✅ Convertir a DTOs usando mappers
      const transactionDTOs = TransactionDTOMapper.transactionsToDTOs(data.transactions)
      const summaryDTO = TransactionDTOMapper.summaryToDTO({
        totalSpent: data.totalSpent,
        totalIncome: data.totalIncome,
        todayExpenses: data.todayExpenses,
        weekExpenses: data.weekExpenses,
        monthExpenses: data.monthExpenses,
        expensesByCategory: data.expensesByCategory
      }, data.transactions.length)
      
      // Agregar tendencia semanal al DTO
      const weeklyTrendDTOs = data.weeklyTrend.map(TransactionDTOMapper.weeklyDataToDTO)
      const completeSummaryDTO: TransactionSummaryDTO = {
        ...summaryDTO,
        weeklyTrend: weeklyTrendDTOs
      }
      
      console.log('✅ HOOK - Transactions loaded:', {
        transactionsCount: transactionDTOs.length,
        totalSpent: completeSummaryDTO.totalSpent,
        totalIncome: completeSummaryDTO.totalIncome,
        balance: completeSummaryDTO.balance
      })
      
      // Actualizar estados
      setTransactions([...transactionDTOs])
      setState(AsyncStateUtils.createWithData(completeSummaryDTO, fetchTransactions))
      
    } catch (err) {
      console.error('❌ HOOK - Error loading transactions:', err)
      const errorMessage = errorHandler.handle(err, 'transactions', { 
        action: 'fetch', 
        userId: user.id 
      })
      
      setState(AsyncStateUtils.createWithError(errorMessage, fetchTransactions))
      
      setTransactions([])
    }
  }, [user, errorHandler])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = useCallback(async (transactionData: CreateTransactionDTO): Promise<TransactionDTO> => {
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  console.log('💰 HOOK - Creating transaction:', transactionData)

  try {
    const newTransaction = await TransactionService.create(user.id, {
      valor: transactionData.amount,
      categoria: transactionData.category,
      tipo: transactionData.type,
      descripcion: transactionData.description
    })

    const transactionDTO = TransactionDTOMapper.transactionToDTO(newTransaction)

    // ✅ NUEVO: si es gasto, suma al gastado del budget de esa categoría (si existe)
    if (transactionData.type === 'gasto' && transactionData.category) {
      try {
        await CategoryBudgetService.addSpentFromTransaction(
          user.id,
          transactionData.category,
          transactionData.amount
        )
      } catch (e) {
        // No rompas la creación de transacción si falla el budget
        console.warn('⚠️ Budget gastado no actualizado (transacción sí creada):', e)
      }
    }

    console.log('✅ HOOK - Transaction created:', transactionDTO.id)

    await fetchTransactions()
    return transactionDTO
  } catch (error) {
    const errorMessage = errorHandler.handle(error, 'transactions', {
      action: 'create',
      userId: user.id,
      transactionData
    })
    throw new Error(errorMessage)
  }
}, [user, fetchTransactions, errorHandler])
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ HOOK - User not authenticated')
      return false
    }

    const tx = (optimisticTransactions.length > 0 ? optimisticTransactions : transactions)
      .find(t => t.id === transactionId)

    try {
      console.log('🗑️ HOOK - Deleting transaction:', transactionId)

      setOptimisticTransactions(prev => {
        const base = prev.length > 0 ? prev : transactions
        return base.filter(t => t.id !== transactionId)
      })

      await TransactionService.delete(transactionId, user.id)
      console.log('✅ HOOK - Transaction deleted successfully')

      // ✅ NUEVO: restar del gastado si era gasto
      if (tx?.type === 'gasto' && tx.category) {
        try {
          await CategoryBudgetService.subtractSpentFromTransaction(
            user.id,
            tx.category,
            tx.amount
          )
        } catch (e) {
          console.warn(
            '⚠️ Budget gastado no actualizado al eliminar (transacción sí eliminada):',
            e
          )
        }
      }

      await fetchTransactions()
      return true
    } catch (error) {
      console.error('❌ HOOK - Error, REVERTIENDO:', error)
      setOptimisticTransactions(transactions)
      errorHandler.handle(error, 'transactions', {
        action: 'delete',
        userId: user.id,
        transactionId
      })
      return false
    }
  }, [user, transactions, optimisticTransactions, fetchTransactions, errorHandler])



  // Extraer valores del DTO para compatibilidad
  const summaryData = state.data
  const expensesByCategory = summaryData?.expensesByCategory.reduce((acc, item) => {
    acc[item.categoria] = item.total
    return acc
  }, {} as Record<string, number>) || {}

  return {
    ...state,
    transactions: optimisticTransactions.length > 0 ? optimisticTransactions : transactions,
    totalSpent: summaryData?.totalSpent || 0,
    totalIncome: summaryData?.totalIncome || 0,
    todayExpenses: summaryData?.todayExpenses || 0,
    weekExpenses: summaryData?.weekExpenses || 0,
    monthExpenses: summaryData?.monthExpenses || 0,
    expensesByCategory,
    weeklyTrend: summaryData?.weeklyTrend ? [...summaryData.weeklyTrend] : [],
    user,
    createTransaction,
    deleteTransaction,
    // Aliases de compatibilidad
    loading: state.isLoading,
    error: state.error,
    refetch: state.refetch
  }

}