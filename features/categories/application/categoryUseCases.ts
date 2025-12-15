/**
 * APPLICATION LAYER - Category Use Cases
 * 
 * Orquesta la lógica de dominio y los repositorios.
 * Define los casos de uso de la aplicación para categorías.
 */

import { Category, CategoryType, validateCategoryName, validateCategoryType, filterCategoriesByType, sortCategoriesByName, searchCategoriesByName, getCategoryStats } from '../domain/categoryLogic'
import { categoryRepository } from '../services/categoryRepository'

export interface CategoryFilters {
  type?: CategoryType
  searchTerm?: string
  sortBy?: 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryCreationData {
  nombre: string
  tipo: string
}

export interface CategoryUpdateData {
  nombre?: string
  tipo?: string
}

export class CategoryUseCases {
  /**
   * Obtiene todas las categorías con filtros opcionales
   */
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Loading categories with filters:', filters)
      
      // Obtener todas las categorías del repositorio
      let categories = await categoryRepository.getAll()
      
      // Aplicar filtros usando lógica de dominio
      if (filters?.type) {
        categories = filterCategoriesByType(categories, filters.type)
      }
      
      if (filters?.searchTerm) {
        categories = searchCategoriesByName(categories, filters.searchTerm)
      }
      
      // Aplicar ordenamiento
      if (filters?.sortBy === 'name') {
        const ascending = filters.sortOrder !== 'desc'
        categories = sortCategoriesByName(categories, ascending)
      }
      
      console.log('✅ CATEGORY_USE_CASE - Categories loaded:', categories.length)
      return categories
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error loading categories:', error)
      throw error
    }
  }

  /**
   * Obtiene categorías separadas por tipo (para formularios)
   */
  async getCategoriesByType(): Promise<{ gastos: Category[]; ingresos: Category[] }> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Loading categories by type')
      
      const allCategories = await categoryRepository.getAll()
      
      const gastos = filterCategoriesByType(allCategories, 'Gasto')
      const ingresos = filterCategoriesByType(allCategories, 'Ingreso')
      
      console.log('✅ CATEGORY_USE_CASE - Categories by type loaded:', { 
        gastos: gastos.length, 
        ingresos: ingresos.length 
      })
      
      return { gastos, ingresos }
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error loading categories by type:', error)
      throw error
    }
  }

  /**
   * Obtiene una categoría específica por ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Loading category by ID:', id)
      
      if (!id || id.trim().length === 0) {
        throw new Error('ID de categoría requerido')
      }
      
      const category = await categoryRepository.getById(id)
      
      console.log('✅ CATEGORY_USE_CASE - Category loaded:', category?.nombre || 'Not found')
      return category
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error loading category by ID:', error)
      throw error
    }
  }

  /**
   * Crea una nueva categoría
   */
  async createCategory(categoryData: CategoryCreationData): Promise<Category> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Creating category:', categoryData)
      
      // Validar nombre usando lógica de dominio
      const nameValidation = validateCategoryName(categoryData.nombre)
      if (!nameValidation.isValid) {
        throw new Error(`Datos inválidos: ${nameValidation.errors.join(', ')}`)
      }
      
      // Validar tipo usando lógica de dominio
      if (!validateCategoryType(categoryData.tipo)) {
        throw new Error('Tipo de categoría inválido. Debe ser "Gasto" o "Ingreso"')
      }
      
      // Verificar que no existe una categoría con el mismo nombre
      const exists = await categoryRepository.existsByName(categoryData.nombre)
      if (exists) {
        throw new Error('Ya existe una categoría con ese nombre')
      }
      
      // Crear la categoría
      const newCategory = await categoryRepository.create({
        nombre: categoryData.nombre.trim(),
        tipo: categoryData.tipo as CategoryType
      })
      
      console.log('✅ CATEGORY_USE_CASE - Category created:', newCategory)
      return newCategory
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error creating category:', error)
      throw error
    }
  }

  /**
   * Actualiza una categoría existente
   */
  async updateCategory(id: string, updateData: CategoryUpdateData): Promise<Category> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Updating category:', { id, updateData })
      
      if (!id || id.trim().length === 0) {
        throw new Error('ID de categoría requerido')
      }
      
      // Verificar que la categoría existe
      const existingCategory = await categoryRepository.getById(id)
      if (!existingCategory) {
        throw new Error('Categoría no encontrada')
      }
      
      // Validar nombre si se proporciona
      if (updateData.nombre !== undefined) {
        const nameValidation = validateCategoryName(updateData.nombre)
        if (!nameValidation.isValid) {
          throw new Error(`Nombre inválido: ${nameValidation.errors.join(', ')}`)
        }
        
        // Verificar que no existe otra categoría con el mismo nombre
        const exists = await categoryRepository.existsByName(updateData.nombre, id)
        if (exists) {
          throw new Error('Ya existe otra categoría con ese nombre')
        }
      }
      
      // Validar tipo si se proporciona
      if (updateData.tipo !== undefined && !validateCategoryType(updateData.tipo)) {
        throw new Error('Tipo de categoría inválido. Debe ser "Gasto" o "Ingreso"')
      }
      
      // Actualizar la categoría
      const updatedCategory = await categoryRepository.update(id, {
        ...(updateData.nombre !== undefined && { nombre: updateData.nombre.trim() }),
        ...(updateData.tipo !== undefined && { tipo: updateData.tipo as CategoryType })
      })
      
      console.log('✅ CATEGORY_USE_CASE - Category updated:', updatedCategory)
      return updatedCategory
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error updating category:', error)
      throw error
    }
  }

  /**
   * Elimina una categoría
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Deleting category:', id)
      
      if (!id || id.trim().length === 0) {
        throw new Error('ID de categoría requerido')
      }
      
      // Verificar que la categoría existe
      const existingCategory = await categoryRepository.getById(id)
      if (!existingCategory) {
        throw new Error('Categoría no encontrada')
      }
      
      // TODO: En el futuro, verificar si la categoría está siendo usada en transacciones
      // y decidir si permitir eliminación o requerir reasignación
      
      await categoryRepository.delete(id)
      
      console.log('✅ CATEGORY_USE_CASE - Category deleted:', id)
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error deleting category:', error)
      throw error
    }
  }

  /**
   * Obtiene estadísticas de categorías
   */
  async getCategoryStatistics(): Promise<ReturnType<typeof getCategoryStats>> {
    try {
      console.log('📂 CATEGORY_USE_CASE - Loading category statistics')
      
      const categories = await categoryRepository.getAll()
      const stats = getCategoryStats(categories)
      
      console.log('✅ CATEGORY_USE_CASE - Statistics loaded:', stats)
      return stats
    } catch (error) {
      console.error('❌ CATEGORY_USE_CASE - Error loading statistics:', error)
      throw error
    }
  }
}

// Singleton instance
export const categoryUseCases = new CategoryUseCases()
