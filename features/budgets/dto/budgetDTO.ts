/**
 * DTOs para Budgets Feature
 * 
 * Define los contratos de datos que la UI debe usar.
 * La UI NUNCA debe acceder a entidades de Supabase directamente.
 */

/**
 * DTO principal para presupuestos generales
 */
export interface BudgetDTO {
  readonly id?: string
  readonly userId: string
  readonly monthlyAmount: number
  readonly month: number
  readonly year: number
  readonly createdAt?: string
  readonly updatedAt?: string
}

/**
 * DTO para presupuestos por categoría
 */
export interface CategoryBudgetDTO {
  readonly id?: string
  readonly userId: string
  readonly month: string
  readonly category: string
  readonly amount: number
  readonly createdAt?: string
  readonly updatedAt?: string
}

/**
 * DTO para resumen de presupuesto por categoría
 */
export interface CategoryBudgetSummaryDTO {
  readonly categoria: string
  readonly presupuestado: number
  readonly actual: number
  readonly excedente: number
  readonly porcentajeUsado: number
  readonly estado: 'safe' | 'warning' | 'danger'
}

/**
 * DTO para estadísticas generales de presupuesto
 */
export interface BudgetStatsDTO {
  readonly totalPresupuestado: number
  readonly totalGastado: number
  readonly totalExcedente: number
  readonly categoriasConPresupuesto: number
  readonly categoriasSobrepasadas: number
  readonly categoriasBajoPresupuesto: number
  readonly porcentajeEjecucion: number
}

/**
 * DTO para período de presupuesto
 */
export interface BudgetPeriodDTO {
  readonly year: number
  readonly month: number
  readonly monthDate: string
  readonly displayName: string // "Enero 2025"
}

/**
 * DTO para resumen completo de presupuesto
 */
export interface BudgetSummaryDTO {
  readonly period: BudgetPeriodDTO
  readonly totalBudget: number
  readonly spent: number
  readonly remaining: number
  readonly percentage: number
  readonly status: 'safe' | 'warning' | 'danger'
  readonly isCurrentPeriod: boolean
  readonly categoryBreakdown: readonly CategoryBudgetSummaryDTO[]
}

/**
 * DTO para creación de presupuesto
 */
export interface CreateBudgetDTO {
  readonly monthlyAmount: number
}

/**
 * DTO para creación de presupuesto por categoría
 */
export interface CreateCategoryBudgetDTO {
  readonly category: string
  readonly amount: number
}

/**
 * DTO para actualización de presupuesto
 */
export interface UpdateBudgetDTO {
  readonly monthlyAmount?: number
}

/**
 * DTO para datos legacy de presupuesto (compatibilidad)
 */
export interface LegacyBudgetDataDTO {
  readonly totalBudget: number
  readonly spent: number
  readonly month: string
}

/**
 * Mappers para convertir entre domain models y DTOs
 */
export class BudgetDTOMapper {
  /**
   * Convierte presupuesto general a DTO
   */
  static budgetToDTO(budget: {
    id?: string
    userId: string
    monthlyAmount: number
    month: number
    year: number
    createdAt?: string
    updatedAt?: string
  }): BudgetDTO {
    return {
      id: budget.id,
      userId: budget.userId,
      monthlyAmount: budget.monthlyAmount,
      month: budget.month,
      year: budget.year,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt
    }
  }
  
  /**
   * Convierte presupuesto por categoría a DTO
   */
  static categoryBudgetToDTO(budget: {
    id?: string
    userId: string
    month: string
    category: string
    amount: number
    createdAt?: string
    updatedAt?: string
  }): CategoryBudgetDTO {
    return {
      id: budget.id,
      userId: budget.userId,
      month: budget.month,
      category: budget.category,
      amount: budget.amount,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt
    }
  }
  
  /**
   * Convierte resumen de categoría a DTO
   */
  static categoryBudgetSummaryToDTO(summary: {
    categoria: string
    presupuestado: number
    actual: number
    excedente: number
    porcentajeUsado: number
  }): CategoryBudgetSummaryDTO {
    const percentage = Math.round(summary.porcentajeUsado * 100) / 100
    
    let estado: 'safe' | 'warning' | 'danger' = 'safe'
    if (percentage >= 100) estado = 'danger'
    else if (percentage >= 80) estado = 'warning'
    
    return {
      categoria: summary.categoria,
      presupuestado: summary.presupuestado,
      actual: summary.actual,
      excedente: summary.excedente,
      porcentajeUsado: percentage,
      estado
    }
  }
  
  /**
   * Convierte estadísticas a DTO
   */
  static statsToDTO(stats: {
    totalPresupuestado: number
    totalGastado: number
    totalExcedente: number
    categoriasConPresupuesto: number
    categoriasSobrepasadas: number
    categoriasBajoPresupuesto: number
  }): BudgetStatsDTO {
    const porcentajeEjecucion = stats.totalPresupuestado > 0 
      ? Math.round((stats.totalGastado / stats.totalPresupuestado) * 10000) / 100
      : 0
    
    return {
      totalPresupuestado: stats.totalPresupuestado,
      totalGastado: stats.totalGastado,
      totalExcedente: stats.totalExcedente,
      categoriasConPresupuesto: stats.categoriasConPresupuesto,
      categoriasSobrepasadas: stats.categoriasSobrepasadas,
      categoriasBajoPresupuesto: stats.categoriasBajoPresupuesto,
      porcentajeEjecucion
    }
  }
  
  /**
   * Convierte período a DTO
   */
  static periodToDTO(period: {
    year: number
    month: number
    monthDate: string
  }): BudgetPeriodDTO {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    
    return {
      year: period.year,
      month: period.month,
      monthDate: period.monthDate,
      displayName: `${monthNames[period.month - 1]} ${period.year}`
    }
  }
  
  /**
   * Convierte resumen completo a DTO
   */
  static summaryToDTO(
    period: { year: number; month: number; monthDate: string },
    totalBudget: number,
    spent: number,
    categoryBreakdown: Array<{
      categoria: string
      presupuestado: number
      actual: number
      excedente: number
      porcentajeUsado: number
    }>
  ): BudgetSummaryDTO {
    const remaining = Math.max(0, totalBudget - spent)
    const percentage = totalBudget > 0 ? Math.round((spent / totalBudget) * 10000) / 100 : 0
    
    let status: 'safe' | 'warning' | 'danger' = 'safe'
    if (percentage >= 100) status = 'danger'
    else if (percentage >= 80) status = 'warning'
    
    const now = new Date()
    const isCurrentPeriod = period.year === now.getFullYear() && period.month === (now.getMonth() + 1)
    
    return {
      period: this.periodToDTO(period),
      totalBudget,
      spent,
      remaining,
      percentage,
      status,
      isCurrentPeriod,
      categoryBreakdown: categoryBreakdown.map(this.categoryBudgetSummaryToDTO)
    }
  }
}
