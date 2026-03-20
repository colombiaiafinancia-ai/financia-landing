/**
 * TRANSACTIONS FEATURE - Public API
 */

// DTOs (contratos para la UI)
export type {
  TransactionDTO,
  TransactionSummaryDTO,
  CategoryExpenseDTO,
  WeeklyDataDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFiltersDTO,
  TransactionPeriodDTO
} from './dto/transactionDTO'

export { TransactionDTOMapper } from './dto/transactionDTO'

// Domain types and logic
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

// Infrastructure layer
export { transactionRepository } from './infrastructure/transactionRepository'

// Convenience exports
import { transactionUseCases } from './application/transactionUseCases'
import type { TransactionCreationRequest } from './application/transactionUseCases'

export const TransactionService = {
  getAll: (userId: string) => transactionUseCases.getAllTransactions(userId),
  getSummary: (userId: string) => transactionUseCases.getTransactionSummary(userId),
  create: (userId: string, data: TransactionCreationRequest) => transactionUseCases.createTransaction(userId, data),
  delete: (transactionId: string, userId: string) => transactionUseCases.deleteTransaction(transactionId, userId),
  getWithCalculations: (userId: string) => transactionUseCases.getTransactionsWithCalculations(userId)
}