/**
 * Punto de entrada para la feature Budgets
 * 
 * Exporta todas las funcionalidades públicas de la feature
 * manteniendo la separación de capas interna.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 3 - DTOs y Contratos
 */

// DTOs (contratos para la UI)
export type {
  BudgetDTO,
  CategoryBudgetDTO,
  CategoryBudgetSummaryDTO,
  BudgetStatsDTO,
  BudgetPeriodDTO,
  BudgetSummaryDTO,
  CreateBudgetDTO,
  CreateCategoryBudgetDTO,
  UpdateBudgetDTO,
  LegacyBudgetDataDTO
} from './dto/budgetDTO'
export { BudgetDTOMapper } from './dto/budgetDTO'

// Casos de uso (capa de aplicación) - API pública
export {
  budgetUseCases,
  categoryBudgetUseCases,
  BudgetUseCases,
  CategoryBudgetUseCases,
  type Budget,
  type CategoryBudget,
  type BudgetSummary,
  type LegacyBudgetData
} from './application/budgetUseCases'

// Import para uso interno en este archivo
import { budgetUseCases, categoryBudgetUseCases } from './application/budgetUseCases'

// Lógica de dominio - para casos especiales
export {
  getCurrentPeriod,
  getPeriod,
  validateBudgetAmount,
  validateBudgetCategory,
  validateCategoryBudgetData,
  calculateBudgetProgress,
  calculateCategoryBudgetSummary,
  calculateBudgetStats,
  formatBudgetAmount,
  getMonthDateRange,
  type BudgetPeriod,
  type BudgetValidation,
  type BudgetCalculation,
  type CategoryBudgetSummary,
  type BudgetStats
} from './domain/budgetLogic'

// Repositorios - solo para testing o casos muy específicos
export {
  budgetRepository,
  categoryBudgetRepository
} from './services/budgetRepository'

/**
 * API de conveniencia para casos de uso más comunes
 */

// Presupuestos generales
export const BudgetService = {
  // Consultas
  getCurrent: (userId: string) => budgetUseCases.getCurrentBudget(userId),
  getByPeriod: (userId: string, year: number, month: number) => budgetUseCases.getBudgetByPeriod(userId, year, month),
  getAll: (userId: string) => budgetUseCases.getAllBudgets(userId),
  
  // Operaciones
  save: (userId: string, amount: number) => budgetUseCases.saveBudget(userId, amount),
  delete: (userId: string) => budgetUseCases.deleteBudget(userId),
  
  // Suscripciones
  subscribe: (userId: string, callback: () => void) => budgetUseCases.subscribeToChanges(userId, callback)
}

// Presupuestos por categoría
export const CategoryBudgetService = {
  // Consultas
  getCurrent: (userId: string) => categoryBudgetUseCases.getCurrentCategoryBudgets(userId),
  getByDateRange: (userId: string, startDate: string, endDate: string) => categoryBudgetUseCases.getCategoryBudgetsByDateRange(userId, startDate, endDate),
  getSummary: (userId: string, expensesByCategory: Record<string, number>) => categoryBudgetUseCases.getCategoryBudgetSummary(userId, expensesByCategory),
  getStats: (userId: string, expensesByCategory: Record<string, number>) => categoryBudgetUseCases.getBudgetStats(userId, expensesByCategory),
  addSpentFromTransaction: (userId: string, categoria: string, amount: number) =>  categoryBudgetUseCases.addSpentFromTransaction(userId, categoria, amount),
  // Operaciones
  save: (userId: string, category: string, amount: number) => categoryBudgetUseCases.saveCategoryBudget(userId, category, amount),
  delete: (userId: string, category: string) => categoryBudgetUseCases.deleteCategoryBudget(userId, category),
  subtractSpentFromTransaction: (  userId: string,  category: string,  amount: number) => categoryBudgetUseCases.subtractSpentFromTransaction(userId, category, amount),
  // Suscripciones
  subscribe: (userId: string, callback: () => void) => categoryBudgetUseCases.subscribeToChanges(userId, callback),
  
  // Métodos de compatibilidad con hooks legacy
  loadFromSupabase: (userId: string) => categoryBudgetUseCases.loadBudgetFromSupabase(userId),
  saveGeneral: (userId: string, amount: number) => categoryBudgetUseCases.saveBudgetGeneral(userId, amount)
}
