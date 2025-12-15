'use client'

import { useState, useEffect, useCallback } from 'react'
import { CategoryService, CategoryDTOMapper, type CategoryDTO, type CategoriesByTypeDTO } from '@/features/categories'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'

/**
 * Hook refactorizado para categorías - Usa AsyncState y DTOs
 * 
 * ✅ Solo maneja UI state
 * ✅ Usa DTOs en lugar de entidades directas
 * ✅ Sigue el contrato AsyncState estándar
 * ✅ Manejo de errores estandarizado
 */
export const useCategories = (): AsyncState<CategoriesByTypeDTO> & {
  allCategories: CategoryDTO[]
  gastoCategories: CategoryDTO[]
  ingresoCategories: CategoryDTO[]
  categories: CategoryDTO[] // Alias de compatibilidad
  loading: boolean // Alias de compatibilidad
  error: string | null // Alias de compatibilidad
  refetch: () => Promise<void> // Alias de compatibilidad
} => {
  const [state, setState] = useState<AsyncState<CategoriesByTypeDTO>>(
    AsyncStateUtils.createInitial<CategoriesByTypeDTO>()
  )
  
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])

  const errorHandler = ErrorHandler

  const fetchCategories = useCallback(async () => {
    try {
      setState(AsyncStateUtils.createLoading(fetchCategories))
      
      console.log('🏷️ HOOK - Loading categories...')
      
      // ✅ Usar caso de uso en lugar de acceso directo a Supabase
      const categoriesByType = await CategoryService.getByType()
      
      // ✅ Convertir a DTOs usando mapper
      const dto = CategoryDTOMapper.groupedToDTO(categoriesByType)
      
      // Mantener lista completa para compatibilidad
      const allCategoriesArray = [...dto.gastos, ...dto.ingresos]
      setAllCategories(allCategoriesArray)
      
      console.log('✅ HOOK - Categories loaded:', {
        gastos: dto.gastos.length,
        ingresos: dto.ingresos.length,
        total: allCategoriesArray.length
      })
      
      setState(AsyncStateUtils.createWithData(dto, fetchCategories))
    } catch (err) {
      console.error('❌ HOOK - Error loading categories:', err)
      const errorMessage = errorHandler.handle(err, 'categories', { action: 'fetch' })
      setState(AsyncStateUtils.createWithError(errorMessage, fetchCategories))
      setAllCategories([])
    }
  }, [errorHandler])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    ...state,
    allCategories,
    gastoCategories: state.data?.gastos || [],
    ingresoCategories: state.data?.ingresos || [],
    // Alias para compatibilidad con código existente
    categories: allCategories,
    loading: state.isLoading,
    error: state.error,
    refetch: state.refetch
  } as AsyncState<CategoriesByTypeDTO> & {
    allCategories: CategoryDTO[]
    gastoCategories: CategoryDTO[]
    ingresoCategories: CategoryDTO[]
    categories: CategoryDTO[] // Alias de compatibilidad
    loading: boolean // Alias de compatibilidad
    error: string | null // Alias de compatibilidad
    refetch: () => Promise<void> // Alias de compatibilidad
  }
}