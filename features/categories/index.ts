/**
 * CATEGORIES FEATURE - Public API
 * 
 * Punto de entrada único para la funcionalidad de categorías.
 * Exporta únicamente lo necesario para el resto de la aplicación.
 */

// Domain types and logic (solo tipos y funciones puras)
export type { Category, CategoryType } from './domain/categoryLogic'
export { 
  validateCategoryName, 
  validateCategoryType, 
  filterCategoriesByType, 
  sortCategoriesByName, 
  searchCategoriesByName, 
  getCategoryStats 
} from './domain/categoryLogic'

// Application layer (casos de uso)
export { categoryUseCases } from './application/categoryUseCases'
export type { 
  CategoryFilters, 
  CategoryCreationData, 
  CategoryUpdateData 
} from './application/categoryUseCases'

// Infrastructure layer (solo para casos especiales)
export { categoryRepository } from './services/categoryRepository'

// Convenience exports para facilitar el uso
export const CategoryService = {
  // Consultas
  getAll: (filters?: import('./application/categoryUseCases').CategoryFilters) => 
    categoryUseCases.getCategories(filters),
  
  getByType: () => 
    categoryUseCases.getCategoriesByType(),
  
  getById: (id: string) => 
    categoryUseCases.getCategoryById(id),
  
  getStats: () => 
    categoryUseCases.getCategoryStatistics(),
  
  // Operaciones
  create: (data: import('./application/categoryUseCases').CategoryCreationData) => 
    categoryUseCases.createCategory(data),
  
  update: (id: string, data: import('./application/categoryUseCases').CategoryUpdateData) => 
    categoryUseCases.updateCategory(id, data),
  
  delete: (id: string) => 
    categoryUseCases.deleteCategory(id)
}

