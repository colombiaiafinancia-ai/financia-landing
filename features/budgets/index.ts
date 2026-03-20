/**
 * Punto de entrada para la feature Budgets
 */

// DTOs
export type { CategoryBudgetWithSpent } from './application/categoryBudgetService'
export { BudgetDTOMapper, type LegacyBudgetDataDTO } from './dto/budgetDTO'

// Casos de uso
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

// Import para uso interno
import { budgetUseCases, categoryBudgetUseCases } from './application/budgetUseCases'

// Lógica de dominio
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

// Repositorios
export {
  budgetRepository,
  categoryBudgetRepository
} from './services/budgetRepository'

/**
 * API de conveniencia
 */

// Presupuestos generales
export const BudgetService = {
  getCurrent: (userId: string) => budgetUseCases.getCurrentBudget(userId),
  getByPeriod: (userId: string, year: number, month: number) => budgetUseCases.getBudgetByPeriod(userId, year, month),
  getAll: (userId: string) => budgetUseCases.getAllBudgets(userId),
  save: (userId: string, amount: number) => budgetUseCases.saveBudget(userId, amount),
  delete: (userId: string) => budgetUseCases.deleteBudget(userId),
  subscribe: (userId: string, callback: () => void) => budgetUseCases.subscribeToChanges(userId, callback)
}

// Presupuestos por categoría
export const CategoryBudgetService = {
  getCurrent: (userId: string) => categoryBudgetUseCases.getCurrentCategoryBudgets(userId),
  getByDateRange: (userId: string, startDate: string, endDate: string) => categoryBudgetUseCases.getCategoryBudgetsByDateRange(userId, startDate, endDate),
  getSummary: (userId: string, expensesByCategory: Record<string, number>) => categoryBudgetUseCases.getCategoryBudgetSummary(userId, expensesByCategory),
  getStats: (userId: string, expensesByCategory: Record<string, number>) => categoryBudgetUseCases.getBudgetStats(userId, expensesByCategory),
  addSpentFromTransaction: (userId: string, categoria: string, amount: number) => categoryBudgetUseCases.addSpentFromTransaction(userId, categoria, amount),
  save: (userId: string, category: string, amount: number) => categoryBudgetUseCases.saveCategoryBudget(userId, category, amount),
  delete: (userId: string, category: string) => categoryBudgetUseCases.deleteCategoryBudget(userId, category),
  subtractSpentFromTransaction: (userId: string, category: string, amount: number) => categoryBudgetUseCases.subtractSpentFromTransaction(userId, category, amount),
  subscribe: (userId: string, callback: () => void) => categoryBudgetUseCases.subscribeToChanges(userId, callback),
  loadFromSupabase: (userId: string) => categoryBudgetUseCases.loadBudgetFromSupabase(userId),
  saveGeneral: (userId: string, amount: number) => categoryBudgetUseCases.saveBudgetGeneral(userId, amount)
}