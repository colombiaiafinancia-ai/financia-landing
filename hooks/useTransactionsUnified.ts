'use client'

import { useState, useEffect, useCallback } from 'react'
import { transactionUseCases } from '@/features/transactions/application/transactionUseCases'
import { TransactionDTOMapper, TransactionDTO } from '@/features/transactions/dto/transactionDTO'
import { getCurrentUser } from '@/services/supabase'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'
import type { TransactionsBundle } from '@/lib/dashboard/types'
import {
  dashboardCacheKey,
  isStale,
  resolveInitial,
  writeDashboardCache,
} from '@/lib/dashboard/client-cache'

type UseTransactionsOptions = {
  /** Usuario ya verificado en el servidor (evita otra llamada a Auth). */
  userId?: string
  /** Datos precargados en el servidor. */
  initialData?: TransactionsBundle | null
  initialFetchedAt?: number
}

function toSummary(result: TransactionsBundle) {
  return {
    totalSpent: result.totalSpent,
    totalIncome: result.totalIncome,
    initialBalance: result.initialBalance,
    availableBalance: result.availableBalance,
    todayExpenses: result.todayExpenses,
    weekExpenses: result.weekExpenses,
    monthExpenses: result.monthExpenses,
    expensesByCategory: result.expensesByCategory,
    incomeByCategory: result.incomeByCategory,
    weeklyTrend: result.weeklyTrend
  }
}

export const useTransactionsUnified = (options: UseTransactionsOptions = {}) => {
  const cacheKey = options.userId ? dashboardCacheKey('transactions', options.userId) : null
  // Se resuelve una sola vez al montar: dato del servidor o de la caché, el más reciente
  const [initial] = useState(() =>
    resolveInitial<TransactionsBundle>(cacheKey, options.initialData, options.initialFetchedAt)
  )
  const [state, setState] = useState<AsyncState<any>>(() =>
    initial.data
      ? AsyncStateUtils.createWithData(toSummary(initial.data), async () => {})
      : AsyncStateUtils.createInitial()
  )
  const [transactions, setTransactions] = useState<TransactionDTO[]>(() =>
    initial.data ? TransactionDTOMapper.transactionsToDTOs(initial.data.transactions) : []
  )
  const [dailyTrend, setDailyTrend] = useState<Array<{ date: string; amount: number }>>(initial.data?.dailyTrend ?? [])
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; amount: number }>>(initial.data?.monthlyTrend ?? [])
  const [loadingTrend, setLoadingTrend] = useState<'daily' | 'monthly' | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(options.userId ? { id: options.userId } : null)
  const errorHandler = ErrorHandler

  useEffect(() => {
    if (options.userId) return
    // Compatibilidad: componentes que no reciben el usuario desde el servidor
    getCurrentUser().then(setUser)
  }, [options.userId])

  /** `silent`: refresco tras CRUD sin activar el loader de pantalla completa (como `fetchBudgets(false)`). */
  const fetchData = useCallback(async (silent = false) => {
    const refetchSilent = () => fetchData(true)

    if (!user) {
      setState(AsyncStateUtils.createWithData(null, refetchSilent))
      setTransactions([])
      setDailyTrend([])
      setMonthlyTrend([])
      return
    }

    try {
      if (!silent) {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
      } else {
        setState(prev => ({ ...prev, error: null }))
      }

      const result = await transactionUseCases.getTransactionsWithCalculations(user.id)
      writeDashboardCache(dashboardCacheKey('transactions', user.id), result)

      setTransactions(TransactionDTOMapper.transactionsToDTOs(result.transactions))
      setDailyTrend(result.dailyTrend)
      setMonthlyTrend(result.monthlyTrend)
      setState(AsyncStateUtils.createWithData(toSummary(result), refetchSilent))

    } catch (err) {
      const errorMessage = errorHandler.handle(err, 'transactions', { userId: user.id })
      setState(AsyncStateUtils.createWithError(errorMessage, refetchSilent))
    }
  }, [user, errorHandler])

  const hasInitialData = initial.data != null
  const initialIsStale = isStale(initial.at)
  useEffect(() => {
    if (!hasInitialData) {
      void fetchData()
    } else if (user && initialIsStale) {
      // Revalidación silenciosa: se muestran los datos disponibles mientras tanto
      void fetchData(true)
    }
  }, [fetchData, hasInitialData, initialIsStale, user])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  const fetchDailyTrend = useCallback(async () => {
    if (!user) return
    setLoadingTrend('daily')
    try {
      const data = await transactionUseCases.getDailyTrend(user.id, 7)
      setDailyTrend(data)
    } catch (err) {
      errorHandler.handle(err, 'transactions', { action: 'fetchDailyTrend' })
    } finally {
      setLoadingTrend(null)
    }
  }, [user, errorHandler])

  const fetchMonthlyTrend = useCallback(async () => {
    if (!user) return
    setLoadingTrend('monthly')
    try {
      const data = await transactionUseCases.getMonthlyTrend(user.id, 12)
      setMonthlyTrend(data)
    } catch (err) {
      errorHandler.handle(err, 'transactions', { action: 'fetchMonthlyTrend' })
    } finally {
      setLoadingTrend(null)
    }
  }, [user, errorHandler])

  const createTransaction = useCallback(async (data: { amount: number; category: string; type: 'gasto' | 'ingreso'; description?: string }) => {
    if (!user) throw new Error('Usuario no autenticado')
    await transactionUseCases.createTransaction(user.id, {
      amount: data.amount,
      categoryId: data.category,
      direction: data.type,
      description: data.description
    })
    await fetchData(true)
  }, [user, fetchData])

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!user) return false
    try {
      await transactionUseCases.deleteTransaction(transactionId, user.id)
      await fetchData(true)
      return true
    } catch (err) {
      errorHandler.handle(err, 'transactions', { action: 'delete', transactionId })
      return false
    }
  }, [user, fetchData, errorHandler])

  const updateTransaction = useCallback(
    async (
      transactionId: string,
      data: {
        amount?: number
        categoryId?: string
        direction?: 'gasto' | 'ingreso'
        description?: string | null
        occurredAt?: string
      }
    ) => {
      if (!user) return false
      try {
        await transactionUseCases.updateTransaction(user.id, transactionId, data)
        await fetchData(true)
        return true
      } catch (err) {
        errorHandler.handle(err, 'transactions', { action: 'update', transactionId })
        return false
      }
    },
    [user, fetchData, errorHandler]
  )

  const summaryData = state.data

  return {
    ...state,
    transactions,
    dailyTrend,
    monthlyTrend,
    loadingTrend,
    fetchDailyTrend,
    fetchMonthlyTrend,
    totalSpent: summaryData?.totalSpent || 0,
    totalIncome: summaryData?.totalIncome || 0,
    initialBalance: summaryData?.initialBalance || 0,
    availableBalance: summaryData?.availableBalance || 0,
    todayExpenses: summaryData?.todayExpenses || 0,
    weekExpenses: summaryData?.weekExpenses || 0,
    monthExpenses: summaryData?.monthExpenses || 0,
    expensesByCategory: summaryData?.expensesByCategory || {},
    incomeByCategory: summaryData?.incomeByCategory || {},
    weeklyTrend: summaryData?.weeklyTrend || [],
    user,
    createTransaction,
    deleteTransaction,
    updateTransaction,
    loading: state.isLoading,
    error: state.error,
    refetch
  }
}
