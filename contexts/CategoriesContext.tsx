'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { categoryUseCases, type CategoryDTO } from '@/features/categories/application/categoryUseCases'
import { getCurrentUser } from '@/services/supabase'
import { dispatchCategoriesUpdated } from '@/utils/categorySyncEvents'
import type { CategoriesBundle } from '@/lib/dashboard/types'
import {
  dashboardCacheKey,
  isStale,
  resolveInitial,
  writeDashboardCache,
} from '@/lib/dashboard/client-cache'

type CategoryType = 'Gasto' | 'Ingreso'

interface CategoriesContextValue {
  gastoCategories: CategoryDTO[]
  ingresoCategories: CategoryDTO[]
  userOwnedCategories: CategoryDTO[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getOrCreateCategory: (data: { nombre: string; tipo: CategoryType; iconKey?: string | null }) => Promise<CategoryDTO>
  createUserCategory: (data: { nombre: string; tipo: CategoryType; iconKey?: string | null }) => Promise<CategoryDTO>
  deleteUserCategory: (categoryId: string) => Promise<void>
  updateUserCategory: (
    categoryId: string,
    data: { nombre?: string; iconKey?: string | null }
  ) => Promise<void>
  loadUserOwnedCategories: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({
  children,
  userId: initialUserId,
  initialData,
  initialFetchedAt,
}: {
  children: React.ReactNode
  /** Usuario verificado en el servidor (evita otra llamada a Auth). */
  userId?: string
  initialData?: CategoriesBundle | null
  initialFetchedAt?: number
}) {
  const cacheKey = initialUserId ? dashboardCacheKey('categories', initialUserId) : null
  const [initial] = useState(() => resolveInitial<CategoriesBundle>(cacheKey, initialData, initialFetchedAt))
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null)
  const [gastoCategories, setGastoCategories] = useState<CategoryDTO[]>(initial.data?.gastos ?? [])
  const [ingresoCategories, setIngresoCategories] = useState<CategoryDTO[]>(initial.data?.ingresos ?? [])
  const [userOwnedCategories, setUserOwnedCategories] = useState<CategoryDTO[]>(initial.data?.owned ?? [])
  const [loading, setLoading] = useState(!initial.data)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async (uid?: string | null) => {
    const resolvedUserId = uid ?? userId
    if (!resolvedUserId) return

    // Una sola consulta para gastos, ingresos y categorías propias
    const grouped = await categoryUseCases.getAllCategoriesGrouped(resolvedUserId)
    writeDashboardCache(dashboardCacheKey('categories', resolvedUserId), grouped)
    setGastoCategories(grouped.gastos)
    setIngresoCategories(grouped.ingresos)
    setUserOwnedCategories(grouped.owned)
  }, [userId])

  const hasInitialData = initial.data != null
  const initialIsStale = isStale(initial.at)
  useEffect(() => {
    if (hasInitialData && !initialIsStale) return
    const run = async () => {
      try {
        if (!hasInitialData) setLoading(true)
        let uid = initialUserId
        if (!uid) {
          const user = await getCurrentUser()
          if (!user?.id) {
            setError('Usuario no autenticado')
            return
          }
          uid = user.id
          setUserId(user.id)
        }
        await loadAll(uid)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar categorías')
      } finally {
        setLoading(false)
      }
    }
    run()
    // Solo al montar: las mutaciones refrescan explícitamente con loadAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = useCallback(async () => {
    try {
      await loadAll()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al refrescar categorías')
      throw err
    }
  }, [loadAll])

  const getOrCreateCategory = useCallback(async (data: { nombre: string; tipo: CategoryType; iconKey?: string | null }) => {
    if (!userId) throw new Error('Usuario no autenticado')
    const category = await categoryUseCases.getOrCreateCategory(userId, data)
    await loadAll(userId)
    return category
  }, [userId, loadAll])

  const createUserCategory = useCallback(async (data: { nombre: string; tipo: CategoryType; iconKey?: string | null }) => {
    if (!userId) throw new Error('Usuario no autenticado')
    const category = await categoryUseCases.createCategory({
      nombre: data.nombre,
      tipo: data.tipo,
      userId,
      iconKey: data.iconKey,
    })
    await loadAll(userId)
    return category
  }, [userId, loadAll])

  const deleteUserCategory = useCallback(async (categoryId: string) => {
    if (!userId) throw new Error('Usuario no autenticado')
    await categoryUseCases.deleteUserOwnedCategory(userId, categoryId)
    await loadAll(userId)
    dispatchCategoriesUpdated()
  }, [userId, loadAll])

  const updateUserCategory = useCallback(
    async (categoryId: string, data: { nombre?: string; iconKey?: string | null }) => {
      if (!userId) throw new Error('Usuario no autenticado')
      await categoryUseCases.updateUserOwnedCategory(userId, categoryId, data)
      await loadAll(userId)
      dispatchCategoriesUpdated()
    },
    [userId, loadAll]
  )

  const loadUserOwnedCategories = useCallback(async () => {
    if (!userId) return
    await loadAll(userId)
  }, [userId, loadAll])

  const value = useMemo<CategoriesContextValue>(() => ({
    gastoCategories,
    ingresoCategories,
    userOwnedCategories,
    loading,
    error,
    refetch,
    getOrCreateCategory,
    createUserCategory,
    deleteUserCategory,
    updateUserCategory,
    loadUserOwnedCategories,
  }), [
    gastoCategories,
    ingresoCategories,
    userOwnedCategories,
    loading,
    error,
    refetch,
    getOrCreateCategory,
    createUserCategory,
    deleteUserCategory,
    updateUserCategory,
    loadUserOwnedCategories,
  ])

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) {
    throw new Error('useCategoriesContext debe usarse dentro de CategoriesProvider')
  }
  return ctx
}
