import { transactionRepository, TransactionEntity, CreateTransactionData } from '../infrastructure/transactionRepository'
import { monthSummaryRepository } from '../infrastructure/monthSummaryRepository'
import { categoryRepository } from '@/features/categories/infrastructure/categoryRepository'
import { validateTransactionCreation } from '../domain/transactionLogic'
import {
  addDaysToDateKey,
  formatDateKey,
  getBogotaCurrentWeekWindows,
  getBogotaDateKey,
} from '@/utils/bogotaDate'

export interface TransactionCreationRequest {
  amount: number
  categoryId: string
  direction: 'gasto' | 'ingreso'
  description?: string
}

export interface TransactionUpdateRequest {
  amount?: number
  categoryId?: string
  direction?: 'gasto' | 'ingreso'
  description?: string | null
  occurredAt?: string
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

// DTO de salida (usado internamente)
export interface TransactionDTO {
  id: string
  userId: string
  amount: number
  categoryId: string
  categoryName: string
  direction: 'gasto' | 'ingreso'
  description: string | null
  occurredAt: string
  formattedAmount: string
  formattedDate: string
  isRollover: boolean
  isRecurring: boolean
}

export interface TransactionSummaryDTO {
  totalSpent: number
  totalIncome: number
  initialBalance: number
  availableBalance: number
  balance: number
  monthExpenses: number
  monthIncome: number
  expensesByCategory: Array<{
    categoryId: string
    categoryName: string
    total: number
    percentage: number
  }>
  incomeByCategory: Array<{
    categoryId: string
    categoryName: string
    total: number
    percentage: number
  }>
  weeklyTrend: Array<{ week: string; amount: number; date: string }>
}

export class TransactionUseCases {
  private async getCategoryMap(userId: string, categoryIds: string[]): Promise<Map<string, string>> {
    if (categoryIds.length === 0) return new Map()
    // Obtener todas las categorías de una sola vez
    const categories = await Promise.all(categoryIds.map(id => categoryRepository.findById(id)))
    const map = new Map()
    categories.forEach(c => { if (c) map.set(c.id, c.name) })
    return map
  }

  private mapEntityToDTO = async (entity: TransactionEntity): Promise<TransactionDTO> => {
    const category = await categoryRepository.findById(entity.category_id)
    return {
      id: entity.id,
      userId: entity.user_id,
      amount: entity.amount,
      categoryId: entity.category_id,
      categoryName: category?.name || 'Sin categoría',
      direction: entity.direction,
      description: entity.description,
      occurredAt: entity.occurred_at,
      formattedAmount: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(entity.amount),
      formattedDate: new Date(entity.occurred_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }),
      isRollover: entity.meta?.type === 'monthly_rollover',
      isRecurring: entity.meta?.type === 'recurring_expense'
    }
  }

  async getAllTransactions(userId: string): Promise<TransactionDTO[]> {
    const entities = await transactionRepository.findAllByUser(userId)
    return Promise.all(entities.map(e => this.mapEntityToDTO(e)))
  }

