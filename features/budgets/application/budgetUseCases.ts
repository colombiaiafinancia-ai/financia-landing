/**
 * Casos de Uso de Budgets - Capa de Aplicación
 *
 * RESPONSABILIDAD: Orquestar flujos de negocio
 * - Coordinar dominio + infraestructura
 * - Validar usando reglas de dominio
 * - Transformar datos entre capas
 * - Manejar errores de aplicación
 *
 * NO DEBE CONTENER:
 * ❌ Acceso directo a Supabase
 * ❌ Lógica de UI
 * ❌ Efectos secundarios de UI
 *
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 2 - Migración de Hooks Legacy
 */

import {
  getCurrentPeriod,
  getPeriod,
  validateBudgetAmount,
  validateBudgetCategory,
  validateCategoryBudgetData,
  calculateBudgetProgress,
  calculateCategoryBudgetSummary,
  calculateBudgetStats,
  formatBudgetAmount,
  getPeriodDateRange,
  getMonthDateRange,
  isCurrentPeriod,
  type BudgetPeriod,
  type BudgetValidation,
  type BudgetCalculation,
  type CategoryBudget as DomainCategoryBudget,
  type CategoryBudgetSummary,
  type BudgetStats
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
  monthlyAmount: number
  month: number
  year: number
  createdAt?: string
  updatedAt?: string
}

export interface CategoryBudget {
  id?: string
  userId: string
  month: string
  category: string
  amount: number
  createdAt?: string
  updatedAt?: string
}

export interface BudgetSummary {
  period: BudgetPeriod
  totalBudget: number
  spent: number
  remaining: number
  progress: BudgetCalculation
  isCurrentPeriod: boolean
}

export interface LegacyBudgetData {
  totalBudget: number
  spent: number
  month: string
}

/**
 * Casos de uso para presupuestos generales
 */
export class BudgetUseCases {
  /**
   * Mapear entidad de BD a modelo de dominio
   */
  private mapEntityToDomain(entity: BudgetEntity): Budget {
    return {
      id: entity.id,
      userId: entity.user_id,
      monthlyAmount: entity.monto_mensual,
      month: entity.mes,
      year: entity.año,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }

  /**
   * Mapear modelo de dominio a entidad de BD
   */
  private mapDomainToEntity(budget: Budget): Omit<BudgetEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: budget.userId,
      monto_mensual: budget.monthlyAmount,
      mes: budget.month,
      año: budget.year
    }
  }

  /**
   * Obtener presupuesto actual del usuario
   */
  async getCurrentBudget(userId: string): Promise<Budget | null> {
    const period = getCurrentPeriod()

    const entity = await budgetRepository.findByUserAndPeriod(userId, period.year, period.month)

    return entity ? this.mapEntityToDomain(entity) : null
  }

  /**
   * Obtener presupuesto de un período específico
   */
  async getBudgetByPeriod(userId: string, year: number, month: number): Promise<Budget | null> {
    // Validar período usando lógica de dominio
    const period = getPeriod(year, month)

    const entity = await budgetRepository.findByUserAndPeriod(userId, period.year, period.month)

    return entity ? this.mapEntityToDomain(entity) : null
  }

  /**
   * Guardar presupuesto para el período actual
   */
  async saveBudget(userId: string, monthlyAmount: number): Promise<Budget> {
    // Validar usando lógica de dominio
    const validation = validateBudgetAmount(monthlyAmount)
    if (!validation.isValid) {
      throw new Error(`Monto inválido: ${validation.errors.join(', ')}`)
    }

    const period = getCurrentPeriod()

    // Verificar si ya existe
    const existing = await budgetRepository.findByUserAndPeriod(userId, period.year, period.month)

    let entity: BudgetEntity

    if (existing) {
      // Actualizar existente
      entity = await budgetRepository.update(userId, period.year, period.month, { monto_mensual: monthlyAmount })
    } else {
      // Crear nuevo
      entity = await budgetRepository.create({
        user_id: userId,
        monto_mensual: monthlyAmount,
        mes: period.month,
        año: period.year
      })
    }

    return this.mapEntityToDomain(entity)
  }

  /**
   * Eliminar presupuesto del período actual
   */
  async deleteBudget(userId: string): Promise<void> {
    const period = getCurrentPeriod()
    await budgetRepository.delete(userId, period.year, period.month)
  }

  /**
   * Obtener todos los presupuestos de un usuario
   */
  async getAllBudgets(userId: string): Promise<Budget[]> {
    const entities = await budgetRepository.findAllByUser(userId)
    return entities.map(entity => this.mapEntityToDomain(entity))
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    return budgetRepository.subscribeToChanges(userId, callback)
  }
}

