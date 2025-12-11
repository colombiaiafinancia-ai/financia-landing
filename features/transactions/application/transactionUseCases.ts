/**
 * Casos de Uso - Transactions (Capa de Aplicación)
 * 
 * RESPONSABILIDAD: Orquestar flujos de negocio
 * - Coordinar dominio + infraestructura
 * - Casos de uso específicos
 * - Validaciones de entrada
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

import {
  validateTransactionAmount,
  validateTransactionCategory,
  validateTransactionType,
  validateTransactionDescription,
  getCurrentMonthRange,
  getMonthRange,
  getWeeksRange,
  calculateCategorySummary,
  calculateWeeklySummary,
  normalizeTransactionAmount,
  type TransactionType,
  type TransactionCategory,
  type CategorySummary,
  type WeeklySummary
} from '../domain/transactionLogic'

import {
  transactionRepository,
  type TransactionEntity,
  type TransactionCreateEntity
} from '../services/transactionRepository'

/**
 * Tipos de aplicación (DTOs)
 */
export interface Transaction {
  id?: string
  userId: string
  amount: number
  category: TransactionCategory
  type: TransactionType
  description?: string
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface TransactionCreate {
  userId: string
  amount: number
  category: TransactionCategory
  type: TransactionType
  description?: string
  date?: string
}

/**
 * Errores de aplicación
 */
export class TransactionApplicationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'TransactionApplicationError'
  }
}

/**
 * Casos de uso para transacciones
 */
