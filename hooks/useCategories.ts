'use client'

import { useState, useEffect } from 'react'
import { categoryUseCases } from '@/features/categories/application/categoryUseCases'
import { getCurrentUser } from '@/services/supabase'

interface UseCategoriesResult {
  gastoCategories: Array<{ id: string; nombre: string }>
  ingresoCategories: Array<{ id: string; nombre: string }>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useCategories = (): UseCategoriesResult => {
  const [gastoCategories, setGastoCategories] = useState<Array<{ id: string; nombre: string }>>([])
  const [ingresoCategories, setIngresoCategories] = useState<Array<{ id: string; nombre: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      console.log('🔍 useCategories - obteniendo usuario actual...')
      const user = await getCurrentUser()
      console.log('🔍 useCategories - usuario:', user?.id)

      if (!user) {
        console.warn('⚠️ useCategories - usuario no autenticado')
        setError('Usuario no autenticado')
        setLoading(false)
        return
      }

      console.log('🔍 useCategories - llamando a categoryUseCases.getCategoriesByType con userId:', user.id)
      const { gastos, ingresos } = await categoryUseCases.getCategoriesByType(user.id)
      console.log('🔍 useCategories - respuesta:', { gastos, ingresos })

      setGastoCategories(gastos.map(c => ({ id: c.id, nombre: c.nombre })))
      setIngresoCategories(ingresos.map(c => ({ id: c.id, nombre: c.nombre })))
      setError(null)
    } catch (err) {
      console.error('❌ useCategories - error:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { gastoCategories, ingresoCategories, loading, error, refetch: fetchCategories }
}