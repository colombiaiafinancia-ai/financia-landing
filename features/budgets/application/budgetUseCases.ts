/**
 * Casos de Uso - Budgets (Capa de Aplicación)
 * 
 * RESPONSABILIDAD: Orquestar flujos de negocio
 * - Coordinar dominio + infraestructura
 * - Casos de uso específicos
 * - Validaciones de entrada
 * - Manejo de errores de aplicación
 * 
 * FLUJO: UI → Application → Domain → Infrastructure
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

import { 
  getCurrentPeriod, 
  getPeriod,
  validateBudgetAmount,
  validateBudgetCategory,
  calculateBudgetProgress,
  formatBudgetAmount,
  getPeriodDateRange,
  type BudgetPeriod 
} from '../domain/budgetLogic'

import { 
  budgetRepository, 
  categoryBudgetRepository,
  type BudgetEntity,
  type CategoryBudgetEntity 
} from '../services/budgetRepository'

/**
 * Tipos de aplicación (DTOs)
 */
export interface Budget {
  id?: string
  userId: string
  amount: number
  year: number
  month: number
  createdAt?: string
  updatedAt?: string
}

export interface CategoryBudget {
  id?: string
  userId: string
  category: string
  amount: number
  monthDate: string
  createdAt?: string
  updatedAt?: string
}

export interface CategoryBudgetSummary {
  categoria: string
  actual: number
  presupuestado: number
  excedente: number
  porcentaje_usado: number
}

/**
 * Errores de aplicación
 */
export class BudgetApplicationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'BudgetApplicationError'
  }
}

/**
 * Casos de uso para presupuestos generales
 */
export class BudgetUseCases {
  /**
   * Obtener presupuesto actual del usuario
   */
  async getCurrentBudget(userId: string): Promise<Budget | null> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const period = getCurrentPeriod()
      const entity = await budgetRepository.findByUserAndPeriod(userId, period.year, period.month)
      
      if (!entity) {
        return null
      }

      return this.mapEntityToDomain(entity)
    } catch (error) {
      if (error instanceof BudgetApplicationError) {
        throw error
      }
      throw new BudgetApplicationError(
        `Failed to get current budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_CURRENT_BUDGET_FAILED'
      )
    }
  }

  /**
   * Obtener presupuesto de un período específico
   */
  async getBudgetByPeriod(userId: string, year: number, month: number): Promise<Budget | null> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      // Validar período usando lógica de dominio
      getPeriod(year, month) // Lanza error si el período es inválido

      const entity = await budgetRepository.findByUserAndPeriod(userId, year, month)
      
      if (!entity) {
        return null
      }

      return this.mapEntityToDomain(entity)
    } catch (error) {
      if (error instanceof BudgetApplicationError) {
        throw error
      }
      throw new BudgetApplicationError(
        `Failed to get budget by period: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_BUDGET_BY_PERIOD_FAILED'
      )
    }
  }

  /**
   * Guardar presupuesto (crear o actualizar)
   */
  async saveBudget(userId: string, amount: number): Promise<Budget> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    // Validar monto usando lógica de dominio
    const validation = validateBudgetAmount(amount)
    if (!validation.isValid) {
      throw new BudgetApplicationError(
        `Invalid budget amount: ${validation.errors.join(', ')}`,
        'INVALID_BUDGET_AMOUNT'
      )
    }

    try {
      const period = getCurrentPeriod()
      
      // Verificar si ya existe
      const existing = await budgetRepository.findByUserAndPeriod(userId, period.year, period.month)
      
      let entity: BudgetEntity

      if (existing) {
        // Actualizar existente
        entity = await budgetRepository.update(userId, period.year, period.month, {
          monto_mensual: amount
        })
      } else {
        // Crear nuevo
        entity = await budgetRepository.create({
          user_id: userId,
          monto_mensual: amount,
          mes: period.month,
          año: period.year
        })
      }

      return this.mapEntityToDomain(entity)
    } catch (error) {
      if (error instanceof BudgetApplicationError) {
        throw error
      }
      throw new BudgetApplicationError(
        `Failed to save budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SAVE_BUDGET_FAILED'
      )
    }
  }

  /**
   * Obtener todos los presupuestos del usuario
   */
  async getAllBudgets(userId: string): Promise<Budget[]> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const entities = await budgetRepository.findAllByUser(userId)
      return entities.map(entity => this.mapEntityToDomain(entity))
    } catch (error) {
      throw new BudgetApplicationError(
        `Failed to get all budgets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ALL_BUDGETS_FAILED'
      )
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: (budget: Budget | null) => void) {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    return budgetRepository.subscribeToChanges(userId, async () => {
      try {
        const budget = await this.getCurrentBudget(userId)
        callback(budget)
      } catch (error) {
        console.error('Error in budget subscription callback:', error)
        callback(null)
      }
    })
  }

  /**
   * Mapear entidad de BD a dominio
   */
  private mapEntityToDomain(entity: BudgetEntity): Budget {
    return {
      id: entity.id,
      userId: entity.user_id,
      amount: entity.monto_mensual,
      year: entity.año,
      month: entity.mes,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }
}

/**
 * Casos de uso para presupuestos por categoría
 */
