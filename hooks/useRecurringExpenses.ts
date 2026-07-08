'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { recurringExpenseUseCases } from '@/features/recurring-expenses/application/recurringExpenseUseCases'
import type {
  CreateRecurringExpenseDTO,
  RecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from '@/features/recurring-expenses/dto/recurringExpenseDTO'
import { getCurrentUser } from '@/services/supabase'
import type { User } from '@supabase/supabase-js'

export function useRecurringExpenses(onTransactionCreated?: () => Promise<void> | void) {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<RecurringExpenseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null))
  }, [])

  const fetchItems = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setItems(await recurringExpenseUseCases.getAll(user.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos fijos')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
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

  const activeMonthlyTotal = useMemo(
    () =>
      items
        .filter((item) => item.status === 'active')
        .reduce((sum, item) => {
          if (item.frequency === 'yearly') return sum + item.amount / 12
          if (item.frequency === 'weekly') return sum + item.amount * 4
          return sum + item.amount
        }, 0),
    [items]
  )

  return {
    items,
    loading,
    error,
    activeMonthlyTotal,
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