  async createTransaction(userId: string, data: TransactionCreationRequest): Promise<TransactionDTO> {
    const validation = validateTransactionCreation({
      valor: data.amount,
      categoria: data.categoryId,
      tipo: data.direction,
      descripcion: data.description
    })
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`)
    }

    const createData: CreateTransactionData = {
      user_id: userId,
      direction: data.direction,
      amount: data.amount,
      category_id: data.categoryId,
      description: data.description
    }
    const entity = await transactionRepository.create(createData)
    return this.mapEntityToDTO(entity)
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    await transactionRepository.delete(transactionId, userId)
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    data: TransactionUpdateRequest
  ): Promise<TransactionDTO> {
    const entities = await transactionRepository.findAllByUser(userId)
    const current = entities.find((t) => t.id === transactionId)
    if (!current) {
      throw new Error('Transacción no encontrada')
    }

    const amount = data.amount ?? current.amount
    const categoryId = data.categoryId ?? current.category_id
    const direction = data.direction ?? current.direction
    const description =
      data.description !== undefined ? data.description : current.description
    const occurredAt = data.occurredAt ?? current.occurred_at

    const validation = validateTransactionCreation({
      valor: amount,
      categoria: categoryId,
      tipo: direction,
      descripcion: description ?? undefined,
    })
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`)
    }

    const updated = await transactionRepository.update(transactionId, userId, {
      amount,
      category_id: categoryId,
      direction,
      description,
      occurred_at: occurredAt,
    })
    return await this.mapEntityToDTO(updated)
  }

 
  async getTransactionSummary(userId: string): Promise<TransactionSummaryDTO> {
    const weeklyTrend = await this.calculateWeeklyTrend(userId)
    return this.getTransactionSummaryFromTransactions(userId, weeklyTrend)
  }

  private async getTransactionSummaryFromTransactions(
    userId: string,
    weeklyTrend: Array<{ week: string; amount: number; date: string }>
  ): Promise<TransactionSummaryDTO> {
    const today = getBogotaDateKey()
    const monthStart = `${today.slice(0, 7)}-01`
    const startUtc = `${monthStart}T05:00:00.000Z`
    const endUtc = `${addDaysToDateKey(today, 1)}T04:59:59.999Z`

    const monthTransactions = await transactionRepository.findByUserAndPeriod(
      userId,
      startUtc,
      endUtc
    )

    const realMonthTransactions = monthTransactions.filter((tx) => tx.meta?.type !== 'monthly_rollover')
    const initialBalance = monthTransactions
      .filter((tx) => tx.meta?.type === 'monthly_rollover')
      .reduce((sum, tx) => sum + (tx.direction === 'ingreso' ? tx.amount : -tx.amount), 0)

    const totalIncome = realMonthTransactions
      .filter((tx) => tx.direction === 'ingreso')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalSpent = realMonthTransactions
      .filter((tx) => tx.direction === 'gasto')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const balance = totalIncome - totalSpent
    const availableBalance = initialBalance + balance

    const categoryTotals = realMonthTransactions.reduce((acc, tx) => {
      if (tx.direction !== 'gasto') return acc
      acc.set(tx.category_id, (acc.get(tx.category_id) || 0) + tx.amount)
      return acc
    }, new Map<string, number>())

    const incomeCategoryTotals = realMonthTransactions.reduce((acc, tx) => {
      if (tx.direction !== 'ingreso') return acc
      acc.set(tx.category_id, (acc.get(tx.category_id) || 0) + tx.amount)
      return acc
    }, new Map<string, number>())

    const categoryIds = [...categoryTotals.keys(), ...incomeCategoryTotals.keys()]
    const categoryMap = await this.getCategoryMap(userId, categoryIds)

    const mapCategoryTotals = (
      totals: Map<string, number>,
      totalByDirection: number
    ) => [...totals.entries()]
      .map(([categoryId, total]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Desconocida',
        total,
        percentage: totalByDirection > 0 ? (total / totalByDirection) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const expensesByCategory = mapCategoryTotals(categoryTotals, totalSpent)
    const incomeByCategory = mapCategoryTotals(incomeCategoryTotals, totalIncome)

    return {
      totalSpent,
      totalIncome,
      initialBalance,
      availableBalance,
      balance,
      monthExpenses: totalSpent,
      monthIncome: totalIncome,
      expensesByCategory,
      incomeByCategory,
      weeklyTrend,
    }
  }

  private async calculateWeeklyTrend(userId: string): Promise<Array<{ week: string; amount: number; date: string }>> {
    const weekWindows = getBogotaCurrentWeekWindows(4)
    const startDate = weekWindows[0].startKey
    const endDate = weekWindows[weekWindows.length - 1].endKey

    const dailyExpenses = await monthSummaryRepository.getDailyExpenses(userId, startDate, endDate)

    return weekWindows.map((week) => {
      const weekTotal = dailyExpenses
        .filter(d => d.day >= week.startKey && d.day <= week.endKey)
        .reduce((sum, d) => sum + d.total, 0)

      return {
        week: week.label,
        amount: weekTotal,
        date: formatDateKey(week.startKey)
      }
    })
  }

  async getDailyTrend(userId: string, days: number = 7): Promise<Array<{ date: string; amount: number }>> {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dailyExpenses = await monthSummaryRepository.getDailyExpenses(userId, startDate, endDate)
    
    const result: Array<{ date: string; amount: number }> = []
    const dateMap = new Map(dailyExpenses.map(d => [d.day, d.total]))
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      result.push({ date, amount: dateMap.get(date) || 0 })
    }
    return result
  }

  async getMonthlyTrend(userId: string, months: number = 12): Promise<Array<{ month: string; amount: number }>> {
    const result: Array<{ month: string; amount: number }> = []
    const now = new Date()
    const promises = []
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = date.toISOString().split('T')[0]
      promises.push(monthSummaryRepository.getMonthSummary(userId, monthStart).then(summary => ({
        month: date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
        amount: summary?.expense_total || 0
      })))
    }
    return Promise.all(promises)
  }

  async getTransactionsWithCalculations(userId: string) {
    // Ejecutar todas las consultas en paralelo
    const [transactions, summary, dailyTrend, monthlyTrend] = await Promise.all([
      this.getAllTransactions(userId),
      this.getTransactionSummary(userId),
      this.getDailyTrend(userId, 7),
      this.getMonthlyTrend(userId, 12)
    ])
    const currentWeek = summary.weeklyTrend[summary.weeklyTrend.length - 1]

    return {
      transactions,
      totalSpent: summary.totalSpent,
      totalIncome: summary.totalIncome,
      initialBalance: summary.initialBalance,
      availableBalance: summary.availableBalance,
      todayExpenses: 0,
      weekExpenses: currentWeek?.amount || 0,
      monthExpenses: summary.monthExpenses,
      expensesByCategory: summary.expensesByCategory.reduce((acc, item) => {
        acc[item.categoryName] = item.total
        return acc
      }, {} as Record<string, number>),
      incomeByCategory: summary.incomeByCategory.reduce((acc, item) => {
        acc[item.categoryName] = item.total
        return acc
      }, {} as Record<string, number>),
      weeklyTrend: summary.weeklyTrend,
      dailyTrend,
      monthlyTrend
    }
  }
}

export const transactionUseCases = new TransactionUseCases()
