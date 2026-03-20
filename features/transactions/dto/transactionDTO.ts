/**
 * DTOs para Transactions Feature
 *
 * Define los contratos de datos que la UI debe usar.
 * La UI NUNCA debe acceder a entidades de Supabase directamente.
 */

const DEBUG_TRANSACTIONS = false

export interface TransactionDTO {
  readonly id: string
  readonly userId: string
  readonly amount: number
  readonly categoryId: string
  readonly category: string | null
  readonly type: 'gasto' | 'ingreso' | null
  readonly description: string | null
  readonly createdAt: string | null
  readonly formattedAmount: string
  readonly formattedDate: string
}

export interface TransactionSummaryDTO {
  readonly totalSpent: number
  readonly totalIncome: number
  readonly balance: number
  readonly todayExpenses: number
  readonly weekExpenses: number
  readonly monthExpenses: number
  readonly transactionCount: number
  readonly expensesByCategory: readonly CategoryExpenseDTO[]
  readonly weeklyTrend: readonly WeeklyDataDTO[]
  readonly formattedTotalSpent: string
  readonly formattedTotalIncome: string
  readonly formattedBalance: string
}

export interface CategoryExpenseDTO {
  readonly categoria: string
  readonly total: number
  readonly count: number
  readonly percentage: number
  readonly formattedTotal: string
}

export interface WeeklyDataDTO {
  readonly week: string
  readonly amount: number
  readonly date: string
  readonly formattedAmount: string
  readonly formattedDate: string
}

export interface TransactionStatsDTO {
  readonly totalTransactions: number
  readonly totalSpent: number
  readonly totalIncome: number
  readonly averageTransaction: number
  readonly mostUsedCategory: string | null
  readonly thisWeekSpent: number
  readonly lastWeekSpent: number
  readonly weeklyGrowth: number
  readonly formattedAverageTransaction: string
  readonly formattedThisWeekSpent: string
  readonly formattedLastWeekSpent: string
}

export interface CreateTransactionDTO {
  readonly amount: number
  readonly category: string
  readonly type: 'gasto' | 'ingreso'
  readonly description?: string
}

export interface UpdateTransactionDTO {
  readonly amount?: number
  readonly category?: string
  readonly type?: 'gasto' | 'ingreso'
  readonly description?: string
}

export interface TransactionFiltersDTO {
  readonly type?: 'gasto' | 'ingreso'
  readonly category?: string
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly amountMin?: number
  readonly amountMax?: number
}

export interface TransactionPeriodDTO {
  readonly year: number
  readonly month: number
  readonly displayName: string
  readonly startDate: string
  readonly endDate: string
}

export class TransactionDTOMapper {
  static transactionToDTO(t: {
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
  }): TransactionDTO {
    if (DEBUG_TRANSACTIONS) {
      console.log('[TransactionDTOMapper] Convirtiendo transacción:', {
        id: t.id,
        amount: t.amount,
        categoryName: t.categoryName,
        direction: t.direction,
      })
    }

    return {
      id: t.id,
      userId: t.userId,
      amount: t.amount,
      categoryId: t.categoryId,
      category: t.categoryName,
      type: t.direction,
      description: t.description,
      createdAt: t.occurredAt,
      formattedAmount: t.formattedAmount,
      formattedDate: t.formattedDate,
    }
  }

  static transactionsToDTOs(transactions: Array<{
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
  }>): TransactionDTO[] {  // 👈 Cambiado de readonly a mutable
    if (DEBUG_TRANSACTIONS) {
      console.log('[TransactionDTOMapper] Convirtiendo', transactions.length, 'transacciones a DTOs')
    }
    return transactions.map(t => this.transactionToDTO(t))
  }

  static categoryExpenseToDTO(
    categoria: string,
    total: number,
    count: number,
    totalExpenses: number
  ): CategoryExpenseDTO {
    const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 10000) / 100 : 0
    return {
      categoria,
      total,
      count,
      percentage,
      formattedTotal: total.toString(),
    }
  }

  static weeklyDataToDTO(weeklyData: {
    week: string
    amount: number
    date: string
  }): WeeklyDataDTO {
    return {
      week: weeklyData.week,
      amount: weeklyData.amount,
      date: weeklyData.date,
      formattedAmount: weeklyData.amount.toString(),
      formattedDate: weeklyData.date,
    }
  }

  static summaryToDTO(
    summary: {
      totalSpent: number
      totalIncome: number
      todayExpenses: number
      weekExpenses: number
      monthExpenses: number
      expensesByCategory: Record<string, number>
    },
    transactionCount: number
  ): TransactionSummaryDTO {
    const balance = summary.totalIncome - summary.totalSpent
    const categoryExpenses = Object.entries(summary.expensesByCategory)
      .map(([categoria, total]) =>
        this.categoryExpenseToDTO(categoria, total, 0, summary.totalSpent)
      )
      .sort((a, b) => b.total - a.total)

    return {
      totalSpent: summary.totalSpent,
      totalIncome: summary.totalIncome,
      balance,
      todayExpenses: summary.todayExpenses,
      weekExpenses: summary.weekExpenses,
      monthExpenses: summary.monthExpenses,
      transactionCount,
      expensesByCategory: categoryExpenses,
      weeklyTrend: [],
      formattedTotalSpent: summary.totalSpent.toString(),
      formattedTotalIncome: summary.totalIncome.toString(),
      formattedBalance: balance.toString(),
    }
  }

  static statsToDTO(stats: {
    totalTransactions: number
    totalSpent: number
    totalIncome: number
    averageTransaction: number
    mostUsedCategory: string | null
    thisWeekSpent: number
    lastWeekSpent: number
  }): TransactionStatsDTO {
    const weeklyGrowth = stats.lastWeekSpent > 0
      ? Math.round(((stats.thisWeekSpent - stats.lastWeekSpent) / stats.lastWeekSpent) * 10000) / 100
      : 0
    return {
      totalTransactions: stats.totalTransactions,
      totalSpent: stats.totalSpent,
      totalIncome: stats.totalIncome,
      averageTransaction: stats.averageTransaction,
      mostUsedCategory: stats.mostUsedCategory,
      thisWeekSpent: stats.thisWeekSpent,
      lastWeekSpent: stats.lastWeekSpent,
      weeklyGrowth,
      formattedAverageTransaction: stats.averageTransaction.toString(),
      formattedThisWeekSpent: stats.thisWeekSpent.toString(),
      formattedLastWeekSpent: stats.lastWeekSpent.toString(),
    }
  }

  static periodToDTO(year: number, month: number): TransactionPeriodDTO {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    return {
      year,
      month,
      displayName: `${monthNames[month - 1]} ${year}`,
      startDate,
      endDate,
    }
  }
}