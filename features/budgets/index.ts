/**
 * Punto de entrada para la feature Budgets
 * 
 * Exporta todas las funcionalidades públicas de la feature
 * manteniendo la separación de capas interna.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

// Casos de uso (capa de aplicación) - API pública
export {
  budgetUseCases,
  categoryBudgetUseCases,
  BudgetApplicationError,
  type Budget,
  type CategoryBudget,
  type CategoryBudgetSummary
} from './application/budgetUseCases'

// Lógica de dominio - para casos especiales
export {
  getCurrentPeriod,
  getPeriod,
  validateBudgetAmount,
  validateBudgetCategory,
  calculateBudgetProgress,
  formatBudgetAmount,
  type BudgetPeriod,
  type BudgetValidation,
  type BudgetCalculation
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
  getCurrent: budgetUseCases.getCurrentBudget.bind(budgetUseCases),
  getByPeriod: budgetUseCases.getBudgetByPeriod.bind(budgetUseCases),
  save: budgetUseCases.saveBudget.bind(budgetUseCases),
  getAll: budgetUseCases.getAllBudgets.bind(budgetUseCases),
  subscribe: budgetUseCases.subscribeToChanges.bind(budgetUseCases)
}

// Presupuestos por categoría
export const CategoryBudgetService = {
  getSummary: categoryBudgetUseCases.getCategoryBudgetSummary.bind(categoryBudgetUseCases),
  save: categoryBudgetUseCases.saveCategoryBudget.bind(categoryBudgetUseCases),
  delete: categoryBudgetUseCases.deleteCategoryBudget.bind(categoryBudgetUseCases),
  subscribe: categoryBudgetUseCases.subscribeToChanges.bind(categoryBudgetUseCases)
}
