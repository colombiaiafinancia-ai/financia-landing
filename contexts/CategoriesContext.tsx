'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { categoryUseCases, type CategoryDTO } from '@/features/categories/application/categoryUseCases'
import { getCurrentUser } from '@/services/supabase'
import { dispatchCategoriesUpdated } from '@/utils/categorySyncEvents'

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

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [gastoCategories, setGastoCategories] = useState<CategoryDTO[]>([])
  const [ingresoCategories, setIngresoCategories] = useState<CategoryDTO[]>([])
  const [userOwnedCategories, setUserOwnedCategories] = useState<CategoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async (uid?: string | null) => {
    const resolvedUserId = uid ?? userId
    if (!resolvedUserId) return

    const { gastos, ingresos } = await categoryUseCases.getCategoriesByType(resolvedUserId)
    setGastoCategories(gastos)
    setIngresoCategories(ingresos)
    const owned = await categoryUseCases.getUserOwnedCategories(resolvedUserId)
    setUserOwnedCategories(owned)
  }, [userId])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const user = await getCurrentUser()
        if (!user?.id) {
          setError('Usuario no autenticado')
          return
        }
        setUserId(user.id)
        await loadAll(user.id)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar categorías')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [loadAll])

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
    const owned = await categoryUseCases.getUserOwnedCategories(userId)
    setUserOwnedCategories(owned)
  }, [userId])

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
