'use client'

import { useState, useEffect, useCallback } from 'react'
import { TransactionService, TransactionDTOMapper, type TransactionDTO, type TransactionSummaryDTO, type CreateTransactionDTO } from '@/features/transactions'
import { getCurrentUser } from '@/services/supabase'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'
import { User } from '@supabase/supabase-js'

/**
 * Hook refactorizado para transacciones unificadas - Usa AsyncState y DTOs
 * 
 * ✅ Solo maneja UI state
 * ✅ Usa DTOs en lugar de entidades directas
 * ✅ Sigue el contrato AsyncState estándar
 * ✅ Manejo de errores estandarizado
 */
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
      
      // Reset states on error
      setTransactions([])
    }
  }, [user, errorHandler])

  // Cargar transacciones cuando se monte el componente o cambie el usuario
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: CreateTransactionDTO): Promise<TransactionDTO> => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    console.log('💰 HOOK - Creating transaction:', transactionData)
    
    try {
      // ✅ Usar caso de uso en lugar de acceso directo
      const newTransaction = await TransactionService.create(user.id, {
        valor: transactionData.amount,
        categoria: transactionData.category,
        tipo: transactionData.type,
        descripcion: transactionData.description
      })
      
      // ✅ Convertir a DTO
      const transactionDTO = TransactionDTOMapper.transactionToDTO(newTransaction)
      
      console.log('✅ HOOK - Transaction created:', transactionDTO.id)

      // Recargar transacciones después de crear una nueva
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
      errorHandler.handle(error, 'transactions', { 
        action: 'delete', 
        userId: user.id, 
        transactionId 
      })
      return false
    }
  }, [user, fetchTransactions, errorHandler])

  // Extraer valores del DTO para compatibilidad
  const summaryData = state.data
  const expensesByCategory = summaryData?.expensesByCategory.reduce((acc, item) => {
    acc[item.categoria] = item.total
    return acc
  }, {} as Record<string, number>) || {}

  return {
    ...state,
    transactions,
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