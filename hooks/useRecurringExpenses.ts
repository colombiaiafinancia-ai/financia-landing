'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recurringExpenseUseCases } from '@/features/recurring-expenses/application/recurringExpenseUseCases'
import type {
  CreateRecurringExpenseDTO,
  RecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from '@/features/recurring-expenses/dto/recurringExpenseDTO'
import { getCurrentUser } from '@/services/supabase'
import {
  dashboardCacheKey,
  isStale,
  resolveInitial,
  writeDashboardCache,
} from '@/lib/dashboard/client-cache'

export function useRecurringExpenses(
  onTransactionCreated?: () => Promise<void> | void,
  options: { userId?: string; initialData?: RecurringExpenseDTO[] | null; initialFetchedAt?: number } = {}
) {
  const cacheKey = options.userId ? dashboardCacheKey('recurring', options.userId) : null
  const [initial] = useState(() =>
    resolveInitial<RecurringExpenseDTO[]>(cacheKey, options.initialData, options.initialFetchedAt)
  )
  const [user, setUser] = useState<{ id: string } | null>(options.userId ? { id: options.userId } : null)
  const [items, setItems] = useState<RecurringExpenseDTO[]>(initial.data ?? [])
  const [loading, setLoading] = useState(!initial.data)
  const [error, setError] = useState<string | null>(null)
  const skipInitialFetch = useRef(initial.data != null && !isStale(initial.at))
  const hasDataRef = useRef(initial.data != null)

  useEffect(() => {
    if (options.userId) return
    getCurrentUser().then(setUser).catch(() => setUser(null))
  }, [options.userId])

  const fetchItems = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      if (!hasDataRef.current) setLoading(true)
      setError(null)
      const data = await recurringExpenseUseCases.getAll(user.id)
      writeDashboardCache(dashboardCacheKey('recurring', user.id), data)
      hasDataRef.current = true
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos fijos')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }
    void fetchItems()
  }, [fetchItems])

  const create = useCallback(
    async (data: CreateRecurringExpenseDTO) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.create(user.id, data)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const update = useCallback(
    async (id: string, data: UpdateRecurringExpenseDTO) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.update(user.id, id, data)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const pause = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.pause(user.id, id)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const resume = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.resume(user.id, id)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const end = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.end(user.id, id)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      await recurringExpenseUseCases.delete(user.id, id)
      await fetchItems()
    },
    [fetchItems, user?.id]
  )

  const generateNow = useCallback(
    async (item: RecurringExpenseDTO) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      const created = await recurringExpenseUseCases.generateTransactionNow(user.id, item)
      if (created) await onTransactionCreated?.()
      await fetchItems()
      return created
    },
    [fetchItems, onTransactionCreated, user?.id]
  )

  const getMonthlyAmount = (item: RecurringExpenseDTO) => {
    if (item.frequency === 'yearly') return item.amount / 12
    if (item.frequency === 'weekly') return item.amount * 4
    return item.amount
  }

  const activeMonthlyTotal = useMemo(
    () =>
      items
        .filter((item) => item.status === 'active' && item.direction === 'gasto')
        .reduce((sum, item) => sum + getMonthlyAmount(item), 0),
    [items]
  )

  const activeMonthlyIncomeTotal = useMemo(
    () =>
      items
        .filter((item) => item.status === 'active' && item.direction === 'ingreso')
        .reduce((sum, item) => sum + getMonthlyAmount(item), 0),
    [items]
  )

  return {
    items,
    loading,
    error,
    activeMonthlyTotal,
    activeMonthlyIncomeTotal,
    refetch: fetchItems,
    create,
    update,
    pause,
    resume,
    end,
    remove,
    generateNow,
  }
}
