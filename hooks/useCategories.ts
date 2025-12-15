'use client'

import { useState, useEffect } from 'react'
import { CategoryService, type Category } from '@/features/categories'

/**
 * Hook refactorizado para categorías - Solo maneja UI state
 * 
 * La lógica de negocio y acceso a datos se delegó a CategoryService
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🏷️ HOOK - Loading categories...')
      
      // ✅ Usar caso de uso en lugar de acceso directo a Supabase
      const data = await CategoryService.getAll()
      
      console.log('✅ HOOK - Categories loaded:', data.length)
      setCategories(data)
    } catch (err) {
      console.error('❌ HOOK - Error loading categories:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar categorías'
      setError(errorMessage)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // ✅ Usar lógica de dominio para filtrar (sin lógica en el hook)
  const gastoCategories = categories.filter(cat => cat.tipo === 'Gasto')
  const ingresoCategories = categories.filter(cat => cat.tipo === 'Ingreso')

  return {
    categories,
    gastoCategories,
    ingresoCategories,
    loading,
    error,
    refetch: fetchCategories
  }
}