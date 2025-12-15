'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'

export interface Category {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Cargando categorías desde la base de datos...')
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        setError(`Error al cargar categorías: ${error.message}`)
        setCategories([])
      } else {
        console.log('Categorías cargadas:', data?.length || 0)
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar categorías')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtrar categorías por tipo
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