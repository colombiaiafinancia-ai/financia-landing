import { transactionRepository, TransactionEntity, CreateTransactionData } from '../infrastructure/transactionRepository'
import { monthSummaryRepository } from '../infrastructure/monthSummaryRepository'
import { categoryRepository, type CategoryEntity } from '@/features/categories/infrastructure/categoryRepository'
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

const copFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })

export class TransactionUseCases {
  private async getCategoryMap(userId: string, categoryIds: string[]): Promise<Map<string, string>> {
    // Una sola consulta para todas las categorías
    return categoryRepository.findNameMap(categoryIds)
  }

  private mapEntityToDTO = async (entity: TransactionEntity): Promise<TransactionDTO> => {
    const category = await categoryRepository.findById(entity.category_id)
    return this.toDTO(entity, category?.name)
  }

  private toDTO(entity: TransactionEntity, categoryName: string | undefined): TransactionDTO {
    return {
      id: entity.id,
      userId: entity.user_id,
      amount: entity.amount,
      categoryId: entity.category_id,
      categoryName: categoryName || 'Sin categoría',
      direction: entity.direction,
      description: entity.description,
      occurredAt: entity.occurred_at,
      formattedAmount: copFormatter.format(entity.amount),
      formattedDate: dateFormatter.format(new Date(entity.occurred_at)),
      isRollover: entity.meta?.type === 'monthly_rollover',
      isRecurring: entity.meta?.type === 'recurring_expense'
    }
  }

  async getAllTransactions(userId: string): Promise<TransactionDTO[]> {
    const entities = await transactionRepository.findAllByUser(userId)
    return this.entitiesToDTOs(entities)
  }

  private async entitiesToDTOs(entities: TransactionEntity[]): Promise<TransactionDTO[]> {
    const names = await categoryRepository.findNameMap(entities.map(e => e.category_id))
    return entities.map(e => this.toDTO(e, names.get(e.category_id)))
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
    const current = await transactionRepository.findById(transactionId, userId)
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
    const { startUtc, endUtc } = this.getCurrentMonthUtcRange()
    const [weeklyTrend, monthTransactions] = await Promise.all([
      this.calculateWeeklyTrend(userId),
      transactionRepository.findByUserAndPeriod(userId, startUtc, endUtc),
    ])
    return this.getTransactionSummaryFromTransactions(monthTransactions, weeklyTrend)
  }

  private getCurrentMonthUtcRange() {
    const today = getBogotaDateKey()
    const monthStart = `${today.slice(0, 7)}-01`
    return {
      startUtc: `${monthStart}T05:00:00.000Z`,
      endUtc: `${addDaysToDateKey(today, 1)}T04:59:59.999Z`,
    }
  }

  private async getTransactionSummaryFromTransactions(
    monthTransactions: TransactionEntity[],
    weeklyTrend: Array<{ week: string; amount: number; date: string }>,
    knownCategoryNames?: Map<string, string>
  ): Promise<TransactionSummaryDTO> {
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
    const categoryMap = knownCategoryNames ?? await this.getCategoryMap('', categoryIds)

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
    return this.buildWeeklyTrend(dailyExpenses)
  }

  private buildWeeklyTrend(
    dailyExpenses: Array<{ day: string; total: number }>
  ): Array<{ week: string; amount: number; date: string }> {
    const weekWindows = getBogotaCurrentWeekWindows(4)
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

  private getDailyTrendRange(days: number) {
    return {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  }

  async getDailyTrend(userId: string, days: number = 7): Promise<Array<{ date: string; amount: number }>> {
    const { startDate, endDate } = this.getDailyTrendRange(days)
    const dailyExpenses = await monthSummaryRepository.getDailyExpenses(userId, startDate, endDate)
    return this.buildDailyTrend(dailyExpenses, days)
  }

  private buildDailyTrend(
    dailyExpenses: Array<{ day: string; total: number }>,
    days: number
  ): Array<{ date: string; amount: number }> {
    const result: Array<{ date: string; amount: number }> = []
    const dateMap = new Map(dailyExpenses.map(d => [d.day, d.total]))
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      result.push({ date, amount: dateMap.get(date) || 0 })
    }
    return result
  }

  async getMonthlyTrend(userId: string, months: number = 12): Promise<Array<{ month: string; amount: number }>> {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const fromMonth = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`
    // Una sola consulta para todo el rango (antes: una por mes)
    const summaries = await monthSummaryRepository.getMonthSummariesFrom(userId, fromMonth)
    const totals = new Map(summaries.map(s => [String(s.month).slice(0, 7), Number(s.expense_total) || 0]))

    const result: Array<{ month: string; amount: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      result.push({
        month: date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
        amount: totals.get(key) || 0
      })
    }
    return result
  }

  /**
   * @param categories Categorías visibles ya solicitadas (p. ej. compartidas en el servidor).
   * Si no se pasan, se piden en paralelo con las transacciones.
   */
  async getTransactionsWithCalculations(userId: string, categories?: Promise<CategoryEntity[]>) {
    const weekWindows = getBogotaCurrentWeekWindows(4)
    const dailyRange = this.getDailyTrendRange(7)
    // Un solo rango diario cubre la tendencia semanal (4 semanas) y la diaria (7 días)
    const dailyStart = [weekWindows[0].startKey, dailyRange.startDate].sort()[0]
    const dailyEnd = [weekWindows[weekWindows.length - 1].endKey, dailyRange.endDate].sort().reverse()[0]

    // Todas las consultas en paralelo: transacciones, gasto diario y resumen mensual
    // Las categorías también van en paralelo (antes: después de las transacciones)
    const [entities, dailyExpenses, monthlyTrend, visibleCategories] = await Promise.all([
      transactionRepository.findAllByUser(userId),
      monthSummaryRepository.getDailyExpenses(userId, dailyStart, dailyEnd),
      this.getMonthlyTrend(userId, 12),
      categories ?? categoryRepository.findAllVisibleForUser(userId),
    ])

    // El resumen del mes se calcula sobre las transacciones ya cargadas (sin volver a consultar)
    const categoryNames = new Map(visibleCategories.map(c => [c.id, c.name]))
    const missingIds = entities.map(e => e.category_id).filter(id => id && !categoryNames.has(id))
    if (missingIds.length > 0) {
      // Caso raro: categoría fuera de las visibles; se completa en una sola consulta
      for (const [id, name] of await categoryRepository.findNameMap(missingIds)) categoryNames.set(id, name)
    }
    const transactions = entities.map(e => this.toDTO(e, categoryNames.get(e.category_id)))
    const { startUtc, endUtc } = this.getCurrentMonthUtcRange()
    const startMs = Date.parse(startUtc)
    const endMs = Date.parse(endUtc)
    const monthEntities = entities.filter(e => {
      const t = Date.parse(e.occurred_at)
      return t >= startMs && t <= endMs
    })
    const summary = await this.getTransactionSummaryFromTransactions(
      monthEntities,
      this.buildWeeklyTrend(dailyExpenses),
      categoryNames
    )
    const dailyTrend = this.buildDailyTrend(dailyExpenses, 7)
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
