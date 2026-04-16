import { transactionRepository, TransactionEntity, CreateTransactionData } from '../infrastructure/transactionRepository'
import { monthSummaryRepository } from '../infrastructure/monthSummaryRepository'
import { categoryRepository } from '@/features/categories/infrastructure/categoryRepository'
import { validateTransactionCreation } from '../domain/transactionLogic'

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
}

export interface TransactionSummaryDTO {
  totalSpent: number
  totalIncome: number
  balance: number
  monthExpenses: number
  monthIncome: number
  expensesByCategory: Array<{
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
      formattedDate: new Date(entity.occurred_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
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
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [monthSummary, categoryRows, weeklyTrend] = await Promise.all([
      monthSummaryRepository.getMonthSummary(userId, monthStart),
      monthSummaryRepository.getMonthCategoryExpenses(userId, monthStart),
      this.calculateWeeklyTrend(userId),
    ])

    if (!monthSummary) {
      return this.getTransactionSummaryFromTransactions(userId, weeklyTrend)
    }

    const totalSpent = Number(monthSummary.expense_total) || 0
    const totalIncome = Number(monthSummary.income_total) || 0
    const balance = totalIncome - totalSpent

    const categoryIds = categoryRows.map((r) => r.category_id)
    const categoryMap = await this.getCategoryMap(userId, categoryIds)

    const expensesByCategory = categoryRows
      .map((row) => {
        const total = Number(row.total) || 0
        return {
          categoryId: row.category_id,
          categoryName: categoryMap.get(row.category_id) || 'Desconocida',
          total,
          percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
        }
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)

    return {
      totalSpent,
      totalIncome,
      balance,
      monthExpenses: totalSpent,
      monthIncome: totalIncome,
      expensesByCategory,
      weeklyTrend,
    }
  }

  private async getTransactionSummaryFromTransactions(
    userId: string,
    weeklyTrend: Array<{ week: string; amount: number; date: string }>
  ): Promise<TransactionSummaryDTO> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const monthTransactions = await transactionRepository.findByUserAndPeriod(
      userId,
      `${monthStart}T00:00:00.000Z`,
      `${monthEnd}T23:59:59.999Z`
    )

    const totalIncome = monthTransactions
      .filter((tx) => tx.direction === 'ingreso')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalSpent = monthTransactions
      .filter((tx) => tx.direction === 'gasto')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const balance = totalIncome - totalSpent

    const categoryTotals = monthTransactions.reduce((acc, tx) => {
      if (tx.direction !== 'gasto') return acc
      acc.set(tx.category_id, (acc.get(tx.category_id) || 0) + tx.amount)
      return acc
    }, new Map<string, number>())

    const categoryIds = [...categoryTotals.keys()]
    const categoryMap = await this.getCategoryMap(userId, categoryIds)

    const expensesByCategory = [...categoryTotals.entries()]
      .map(([categoryId, total]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Desconocida',
        total,
        percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    return {
      totalSpent,
      totalIncome,
      balance,
      monthExpenses: totalSpent,
      monthIncome: totalIncome,
      expensesByCategory,
      weeklyTrend,
    }
  }

  private async calculateWeeklyTrend(userId: string): Promise<Array<{ week: string; amount: number; date: string }>> {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const dailyExpenses = await monthSummaryRepository.getDailyExpenses(userId, startDate, endDate)

    const weeks: Array<{ week: string; amount: number; date: string }> = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      const weekTotal = dailyExpenses
        .filter(d => d.day >= weekStartStr && d.day <= weekEndStr)
        .reduce((sum, d) => sum + d.total, 0)

      const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
      weeks.push({
        week: weekLabel,
        amount: weekTotal,
        date: weekStart.toLocaleDateString('es-CO')
      })
    }
    return weeks
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

    return {
      transactions,
      totalSpent: summary.totalSpent,
      totalIncome: summary.totalIncome,
      todayExpenses: 0,
      weekExpenses: summary.weeklyTrend[0]?.amount || 0,
      monthExpenses: summary.monthExpenses,
      expensesByCategory: summary.expensesByCategory.reduce((acc, item) => {
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