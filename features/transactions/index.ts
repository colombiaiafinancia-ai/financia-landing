/**
 * Punto de entrada para la feature Transactions
 * 
 * Exporta todas las funcionalidades públicas de la feature
 * manteniendo la separación de capas interna.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

// Casos de uso (capa de aplicación) - API pública
export {
  transactionUseCases,
  TransactionApplicationError,
  type Transaction,
  type TransactionCreate
} from './application/transactionUseCases'

// Lógica de dominio - para casos especiales
export {
  validateTransactionAmount,
  validateTransactionCategory,
  validateTransactionType,
  validateTransactionDescription,
  getCurrentMonthRange,
  getMonthRange,
  getWeeksRange,
  calculateCategorySummary,
  calculateWeeklySummary,
  formatTransactionAmount,
  getCategoryColor,
  isExpense,
  isIncome,
  normalizeTransactionAmount,
  CATEGORY_COLORS,
  type TransactionType,
  type TransactionCategory,
  type CategorySummary,
  type WeeklySummary,
  type DateRange,
  type TransactionValidation
} from './domain/transactionLogic'

// Repositorio - solo para testing o casos muy específicos
export {
  transactionRepository
} from './services/transactionRepository'

/**
 * API de conveniencia para casos de uso más comunes
 */
export const TransactionService = {
  // Consultas
  getMonthly: transactionUseCases.getMonthlyTransactions.bind(transactionUseCases),
  getCategorySummary: transactionUseCases.getCategorySummary.bind(transactionUseCases),
  getWeeklySummary: transactionUseCases.getWeeklySummary.bind(transactionUseCases),
  getMonthlySpent: transactionUseCases.getMonthlySpent.bind(transactionUseCases),
  getMonthlyIncome: transactionUseCases.getMonthlyIncome.bind(transactionUseCases),
  getExpensesByCategory: transactionUseCases.getExpensesByCategory.bind(transactionUseCases),
  getById: transactionUseCases.getTransactionById.bind(transactionUseCases),
  
  // Operaciones
  create: transactionUseCases.createTransaction.bind(transactionUseCases),
  delete: transactionUseCases.deleteTransaction.bind(transactionUseCases),
  
  // Suscripciones
  subscribe: transactionUseCases.subscribeToChanges.bind(transactionUseCases)
}
