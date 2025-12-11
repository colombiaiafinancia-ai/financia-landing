/**
 * Lógica de Dominio - Budgets
 * 
 * RESPONSABILIDAD: Lógica de negocio pura, sin dependencias externas
 * - Cálculos de fechas
 * - Validaciones de datos
 * - Reglas de negocio
 * - Transformaciones de datos
 * 
 * NO DEBE CONTENER:
 * ❌ Acceso a Supabase
 * ❌ Acceso a localStorage
 * ❌ Lógica de UI
 * ❌ Efectos secundarios
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

/**
 * Tipos de dominio para budgets
 */
export interface BudgetPeriod {
  year: number
  month: number
  monthDate: string // Formato: YYYY-MM-01
}

export interface BudgetValidation {
  isValid: boolean
  errors: string[]
}

export interface BudgetCalculation {
  amount: number
  percentage: number
  remaining: number
  isOverBudget: boolean
}

/**
 * Obtener período actual (año y mes)
 * 
 * Lógica pura para calcular el período actual basado en la fecha.
 * 
 * @param date - Fecha base (opcional, por defecto fecha actual)
 * @returns Período con año, mes y fecha formateada
 */
export function getCurrentPeriod(date: Date = new Date()): BudgetPeriod {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const monthDate = `${year}-${month.toString().padStart(2, '0')}-01`
  
  return {
    year,
    month,
    monthDate
  }
}

/**
 * Obtener período específico
 * 
 * @param year - Año
 * @param month - Mes (1-12)
 * @returns Período formateado
 */
export function getPeriod(year: number, month: number): BudgetPeriod {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }
  
  const monthDate = `${year}-${month.toString().padStart(2, '0')}-01`
  
  return {
    year,
    month,
    monthDate
  }
}

/**
 * Validar monto de presupuesto
 * 
 * Reglas de negocio para validar montos de presupuesto.
 * 
 * @param amount - Monto a validar
 * @returns Resultado de validación
 */
export function validateBudgetAmount(amount: number): BudgetValidation {
  const errors: string[] = []
  
  if (typeof amount !== 'number') {
    errors.push('El monto debe ser un número')
  }
  
  if (isNaN(amount)) {
    errors.push('El monto no puede ser NaN')
  }
  
  if (amount < 0) {
    errors.push('El monto no puede ser negativo')
  }
  
  if (amount > 999999999) {
    errors.push('El monto no puede exceder 999,999,999')
  }
  
  // Validar decimales (máximo 2)
  if (amount % 1 !== 0) {
    const decimals = amount.toString().split('.')[1]
    if (decimals && decimals.length > 2) {
      errors.push('El monto no puede tener más de 2 decimales')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validar categoría de presupuesto
 * 
 * @param categoria - Categoría a validar
 * @returns Resultado de validación
 */
export function validateBudgetCategory(categoria: string): BudgetValidation {
  const errors: string[] = []
  
  if (!categoria || categoria.trim().length === 0) {
    errors.push('La categoría es requerida')
  }
  
  if (categoria.length > 100) {
    errors.push('La categoría no puede exceder 100 caracteres')
  }
  
  // Validar caracteres especiales
  const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/
  if (!validPattern.test(categoria)) {
    errors.push('La categoría contiene caracteres no válidos')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcular progreso de presupuesto
 * 
 * Lógica para calcular el progreso de un presupuesto vs gastos actuales.
 * 
 * @param budgetAmount - Monto presupuestado
 * @param spentAmount - Monto gastado
 * @returns Cálculos de progreso
 */
export function calculateBudgetProgress(
  budgetAmount: number, 
  spentAmount: number
): BudgetCalculation {
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
  const remaining = budgetAmount - spentAmount
  const isOverBudget = spentAmount > budgetAmount
  
  return {
    amount: spentAmount,
    percentage: Math.round(percentage * 100) / 100, // Redondear a 2 decimales
    remaining,
    isOverBudget
  }
}

/**
 * Formatear monto para display
 * 
 * Lógica pura para formatear montos según reglas de negocio.
 * 
 * @param amount - Monto a formatear
 * @param currency - Moneda (por defecto COP)
 * @returns Monto formateado
 */
export function formatBudgetAmount(amount: number, currency: string = 'COP'): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  } catch (error) {
    // Fallback si hay error con Intl
    return `$${amount.toLocaleString('es-CO')}`
  }
}

/**
 * Calcular rango de fechas para un período
 * 
 * @param period - Período base
 * @returns Fechas de inicio y fin del período
 */
export function getPeriodDateRange(period: BudgetPeriod): {
  startDate: string
  endDate: string
} {
  const { year, month } = period
  
  // Primer día del mes
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  
  // Último día del mes
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const lastDay = new Date(nextYear, nextMonth - 1, 0).getDate()
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
  
  return { startDate, endDate }
}

/**
 * Comparar períodos
 * 
 * @param period1 - Primer período
 * @param period2 - Segundo período
 * @returns -1 si period1 < period2, 0 si iguales, 1 si period1 > period2
 */
export function comparePeriods(period1: BudgetPeriod, period2: BudgetPeriod): number {
  if (period1.year !== period2.year) {
    return period1.year - period2.year
  }
  return period1.month - period2.month
}

/**
 * Verificar si un período es el actual
 * 
 * @param period - Período a verificar
 * @returns true si es el período actual
 */
export function isCurrentPeriod(period: BudgetPeriod): boolean {
  const current = getCurrentPeriod()
  return period.year === current.year && period.month === current.month
}
