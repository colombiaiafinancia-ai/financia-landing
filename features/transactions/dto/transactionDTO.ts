/**
 * DTOs para Transactions Feature
 * 
 * Define los contratos de datos que la UI debe usar.
 * La UI NUNCA debe acceder a entidades de Supabase directamente.
 */

/**
 * DTO principal para transacciones
 */
export interface TransactionDTO {
  readonly id: string
  readonly userId: string
  readonly amount: number
  readonly category: string | null
  readonly type: 'gasto' | 'ingreso' | null
  readonly description: string | null
  readonly createdAt: string | null
  readonly formattedAmount: string
  readonly formattedDate: string
}

/**
 * DTO para resumen de transacciones
 */
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

/**
 * DTO para gastos por categoría
 */
export interface CategoryExpenseDTO {
  readonly categoria: string
  readonly total: number
  readonly count: number
  readonly percentage: number
  readonly formattedTotal: string
}

/**
 * DTO para datos semanales
 */
export interface WeeklyDataDTO {
  readonly week: string
  readonly amount: number
  readonly date: string
  readonly formattedAmount: string
  readonly formattedDate: string
}

/**
 * DTO para estadísticas de transacciones
 */
export interface TransactionStatsDTO {
  readonly totalTransactions: number
  readonly totalSpent: number
  readonly totalIncome: number
  readonly averageTransaction: number
  readonly mostUsedCategory: string | null
  readonly thisWeekSpent: number
  readonly lastWeekSpent: number
  readonly weeklyGrowth: number // Porcentaje de crecimiento semanal
  readonly formattedAverageTransaction: string
  readonly formattedThisWeekSpent: string
  readonly formattedLastWeekSpent: string
}

/**
 * DTO para creación de transacciones
 */
export interface CreateTransactionDTO {
  readonly amount: number
  readonly category: string
  readonly type: 'gasto' | 'ingreso'
  readonly description?: string
}

/**
 * DTO para actualización de transacciones
 */
export interface UpdateTransactionDTO {
  readonly amount?: number
  readonly category?: string
  readonly type?: 'gasto' | 'ingreso'
  readonly description?: string
}

/**
 * DTO para filtros de transacciones
 */
export interface TransactionFiltersDTO {
  readonly type?: 'gasto' | 'ingreso'
  readonly category?: string
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly amountMin?: number
  readonly amountMax?: number
}

/**
 * DTO para período de transacciones
 */
export interface TransactionPeriodDTO {
  readonly year: number
  readonly month: number
  readonly displayName: string // "Enero 2025"
  readonly startDate: string
  readonly endDate: string
}

/**
 * Mappers para convertir entre domain models y DTOs
 */
export class TransactionDTOMapper {
  /**
   * Formatea un monto como moneda colombiana
   */
  private static formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  /**
   * Formatea una fecha
   */
  private static formatDate(dateString: string | null): string {
    if (!dateString) return 'Sin fecha'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Fecha inválida'
    }
  }
  
  /**
   * Convierte transacción a DTO
   */
  static transactionToDTO(transaction: {
    id: string
    usuario_id: string
    valor: number
    categoria: string | null
    tipo: 'gasto' | 'ingreso' | null
    descripcion: string | null
    creado_en: string | null
  }): TransactionDTO {
    return {
      id: transaction.id,
      userId: transaction.usuario_id,
      amount: transaction.valor,
      category: transaction.categoria,
      type: transaction.tipo,
      description: transaction.descripcion,
      createdAt: transaction.creado_en,
      formattedAmount: this.formatAmount(transaction.valor),
      formattedDate: this.formatDate(transaction.creado_en)
    }
  }
  
  /**
   * Convierte múltiples transacciones a DTOs
   */
  static transactionsToDTOs(transactions: Array<{
    id: string
    usuario_id: string
    valor: number
    categoria: string | null
    tipo: 'gasto' | 'ingreso' | null
    descripcion: string | null
    creado_en: string | null
  }>): readonly TransactionDTO[] {
    return transactions.map(this.transactionToDTO)
  }
  
  /**
   * Convierte gastos por categoría a DTO
   */
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
      formattedTotal: this.formatAmount(total)
    }
  }
  
  /**
   * Convierte datos semanales a DTO
   */
  static weeklyDataToDTO(weeklyData: {
    week: string
    amount: number
    date: string
  }): WeeklyDataDTO {
    return {
      week: weeklyData.week,
      amount: weeklyData.amount,
      date: weeklyData.date,
      formattedAmount: this.formatAmount(weeklyData.amount),
      formattedDate: weeklyData.date
    }
  }
  
  /**
   * Convierte resumen de transacciones a DTO
   */
  static summaryToDTO(summary: {
    totalSpent: number
    totalIncome: number
    todayExpenses: number
    weekExpenses: number
    monthExpenses: number
    expensesByCategory: Record<string, number>
  }, transactionCount: number): TransactionSummaryDTO {
    const balance = summary.totalIncome - summary.totalSpent
    
    // Convertir gastos por categoría a DTOs
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
      weeklyTrend: [], // Se llena por separado
      formattedTotalSpent: this.formatAmount(summary.totalSpent),
      formattedTotalIncome: this.formatAmount(summary.totalIncome),
      formattedBalance: this.formatAmount(balance)
    }
  }
  
  /**
   * Convierte estadísticas a DTO
   */
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
      formattedAverageTransaction: this.formatAmount(stats.averageTransaction),
      formattedThisWeekSpent: this.formatAmount(stats.thisWeekSpent),
      formattedLastWeekSpent: this.formatAmount(stats.lastWeekSpent)
    }
  }
  
  /**
   * Convierte período a DTO
   */
  static periodToDTO(year: number, month: number): TransactionPeriodDTO {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    return {
      year,
      month,
      displayName: `${monthNames[month - 1]} ${year}`,
      startDate,
      endDate
    }
  }
}