export class CategoryBudgetUseCases {
  /**
   * Obtener resumen de presupuesto vs gastos por categoría
   * 
   * NOTA: Este caso de uso necesita acceso a transacciones.
   * En una implementación completa, se inyectaría el repositorio de transacciones.
   * Por ahora, mantenemos la funcionalidad existente.
   */
  async getCategoryBudgetSummary(
    userId: string, 
    getExpensesByCategory: (userId: string, monthDate: string) => Promise<Record<string, number>>
  ): Promise<CategoryBudgetSummary[]> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    try {
      const period = getCurrentPeriod()
      
      // Obtener presupuestos por categoría
      const budgetEntities = await categoryBudgetRepository.findByUserAndPeriod(userId, period.monthDate)
      
      // Obtener gastos por categoría (inyectado desde fuera)
      const expensesByCategory = await getExpensesByCategory(userId, period.monthDate)
      
      // Crear mapa de presupuestos
      const budgetsByCategory: Record<string, number> = {}
      budgetEntities.forEach(budget => {
        budgetsByCategory[budget.categorias] = budget.valor
      })
      
      // Crear resumen combinando presupuestos y gastos
      const summary: CategoryBudgetSummary[] = []
      
      // Agregar categorías con presupuesto definido
      Object.entries(budgetsByCategory).forEach(([categoria, presupuestado]) => {
        const actual = expensesByCategory[categoria] || 0
        const progress = calculateBudgetProgress(presupuestado, actual)
        
        summary.push({
          categoria,
          actual,
          presupuestado,
          excedente: progress.remaining,
          porcentaje_usado: progress.percentage
        })
      })
      
      // Agregar categorías con gastos pero sin presupuesto definido
      Object.entries(expensesByCategory).forEach(([categoria, actual]) => {
        const existsInBudgets = budgetsByCategory.hasOwnProperty(categoria)
        if (!existsInBudgets && actual > 0) {
          summary.push({
            categoria,
            actual,
            presupuestado: 0,
            excedente: -actual,
            porcentaje_usado: 0
          })
        }
      })
      
      // Ordenar por mayor gasto
      return summary.sort((a, b) => b.actual - a.actual)
    } catch (error) {
      if (error instanceof BudgetApplicationError) {
        throw error
      }
      throw new BudgetApplicationError(
        `Failed to get category budget summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_CATEGORY_SUMMARY_FAILED'
      )
    }
  }

  /**
   * Guardar presupuesto de una categoría
   */
  async saveCategoryBudget(userId: string, categoria: string, amount: number): Promise<CategoryBudget> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    // Validar usando lógica de dominio
    const amountValidation = validateBudgetAmount(amount)
    if (!amountValidation.isValid) {
      throw new BudgetApplicationError(
        `Invalid budget amount: ${amountValidation.errors.join(', ')}`,
        'INVALID_BUDGET_AMOUNT'
      )
    }

    const categoryValidation = validateBudgetCategory(categoria)
    if (!categoryValidation.isValid) {
      throw new BudgetApplicationError(
        `Invalid category: ${categoryValidation.errors.join(', ')}`,
        'INVALID_CATEGORY'
      )
    }

    try {
      const period = getCurrentPeriod()
      
      // Verificar si ya existe
      const existing = await categoryBudgetRepository.findByUserPeriodAndCategory(
        userId, 
        period.monthDate, 
        categoria
      )
      
      let entity: CategoryBudgetEntity

      if (existing) {
        // Actualizar existente
        entity = await categoryBudgetRepository.update(existing.id!, { valor: amount })
      } else {
        // Crear nuevo
        entity = await categoryBudgetRepository.create({
          usuario_id: userId,
          mes: period.monthDate,
          valor: amount,
          categorias: categoria
        })
      }

      return this.mapEntityToDomain(entity)
    } catch (error) {
      if (error instanceof BudgetApplicationError) {
        throw error
      }
      throw new BudgetApplicationError(
        `Failed to save category budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SAVE_CATEGORY_BUDGET_FAILED'
      )
    }
  }

  /**
   * Eliminar presupuesto de una categoría
   */
  async deleteCategoryBudget(userId: string, categoria: string): Promise<void> {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    const categoryValidation = validateBudgetCategory(categoria)
    if (!categoryValidation.isValid) {
      throw new BudgetApplicationError(
        `Invalid category: ${categoryValidation.errors.join(', ')}`,
        'INVALID_CATEGORY'
      )
    }

    try {
      const period = getCurrentPeriod()
      await categoryBudgetRepository.delete(userId, period.monthDate, categoria)
    } catch (error) {
      throw new BudgetApplicationError(
        `Failed to delete category budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_CATEGORY_BUDGET_FAILED'
      )
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    if (!userId) {
      throw new BudgetApplicationError('User ID is required', 'INVALID_USER_ID')
    }

    return categoryBudgetRepository.subscribeToChanges(userId, callback)
  }

  /**
   * Mapear entidad de BD a dominio
   */
  private mapEntityToDomain(entity: CategoryBudgetEntity): CategoryBudget {
    return {
      id: entity.id,
      userId: entity.usuario_id,
      category: entity.categorias,
      amount: entity.valor,
      monthDate: entity.mes,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }
}

// Instancias singleton para reutilización
export const budgetUseCases = new BudgetUseCases()
export const categoryBudgetUseCases = new CategoryBudgetUseCases()
