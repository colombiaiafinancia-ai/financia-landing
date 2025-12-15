/**
 * APPLICATION LAYER - Transaction Use Cases
 * 
 * Orquesta la lógica de dominio y los repositorios.
 * Define los casos de uso de la aplicación para transacciones.
 */

import {
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
  formatTransactionAmount,
  type Transaction,
  type TransactionSummary,
  type WeeklyData,
  type CategorySummary,
  type TransactionType
} from '../domain/transactionLogic'

import { 
  transactionRepository, 
  type TransactionEntity, 
  type TransactionCreationData 
} from '../services/transactionRepository'

export interface TransactionCreationRequest {
  valor: number
  categoria: string
  tipo: TransactionType
  descripcion?: string
}

export interface TransactionUpdateRequest {
  valor?: number
  categoria?: string
  tipo?: TransactionType
  descripcion?: string
}

export interface TransactionStats {
  totalTransactions: number
  totalSpent: number
  totalIncome: number
  averageTransaction: number
  mostUsedCategory: string | null
  thisWeekSpent: number
  lastWeekSpent: number
}

export class TransactionUseCases {
  /**
   * Mapear entidad de BD a modelo de dominio
   */
  private mapEntityToDomain(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      usuario_id: entity.usuario_id,
      valor: entity.valor,
      categoria: entity.categoria,
      tipo: entity.tipo as 'gasto' | 'ingreso' | null,
      descripcion: entity.descripcion,
      creado_en: entity.creado_en
    }
  }

  /**
   * Obtener todas las transacciones de un usuario
   */
  async getAllTransactions(userId: string): Promise<Transaction[]> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Loading all transactions for user:', userId)
      
      const entities = await transactionRepository.findAllByUser(userId)
      const transactions = entities.map(this.mapEntityToDomain)
      
      console.log('✅ TRANSACTION_USE_CASE - Transactions loaded:', transactions.length)
      return transactions
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error loading transactions:', error)
      throw error
    }
  }

  /**
   * Obtener transacciones del mes actual
   */
  async getMonthlyTransactions(userId: string, year?: number, month?: number): Promise<Transaction[]> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Loading monthly transactions:', { userId, year, month })
      
      const entities = await transactionRepository.findByUserAndPeriod(userId, year, month)
      const transactions = entities.map(this.mapEntityToDomain)
      
      console.log('✅ TRANSACTION_USE_CASE - Monthly transactions loaded:', transactions.length)
      return transactions
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error loading monthly transactions:', error)
      throw error
    }
  }

  /**
   * Crear nueva transacción
   */
  async createTransaction(userId: string, transactionData: TransactionCreationRequest): Promise<Transaction> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Creating transaction:', { userId, transactionData })
      
      // Validar usando lógica de dominio
      const validation = validateTransactionCreation({
        valor: transactionData.valor,
        categoria: transactionData.categoria,
        tipo: transactionData.tipo,
        descripcion: transactionData.descripcion
      })
      
      if (!validation.isValid) {
        throw new Error(`Datos de transacción inválidos: ${validation.errors.join(', ')}`)
      }
      
      // Crear en el repositorio
      const creationData: TransactionCreationData = {
        usuario_id: userId,
        valor: transactionData.valor,
        categoria: transactionData.categoria,
        tipo: transactionData.tipo,
        descripcion: transactionData.descripcion || null
      }
      
      const entity = await transactionRepository.create(creationData)
      const transaction = this.mapEntityToDomain(entity)
      
      console.log('✅ TRANSACTION_USE_CASE - Transaction created:', transaction.id)
      return transaction
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error creating transaction:', error)
      throw error
    }
  }

  /**
   * Actualizar transacción existente
   */
  async updateTransaction(
    transactionId: string, 
    userId: string, 
    updates: TransactionUpdateRequest
  ): Promise<Transaction> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Updating transaction:', { transactionId, userId, updates })
      
      // Validar actualizaciones si se proporcionan
      if (Object.keys(updates).length > 0) {
        const validation = validateTransactionCreation({
          valor: updates.valor || 0, // Valor dummy para validación
          categoria: updates.categoria || 'dummy',
          tipo: updates.tipo || 'gasto',
          descripcion: updates.descripcion
        })
        
        // Solo validar campos que se están actualizando
        if (updates.valor !== undefined || updates.categoria !== undefined || updates.tipo !== undefined) {
          if (!validation.isValid) {
            throw new Error(`Datos de actualización inválidos: ${validation.errors.join(', ')}`)
          }
        }
      }
      
      const entity = await transactionRepository.update(transactionId, userId, updates)
      const transaction = this.mapEntityToDomain(entity)
      
      console.log('✅ TRANSACTION_USE_CASE - Transaction updated:', transaction.id)
      return transaction
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error updating transaction:', error)
      throw error
    }
  }

  /**
   * Eliminar transacción
   */
  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Deleting transaction:', { transactionId, userId })
      
      await transactionRepository.delete(transactionId, userId)
      
      console.log('✅ TRANSACTION_USE_CASE - Transaction deleted:', transactionId)
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error deleting transaction:', error)
      throw error
    }
  }

  /**
   * Obtener resumen completo de transacciones
   */
  async getTransactionSummary(userId: string): Promise<TransactionSummary> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Calculating transaction summary for user:', userId)
      
      const transactions = await this.getAllTransactions(userId)
      const summary = calculateTransactionSummary(transactions)
      
      console.log('✅ TRANSACTION_USE_CASE - Summary calculated:', {
        totalSpent: summary.totalSpent,
        totalIncome: summary.totalIncome,
        todayExpenses: summary.todayExpenses,
        weekExpenses: summary.weekExpenses,
        monthExpenses: summary.monthExpenses,
        categoriesCount: Object.keys(summary.expensesByCategory).length
      })
      
      return summary
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error calculating summary:', error)
      throw error
    }
  }

  /**
   * Obtener resumen por categorías
   */
  async getCategorySummary(userId: string): Promise<CategorySummary[]> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Calculating category summary for user:', userId)
      
      const transactions = await this.getAllTransactions(userId)
      const categorySummary = calculateCategorySummary(transactions)
      
      console.log('✅ TRANSACTION_USE_CASE - Category summary calculated:', categorySummary.length, 'categories')
      return categorySummary
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error calculating category summary:', error)
      throw error
    }
  }

  /**
   * Obtener tendencia semanal
   */
  async getWeeklySummary(userId: string): Promise<WeeklyData[]> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Calculating weekly trend for user:', userId)
      
      const transactions = await this.getAllTransactions(userId)
      const weeklyTrend = calculateWeeklyTrend(transactions)
      
      console.log('✅ TRANSACTION_USE_CASE - Weekly trend calculated:', weeklyTrend.length, 'weeks')
      return weeklyTrend
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error calculating weekly trend:', error)
      throw error
    }
  }

  /**
   * Obtener gasto mensual total
   */
  async getMonthlySpent(userId: string): Promise<number> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Calculating monthly spent for user:', userId)
      
      const monthlySpent = await transactionRepository.getMonthlySpent(userId)
      
      console.log('✅ TRANSACTION_USE_CASE - Monthly spent calculated:', monthlySpent)
      return monthlySpent
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error calculating monthly spent:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas rápidas
   */
  async getTransactionStats(userId: string): Promise<TransactionStats> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Calculating transaction stats for user:', userId)
      
      const transactions = await this.getAllTransactions(userId)
      const categorySummary = calculateCategorySummary(transactions)
      const weeklyTrend = calculateWeeklyTrend(transactions)
      
      const totalTransactions = transactions.length
      const totalSpent = calculateTotalExpenses(transactions)
      const totalIncome = calculateTotalIncome(transactions)
      const averageTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0
      const mostUsedCategory = categorySummary.length > 0 ? categorySummary[0].categoria : null
      const thisWeekSpent = weeklyTrend.length > 0 ? weeklyTrend[weeklyTrend.length - 1].amount : 0
      const lastWeekSpent = weeklyTrend.length > 1 ? weeklyTrend[weeklyTrend.length - 2].amount : 0
      
      const stats: TransactionStats = {
        totalTransactions,
        totalSpent,
        totalIncome,
        averageTransaction,
        mostUsedCategory,
        thisWeekSpent,
        lastWeekSpent
      }
      
      console.log('✅ TRANSACTION_USE_CASE - Stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error calculating stats:', error)
      throw error
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    console.log('💰 TRANSACTION_USE_CASE - Setting up real-time subscription for user:', userId)
    return transactionRepository.subscribeToChanges(userId, callback)
  }

  /**
   * MÉTODOS DE COMPATIBILIDAD CON HOOKS LEGACY
   */

  /**
   * Obtener transacciones con cálculos optimizados (para useTransactionsUnified)
   */
  async getTransactionsWithCalculations(userId: string): Promise<{
    transactions: Transaction[]
    totalSpent: number
    totalIncome: number
    todayExpenses: number
    weekExpenses: number
    monthExpenses: number
    expensesByCategory: Record<string, number>
    weeklyTrend: WeeklyData[]
  }> {
    try {
      console.log('💰 TRANSACTION_USE_CASE - Loading transactions with calculations for user:', userId)
      
      const transactions = await this.getAllTransactions(userId)
      
      const result = {
        transactions,
        totalSpent: calculateTotalExpenses(transactions),
        totalIncome: calculateTotalIncome(transactions),
        todayExpenses: calculateTodayExpenses(transactions),
        weekExpenses: calculateWeekExpenses(transactions),
        monthExpenses: calculateMonthExpenses(transactions),
        expensesByCategory: groupExpensesByCategory(transactions),
        weeklyTrend: calculateWeeklyTrend(transactions)
      }
      
      console.log('✅ TRANSACTION_USE_CASE - Transactions with calculations loaded:', {
        transactionsCount: result.transactions.length,
        totalSpent: result.totalSpent,
        totalIncome: result.totalIncome
      })
      
      return result
    } catch (error) {
      console.error('❌ TRANSACTION_USE_CASE - Error loading transactions with calculations:', error)
      throw error
    }
  }
}

// Singleton instance
export const transactionUseCases = new TransactionUseCases()