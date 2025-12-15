/**
 * Hook de Categorías - Solo UI State
 * 
 * RESPONSABILIDAD: Manejo de estado de UI únicamente
 * - useState para estado local
 * - useEffect para efectos de UI
 * - Llamadas a casos de uso
 * 
 * NO CONTIENE:
 * ❌ Lógica de negocio
 * ❌ Acceso directo a Supabase
 * ❌ Validaciones de dominio
 * ❌ Cálculos complejos
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 2 - Hooks Simplificados
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CategoryService } from '@/features/categories'
import type { Category } from '@/features/categories'

export const useCategoriesNew = () => {
  // Estado de UI únicamente
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar categorías
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Cargando categorías desde la nueva arquitectura...')
      
      // Usar caso de uso para obtener categorías
      const allCategories = await CategoryService.getAll()
      setCategories(allCategories)
      
      console.log('Categorías cargadas:', allCategories.length)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filtrar categorías por tipo usando useMemo para optimización
  const gastoCategories = useMemo(() => 
    categories.filter(cat => cat.tipo === 'Gasto'), 
    [categories]
  )
  
  const ingresoCategories = useMemo(() => 
    categories.filter(cat => cat.tipo === 'Ingreso'), 
    [categories]
  )

  return {
    categories,
    gastoCategories,
    ingresoCategories,
    loading,
    error,
    refetch: fetchCategories
  }
}
