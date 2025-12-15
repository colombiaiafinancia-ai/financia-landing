/**
 * TRANSACTIONS FEATURE - Public API
 * 
 * Punto de entrada único para la funcionalidad de transacciones.
 * Exporta únicamente lo necesario para el resto de la aplicación.
 */

// DTOs (contratos para la UI)
export type {
  TransactionDTO,
  TransactionSummaryDTO,
  CategoryExpenseDTO,
  WeeklyDataDTO,
  TransactionStatsDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFiltersDTO,
  TransactionPeriodDTO
} from './dto/transactionDTO'
export { TransactionDTOMapper } from './dto/transactionDTO'

// Domain types and logic (solo tipos y funciones puras)
export type { 
  Transaction,
  TransactionSummary,
  WeeklyData,
  CategorySummary,
  TransactionValidation,
  TransactionType
} from './domain/transactionLogic'

export { 
  validateTransactionData,
  validateTransactionCreation,
  calculateTransactionSummary,
  calculateTodayExpenses,
  calculateWeekExpenses,
  calculateMonthExpenses,
  calculateTotalIncome,
  calculateTotalExpenses,
  groupExpensesByCategory,
  calculateCategorySummary,
  calculateWeeklyTrend,
  formatTransactionAmount
} from './domain/transactionLogic'

// Application layer (casos de uso)
export { transactionUseCases } from './application/transactionUseCases'
export type {
  TransactionCreationRequest,
  TransactionUpdateRequest,
  TransactionStats
} from './application/transactionUseCases'

// Infrastructure layer (solo para casos especiales)
export { transactionRepository } from './services/transactionRepository'

// Convenience exports para facilitar el uso
export const TransactionService = {
  // Consultas
  getAll: (userId: string) => 
    transactionUseCases.getAllTransactions(userId),
  
  getMonthly: (userId: string, year?: number, month?: number) => 
    transactionUseCases.getMonthlyTransactions(userId, year, month),
  
  getSummary: (userId: string) => 
    transactionUseCases.getTransactionSummary(userId),
  
  getCategorySummary: (userId: string) => 
    transactionUseCases.getCategorySummary(userId),
  
  getWeeklySummary: (userId: string) => 
    transactionUseCases.getWeeklySummary(userId),
  
  getMonthlySpent: (userId: string) => 
    transactionUseCases.getMonthlySpent(userId),
  
  getStats: (userId: string) => 
    transactionUseCases.getTransactionStats(userId),
  
  // Operaciones
  create: (userId: string, data: import('./application/transactionUseCases').TransactionCreationRequest) => 
    transactionUseCases.createTransaction(userId, data),
  
  update: (transactionId: string, userId: string, updates: import('./application/transactionUseCases').TransactionUpdateRequest) => 
    transactionUseCases.updateTransaction(transactionId, userId, updates),
  
  delete: (transactionId: string, userId: string) => 
    transactionUseCases.deleteTransaction(transactionId, userId),
  
  // Suscripciones
  subscribe: (userId: string, callback: () => void) => 
    transactionUseCases.subscribeToChanges(userId, callback),
  
  // Métodos de compatibilidad con hooks legacy
  getWithCalculations: (userId: string) => 
    transactionUseCases.getTransactionsWithCalculations(userId)
}