/**
 * Casos de uso para presupuestos por categoría
 */
export class CategoryBudgetUseCases {
  /**
   * Mapear entidad de BD a modelo de dominio
   */
  private mapEntityToDomain(entity: CategoryBudgetEntity): CategoryBudget {
    return {
      id: entity.id,
      userId: entity.usuario_id,
      month: entity.mes,
      category: entity.categorias,
      amount: entity.valor,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }

  /**
   * Suma el valor de una transacción (gasto) al campo gastado del presupuesto
   * de esa categoría en el mes actual, si existe.
   */
  async addSpentFromTransaction(userId: string, categoria: string, amount: number): Promise<void> {
    const dateRange = getMonthDateRange()
    const monthDate = dateRange.monthStartISO // YYYY-MM-01

    await categoryBudgetRepository.addSpentToCategoryBudget(userId, monthDate, categoria, amount)
  }

  /**
   * Obtener presupuestos por categoría del período actual
   */
  async getCurrentCategoryBudgets(userId: string): Promise<CategoryBudget[]> {
    const period = getCurrentPeriod()

    const entities = await categoryBudgetRepository.findByUserAndPeriod(userId, period.monthDate)

    return entities.map(entity => this.mapEntityToDomain(entity))
  }

  /**
   * Obtener presupuestos por rango de fechas (para compatibilidad con hooks legacy)
   */
  async getCategoryBudgetsByDateRange(userId: string, startDate: string, endDate: string): Promise<CategoryBudget[]> {
    const entities = await categoryBudgetRepository.findByUserAndDateRange(userId, startDate, endDate)
    return entities.map(entity => this.mapEntityToDomain(entity))
  }

  /**
   * Obtener resumen de presupuesto por categoría (para useCategoryBudget)
   *
   * ✅ CAMBIO CLAVE:
   * - "actual" se calcula SIEMPRE desde la columna `gastado` (BD)
   * - Se ignora `expensesByCategory` para evitar inconsistencias
   * - El parámetro se mantiene por compatibilidad con la firma anterior
   */
  async getCategoryBudgetSummary(
    userId: string,
    _expensesByCategory: Record<string, number>
  ): Promise<CategoryBudgetSummary[]> {
    const period = getCurrentPeriod()

    const entities = await categoryBudgetRepository.findByUserAndPeriod(userId, period.monthDate)

    // Convertir a formato de dominio (presupuestado)
    const domainBudgets: DomainCategoryBudget[] = entities.map(entity => ({
      id: entity.id!,
      categorias: entity.categorias,
      valor: entity.valor,
      mes: entity.mes,
      usuario_id: entity.usuario_id
    }))

    // ✅ Construir mapa de "gastos" desde BD usando `gastado`
    const expensesFromDB: Record<string, number> = {}
    for (const e of entities) {
      expensesFromDB[e.categorias] = Number(e.gastado) || 0
    }

    // Usar lógica de dominio para calcular resumen
    return calculateCategoryBudgetSummary(domainBudgets, expensesFromDB)
  }

  /**
   * Obtener estadísticas generales de presupuesto
   */
  async getBudgetStats(userId: string, expensesByCategory: Record<string, number>): Promise<BudgetStats> {
    const summaries = await this.getCategoryBudgetSummary(userId, expensesByCategory)
    return calculateBudgetStats(summaries)
  }

  /**
   * Guardar presupuesto por categoría
   */
  async saveCategoryBudget(userId: string, category: string, amount: number): Promise<CategoryBudget> {
    // Validar usando lógica de dominio
    const validation = validateCategoryBudgetData({
      usuario_id: userId,
      categoria: category,
      valor: amount
    })

    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`)
    }

    const period = getCurrentPeriod()

    const entity = await categoryBudgetRepository.upsertByCategory(userId, period.monthDate, category, amount)

    return this.mapEntityToDomain(entity)
  }

  /**
   * Eliminar presupuesto por categoría
   */
  async deleteCategoryBudget(userId: string, category: string): Promise<void> {
    const period = getCurrentPeriod()
    await categoryBudgetRepository.delete(userId, period.monthDate, category)
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    return categoryBudgetRepository.subscribeToChanges(userId, callback)
  }

  /**
   * MÉTODOS DE COMPATIBILIDAD CON HOOKS LEGACY
   */

  /**
   * Cargar presupuesto desde Supabase (compatibilidad con useBudget.ts)
   */
  async loadBudgetFromSupabase(userId: string): Promise<number> {
    try {
      console.log('💰 BUDGET_USE_CASE - Loading budget for user:', userId)

      const dateRange = getMonthDateRange()

      console.log('💰 BUDGET_USE_CASE - Date range:', {
        monthStartISO: dateRange.monthStartISO,
        monthEndISO: dateRange.monthEndISO
      })

      const entities = await categoryBudgetRepository.findByUserAndDateRange(
        userId,
        dateRange.monthStartISO,
        dateRange.monthEndISO
      )

      console.log('💰 BUDGET_USE_CASE - Found budgets:', entities.length)

      // Sumar todos los presupuestos del mes (por categoría)
      const totalBudget = entities.reduce((sum, budget) => sum + budget.valor, 0)

      console.log('✅ BUDGET_USE_CASE - Total budget calculated:', totalBudget)

      return totalBudget
    } catch (error) {
      console.error('❌ BUDGET_USE_CASE - Error loading budget from Supabase:', error)
      throw error
    }
  }

  /**
   * Guardar presupuesto general (compatibilidad con useBudget.ts)
   */
  async saveBudgetGeneral(userId: string, newBudget: number): Promise<boolean> {
    try {
      console.log('💰 BUDGET_USE_CASE - Saving general budget:', { userId, newBudget })

      // Validar usando lógica de dominio
      const validation = validateBudgetAmount(newBudget)
      if (!validation.isValid) {
        throw new Error(`Monto inválido: ${validation.errors.join(', ')}`)
      }

      const period = getCurrentPeriod()

      console.log('💰 BUDGET_USE_CASE - Current period:', period)

      // Eliminar presupuestos existentes del mes
      await categoryBudgetRepository.deleteAllByUserAndPeriod(userId, period.monthDate)

      console.log('💰 BUDGET_USE_CASE - Deleted existing budgets for period')

      // Crear un presupuesto general para el mes
      const created = await categoryBudgetRepository.createGeneralBudget(userId, period.monthDate, newBudget)

      console.log('✅ BUDGET_USE_CASE - General budget created:', created)

      return true
    } catch (error) {
      console.error('❌ BUDGET_USE_CASE - Error saving general budget:', error)
      throw error
    }
  }
  /**
 * Resta el valor de una transacción eliminada (gasto)
 * del campo gastado del presupuesto de la categoría.
 */
  async subtractSpentFromTransaction(
    userId: string,
    categoria: string,
    amount: number
  ): Promise<void> {
    const dateRange = getMonthDateRange()
    const monthDate = dateRange.monthStartISO // YYYY-MM-01

    await categoryBudgetRepository.subtractSpentFromCategoryBudget(
      userId,
      monthDate,
      categoria,
      amount
    )
  }
}

// Instancias singleton
export const budgetUseCases = new BudgetUseCases()
export const categoryBudgetUseCases = new CategoryBudgetUseCases()