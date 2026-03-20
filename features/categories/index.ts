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
export { categoryRepository } from './services/categoryRepository'

// Convenience exports
import { categoryUseCases } from './application/categoryUseCases'
import type { CategoryFilters, CategoryCreationData } from './application/categoryUseCases'

export const CategoryService = {
  getCategoriesForUser: (userId: string, filters?: CategoryFilters) => 
    categoryUseCases.getCategoriesForUser(userId, filters),
  
  getCategoriesByType: (userId: string) => 
    categoryUseCases.getCategoriesByType(userId),
  
  create: (data: CategoryCreationData) => 
    categoryUseCases.createCategory(data),
}