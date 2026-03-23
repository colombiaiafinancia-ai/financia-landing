'use client'

import { useState, useEffect, useCallback } from 'react'
import { transactionUseCases } from '@/features/transactions/application/transactionUseCases'
import { TransactionDTOMapper, TransactionDTO } from '@/features/transactions/dto/transactionDTO'
import { getCurrentUser } from '@/services/supabase'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'
import { User } from '@supabase/supabase-js'

export const useTransactionsUnified = () => {
  const [state, setState] = useState<AsyncState<any>>(AsyncStateUtils.createInitial())
  const [transactions, setTransactions] = useState<TransactionDTO[]>([])
  const [dailyTrend, setDailyTrend] = useState<Array<{ date: string; amount: number }>>([])
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; amount: number }>>([])
  const [loadingTrend, setLoadingTrend] = useState<'daily' | 'monthly' | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const errorHandler = ErrorHandler

  const loadUser = useCallback(async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

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
      
      const transactionDTOs = TransactionDTOMapper.transactionsToDTOs(result.transactions)

      setTransactions([...transactionDTOs])
      setDailyTrend(result.dailyTrend)
      setMonthlyTrend(result.monthlyTrend)
      setState(AsyncStateUtils.createWithData({
        totalSpent: result.totalSpent,
        totalIncome: result.totalIncome,
        todayExpenses: result.todayExpenses,
        weekExpenses: result.weekExpenses,
        monthExpenses: result.monthExpenses,
        expensesByCategory: result.expensesByCategory,
        weeklyTrend: result.weeklyTrend
      }, refetchSilent))

    } catch (err) {
      const errorMessage = errorHandler.handle(err, 'transactions', { userId: user.id })
      setState(AsyncStateUtils.createWithError(errorMessage, refetchSilent))
    }
  }, [user, errorHandler])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    todayExpenses: summaryData?.todayExpenses || 0,
    weekExpenses: summaryData?.weekExpenses || 0,
    monthExpenses: summaryData?.monthExpenses || 0,
    expensesByCategory: summaryData?.expensesByCategory || {},
    weeklyTrend: summaryData?.weeklyTrend || [],
    user,
    createTransaction,
    deleteTransaction,
    loading: state.isLoading,
    error: state.error,
    refetch: state.refetch
  }
}