/**
 * CATEGORIES FEATURE - Public API
 * 
 * Punto de entrada único para la funcionalidad de categorías.
 */

// DTOs
export type { CategoryDTO } from './application/categoryUseCases'

// Domain types and logic
export type { Category, CategoryType } from './domain/categoryLogic'
export { 
  DEFAULT_CATEGORY_ICON_KEY,
  CATEGORY_ICON_MAP,
  isValidCategoryIconKey,
} from './domain/categoryIcons'

export {
  validateCategoryName, 
  validateCategoryType, 
  filterCategoriesByType, 
  sortCategoriesByName, 
  searchCategoriesByName, 
  getCategoryStats 
} from './domain/categoryLogic'

// Application layer
export { categoryUseCases } from './application/categoryUseCases'
export type { 
  CategoryFilters, 
  CategoryCreationData
} from './application/categoryUseCases'

// Infrastructure layer
export { categoryRepository } from './infrastructure/categoryRepository'

// Convenience exports
import { categoryUseCases } from './application/categoryUseCases'
import type { CategoryFilters, CategoryCreationData } from './application/categoryUseCases'

export const CategoryService = {
  getCategoriesForUser: (userId: string, filters?: CategoryFilters) => 
    categoryUseCases.getCategoriesForUser(userId, filters),
  
  getCategoriesByType: (userId: string) => 
    categoryUseCases.getCategoriesByType(userId),

  getOrCreateCategory: (
    userId: string,
    data: { nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey?: string | null }
  ) => categoryUseCases.getOrCreateCategory(userId, data),

  getUserOwnedCategories: (userId: string) =>
    categoryUseCases.getUserOwnedCategories(userId),
  
  create: (data: CategoryCreationData) => 
    categoryUseCases.createCategory(data),
}