export class TransactionUseCases {
  /**
   * Obtener transacciones del mes actual
   */
  async getMonthlyTransactions(userId: string, year?: number, month?: number): Promise<Transaction[]> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const entities = await transactionRepository.findMonthlyByUser(userId, year, month)
      return entities.map(entity => this.mapEntityToDomain(entity))
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get monthly transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_MONTHLY_TRANSACTIONS_FAILED'
      )
    }
  }

  /**
   * Obtener resumen por categorías del mes actual
   */
  async getCategorySummary(userId: string): Promise<CategorySummary[]> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const transactions = await this.getMonthlyTransactions(userId)
      
      // Filtrar solo gastos para el resumen por categorías
      const expenses = transactions.filter(t => t.type === 'gasto')
      
      return calculateCategorySummary(expenses.map(t => ({
        categoria: t.category,
        monto: Math.abs(t.amount)
      })))
    } catch (error) {
      if (error instanceof TransactionApplicationError) {
        throw error
      }
      throw new TransactionApplicationError(
        `Failed to get category summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_CATEGORY_SUMMARY_FAILED'
      )
    }
  }

  /**
   * Obtener resumen semanal de las últimas 4 semanas
   */
  async getWeeklySummary(userId: string, weeksCount: number = 4): Promise<WeeklySummary[]> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const dateRange = getWeeksRange(weeksCount)
      const entities = await transactionRepository.findByUserAndDateRange(
        userId, 
        dateRange.startDate, 
        dateRange.endDate
      )
      
      const transactions = entities.map(entity => ({
        fecha: entity.fecha,
        monto: Math.abs(entity.monto)
      }))
      
      return calculateWeeklySummary(transactions, weeksCount)
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get weekly summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_WEEKLY_SUMMARY_FAILED'
      )
    }
  }

  /**
   * Obtener total gastado en el mes
   */
  async getMonthlySpent(userId: string): Promise<number> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const dateRange = getCurrentMonthRange()
      return await transactionRepository.getTotalSpentByUser(
        userId, 
        dateRange.startDate, 
        dateRange.endDate
      )
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get monthly spent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_MONTHLY_SPENT_FAILED'
      )
    }
  }

  /**
   * Obtener total de ingresos en el mes
   */
  async getMonthlyIncome(userId: string): Promise<number> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const dateRange = getCurrentMonthRange()
      return await transactionRepository.getTotalIncomeByUser(
        userId, 
        dateRange.startDate, 
        dateRange.endDate
      )
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get monthly income: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_MONTHLY_INCOME_FAILED'
      )
    }
  }

  /**
   * Obtener gastos por categoría para un período
   */
  async getExpensesByCategory(userId: string, monthDate: string): Promise<Record<string, number>> {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      // Convertir monthDate (YYYY-MM-01) a rango completo del mes
      const [year, month] = monthDate.split('-').map(Number)
      const dateRange = getMonthRange(year, month)
      
      return await transactionRepository.findExpensesByCategory(
        userId, 
        dateRange.startDate, 
        dateRange.endDate
      )
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get expenses by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_EXPENSES_BY_CATEGORY_FAILED'
      )
    }
  }

  /**
   * Crear nueva transacción
   */
  async createTransaction(transactionData: TransactionCreate): Promise<Transaction> {
    // Validaciones usando lógica de dominio
    const amountValidation = validateTransactionAmount(transactionData.amount)
    if (!amountValidation.isValid) {
      throw new TransactionApplicationError(
        `Invalid amount: ${amountValidation.errors.join(', ')}`,
        'INVALID_AMOUNT'
      )
    }

    const categoryValidation = validateTransactionCategory(transactionData.category)
    if (!categoryValidation.isValid) {
      throw new TransactionApplicationError(
        `Invalid category: ${categoryValidation.errors.join(', ')}`,
        'INVALID_CATEGORY'
      )
    }

    const typeValidation = validateTransactionType(transactionData.type)
    if (!typeValidation.isValid) {
      throw new TransactionApplicationError(
        `Invalid type: ${typeValidation.errors.join(', ')}`,
        'INVALID_TYPE'
      )
    }

    const descriptionValidation = validateTransactionDescription(transactionData.description)
    if (!descriptionValidation.isValid) {
      throw new TransactionApplicationError(
        `Invalid description: ${descriptionValidation.errors.join(', ')}`,
        'INVALID_DESCRIPTION'
      )
    }

    try {
      // Normalizar monto según tipo (gastos negativos, ingresos positivos)
      const normalizedAmount = normalizeTransactionAmount(transactionData.amount, transactionData.type)

      const createEntity: TransactionCreateEntity = {
        user_id: transactionData.userId,
        monto: normalizedAmount,
        categoria: transactionData.category,
        tipo: transactionData.type,
        descripcion: transactionData.description,
        fecha: transactionData.date
      }

      const entity = await transactionRepository.create(createEntity)
      return this.mapEntityToDomain(entity)
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_TRANSACTION_FAILED'
      )
    }
  }

  /**
   * Eliminar transacción
   */
  async deleteTransaction(id: string, userId: string): Promise<void> {
    if (!id) {
      throw new TransactionApplicationError('Transaction ID is required', 'INVALID_TRANSACTION_ID')
    }

    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      // Verificar que la transacción existe y pertenece al usuario
      const existing = await transactionRepository.findById(id, userId)
      if (!existing) {
        throw new TransactionApplicationError('Transaction not found', 'TRANSACTION_NOT_FOUND')
      }

      await transactionRepository.delete(id, userId)
    } catch (error) {
      if (error instanceof TransactionApplicationError) {
        throw error
      }
      throw new TransactionApplicationError(
        `Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_TRANSACTION_FAILED'
      )
    }
  }

  /**
   * Obtener transacción por ID
   */
  async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    if (!id) {
      throw new TransactionApplicationError('Transaction ID is required', 'INVALID_TRANSACTION_ID')
    }

    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const entity = await transactionRepository.findById(id, userId)
      return entity ? this.mapEntityToDomain(entity) : null
    } catch (error) {
      throw new TransactionApplicationError(
        `Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TRANSACTION_FAILED'
      )
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    if (!userId) {
      throw new TransactionApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    return transactionRepository.subscribeToChanges(userId, callback)
  }

  /**
   * Mapear entidad de BD a dominio
   */
  private mapEntityToDomain(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      userId: entity.user_id,
      amount: entity.monto,
      category: entity.categoria as TransactionCategory,
      type: entity.tipo as TransactionType,
      description: entity.descripcion,
      date: entity.fecha,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }
}

// Instancia singleton para reutilización
export const transactionUseCases = new TransactionUseCases()
