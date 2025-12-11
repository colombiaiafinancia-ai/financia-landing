/**
 * Lógica de Dominio - Transactions
 * 
 * RESPONSABILIDAD: Lógica de negocio pura para transacciones
 * - Validaciones de datos
 * - Cálculos de períodos
 * - Reglas de negocio
 * - Transformaciones de datos
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

/**
 * Tipos de dominio
 */
export type TransactionType = 'gasto' | 'ingreso'

export type TransactionCategory = 
  | 'Alimentación'
  | 'Vivienda'
  | 'Transporte'
  | 'Educación'
  | 'Entretenimiento y Ocio'
  | 'Deudas'
  | 'Compras personales'
  | 'Salud'
  | 'Otros'
  | 'Salario'
  | 'Bonificaciones'
  | 'Arriendo'
  | 'Extras'
  | 'Regalos'

export interface TransactionValidation {
  isValid: boolean
  errors: string[]
}

export interface CategorySummary {
  categoria: TransactionCategory
  total: number
  porcentaje: number
  color: string
}

export interface WeeklySummary {
  week: number
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface DateRange {
  startDate: string
  endDate: string
}

/**
 * Colores por categoría (regla de negocio)
 */
export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Alimentación': '#ff6b6b',
  'Vivienda': '#45b7d1',
  'Transporte': '#4ecdc4',
  'Educación': '#f9ca24',
  'Entretenimiento y Ocio': '#6c5ce7',
  'Deudas': '#e74c3c',
  'Compras personales': '#f39c12',
  'Salud': '#a29bfe',
  'Otros': '#a0a0a0',
  'Salario': '#27ae60',
  'Bonificaciones': '#2ecc71',
  'Arriendo': '#3498db',
  'Extras': '#9b59b6',
  'Regalos': '#e67e22'
}

/**
 * Validar monto de transacción
 */
export function validateTransactionAmount(amount: number): TransactionValidation {
  const errors: string[] = []
  
  if (typeof amount !== 'number') {
    errors.push('El monto debe ser un número')
  }
  
  if (isNaN(amount)) {
    errors.push('El monto no puede ser NaN')
  }
  
  if (amount === 0) {
    errors.push('El monto no puede ser cero')
  }
  
  if (Math.abs(amount) > 999999999) {
    errors.push('El monto no puede exceder 999,999,999')
  }
  
  // Validar decimales (máximo 2)
  if (amount % 1 !== 0) {
    const decimals = Math.abs(amount).toString().split('.')[1]
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
 * Validar categoría de transacción
 */
export function validateTransactionCategory(categoria: string): TransactionValidation {
  const errors: string[] = []
  
  if (!categoria || categoria.trim().length === 0) {
    errors.push('La categoría es requerida')
  }
  
  const validCategories = Object.keys(CATEGORY_COLORS)
  if (!validCategories.includes(categoria)) {
    errors.push(`La categoría debe ser una de: ${validCategories.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validar tipo de transacción
 */
export function validateTransactionType(tipo: string): TransactionValidation {
  const errors: string[] = []
  
  if (!tipo || tipo.trim().length === 0) {
    errors.push('El tipo es requerido')
  }
  
  if (tipo !== 'gasto' && tipo !== 'ingreso') {
    errors.push('El tipo debe ser "gasto" o "ingreso"')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validar descripción de transacción
 */
export function validateTransactionDescription(descripcion?: string): TransactionValidation {
  const errors: string[] = []
  
  if (descripcion && descripcion.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Obtener rango de fechas para el mes actual
 */
export function getCurrentMonthRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
  
  return { startDate, endDate }
}

/**
 * Obtener rango de fechas para un mes específico
 */
export function getMonthRange(year: number, month: number): DateRange {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }
  
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
  
  return { startDate, endDate }
}

/**
 * Obtener rango de fechas para las últimas N semanas
 */
export function getWeeksRange(weeksCount: number = 4, fromDate: Date = new Date()): DateRange {
  const endDate = new Date(fromDate)
  const startDate = new Date(fromDate.getTime() - (weeksCount * 7 * 24 * 60 * 60 * 1000))
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

/**
 * Calcular resumen por categorías
 */
export function calculateCategorySummary<T extends { categoria: string; monto: number }>(
  transactions: T[]
): CategorySummary[] {
  // Agrupar por categoría
  const categoryTotals: Record<string, number> = {}
  let totalSpent = 0

  transactions.forEach(transaction => {
    const categoria = transaction.categoria as TransactionCategory
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + Math.abs(transaction.monto)
    totalSpent += Math.abs(transaction.monto)
  })

  // Convertir a formato CategorySummary
  const summary: CategorySummary[] = Object.entries(categoryTotals)
    .map(([categoria, total]) => ({
      categoria: categoria as TransactionCategory,
      total,
      porcentaje: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      color: CATEGORY_COLORS[categoria as TransactionCategory] || CATEGORY_COLORS['Otros']
    }))
    .sort((a, b) => b.total - a.total)

  return summary
}

/**
 * Calcular resumen semanal
 */
export function calculateWeeklySummary<T extends { fecha: string; monto: number }>(
  transactions: T[],
  weeksCount: number = 4,
  fromDate: Date = new Date()
): WeeklySummary[] {
  const weeklyTotals: WeeklySummary[] = []
  
  for (let i = 0; i < weeksCount; i++) {
    const weekStart = new Date(fromDate.getTime() - ((weeksCount - 1 - i) * 7 * 24 * 60 * 60 * 1000))
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
    
    weekStart.setHours(0, 0, 0, 0)
    weekEnd.setHours(23, 59, 59, 999)

    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.fecha)
      return transactionDate >= weekStart && transactionDate <= weekEnd
    })

    const total = weekTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0)

    weeklyTotals.push({
      week: i + 1,
      total,
      fecha_inicio: weekStart.toISOString().split('T')[0],
      fecha_fin: weekEnd.toISOString().split('T')[0]
    })
  }

  return weeklyTotals
}

/**
 * Formatear monto para display
 */
export function formatTransactionAmount(amount: number, currency: string = 'COP'): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount))
  } catch (error) {
    // Fallback si hay error con Intl
    return `$${Math.abs(amount).toLocaleString('es-CO')}`
  }
}

/**
 * Obtener color de categoría
 */
export function getCategoryColor(categoria: string): string {
  return CATEGORY_COLORS[categoria as TransactionCategory] || CATEGORY_COLORS['Otros']
}

/**
 * Verificar si una transacción es gasto
 */
export function isExpense(tipo: string): boolean {
  return tipo === 'gasto'
}

/**
 * Verificar si una transacción es ingreso
 */
export function isIncome(tipo: string): boolean {
  return tipo === 'ingreso'
}

/**
 * Normalizar monto según tipo de transacción
 * Los gastos deben ser negativos, los ingresos positivos
 */
export function normalizeTransactionAmount(amount: number, tipo: TransactionType): number {
  const absAmount = Math.abs(amount)
  return tipo === 'gasto' ? -absAmount : absAmount
}
