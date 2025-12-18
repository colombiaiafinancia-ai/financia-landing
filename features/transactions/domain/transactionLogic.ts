/**
 * DOMAIN LAYER - Transaction Logic
 * 
 * Contiene lógica de negocio pura relacionada con transacciones.
 * No conoce Supabase ni infraestructura.
 */

export interface Transaction {
  id: string
  usuario_id: string
  valor: number
  categoria: string | null
  tipo: 'gasto' | 'ingreso' | null
  descripcion: string | null
  creado_en: string | null
}

export interface TransactionSummary {
  totalSpent: number
  totalIncome: number
  todayExpenses: number
  weekExpenses: number
  monthExpenses: number
  expensesByCategory: Record<string, number>
}

export interface WeeklyData {
  week: string
  amount: number
  date: string
}

export interface CategorySummary {
  categoria: string
  total: number
  count: number
  percentage: number
}

export interface TransactionValidation {
  isValid: boolean
  errors: string[]
}

export type TransactionType = 'gasto' | 'ingreso'

/**
 * Valida los datos de una transacción
 */
export function validateTransactionData(data: {
  amount?: number
  category?: string
  type?: string
  description?: string
}): TransactionValidation {
  const errors: string[] = []
  
  if (data.amount !== undefined) {
    if (isNaN(data.amount)) {
      errors.push('El monto debe ser un número válido')
    }
    if (data.amount <= 0) {
      errors.push('El monto debe ser mayor a 0')
    }
    if (data.amount > 1000000000) {
      errors.push('El monto es demasiado alto')
    }
  }
  
  if (data.category && data.category.trim().length === 0) {
    errors.push('La categoría no puede estar vacía')
  }
  
  if (data.category && data.category.length > 100) {
    errors.push('La categoría no puede exceder 100 caracteres')
  }
  
  if (data.type && !['gasto', 'ingreso'].includes(data.type)) {
    errors.push('El tipo debe ser "gasto" o "ingreso"')
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida datos completos de transacción para creación
 */
export function validateTransactionCreation(data: {
  valor: number
  categoria: string
  tipo: string
  descripcion?: string
}): TransactionValidation {
  const errors: string[] = []
  
  // Validar monto
  const amountValidation = validateTransactionData({ amount: data.valor })
  if (!amountValidation.isValid) {
    errors.push(...amountValidation.errors)
  }
  
  // Validar categoría (requerida)
  if (!data.categoria || data.categoria.trim().length === 0) {
    errors.push('La categoría es requerida')
  } else {
    const categoryValidation = validateTransactionData({ category: data.categoria })
    if (!categoryValidation.isValid) {
      errors.push(...categoryValidation.errors)
    }
  }
  
  // Validar tipo (requerido)
  if (!data.tipo) {
    errors.push('El tipo es requerido')
  } else {
    const typeValidation = validateTransactionData({ type: data.tipo })
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors)
    }
  }
  
  // Validar descripción (opcional)
  if (data.descripcion) {
    const descValidation = validateTransactionData({ description: data.descripcion })
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcula gastos por período específico
 */
export function calculateExpensesByPeriod(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): number {
  const filteredTransactions = transactions.filter(t => {
    if (!t.creado_en || t.tipo !== 'gasto') return false
    const transactionDate = new Date(t.creado_en)
    const isInRange = transactionDate >= startDate && transactionDate <= endDate
    
    // Log para debug
    if (t.tipo === 'gasto') {
      console.log('📊 CALC - Transaction filter:', {
        id: t.id,
        creado_en: t.creado_en,
        transactionDate: transactionDate.toISOString(),
        transactionLocal: transactionDate.toLocaleString('es-CO'),
        valor: t.valor,
        categoria: t.categoria,
        isInRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    }
    
    return isInRange
  })
  
  const total = filteredTransactions.reduce((sum, t) => sum + (t.valor || 0), 0)
  
  console.log('💰 CALC - Period calculation result:', {
    totalTransactions: transactions.length,
    filteredTransactions: filteredTransactions.length,
    total,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  })
  
  return total
}

/**
 * Calcula gastos de hoy (en timezone local de Colombia)
 */
export function calculateTodayExpenses(transactions: Transaction[]): number {
  // ✅ Usar timezone local para calcular "hoy"
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  
  console.log('📅 CALC - Today expenses range:', {
    todayStart: todayStart.toISOString(),
    todayEnd: todayEnd.toISOString(),
    localStart: todayStart.toLocaleString('es-CO'),
    localEnd: todayEnd.toLocaleString('es-CO')
  })
  
  return calculateExpensesByPeriod(transactions, todayStart, todayEnd)
}

/**
 * Calcula gastos de la semana (últimos 7 días)
 */
export function calculateWeekExpenses(transactions: Transaction[]): number {
  const today = new Date()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate())
  
  return calculateExpensesByPeriod(transactions, weekStart, todayEnd)
}

/**
 * Calcula gastos del mes actual (en timezone local de Colombia)
 */
export function calculateMonthExpenses(transactions: Transaction[]): number {
  const today = new Date()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  console.log('📅 CALC - Month expenses range:', {
    firstDayOfMonth: firstDayOfMonth.toISOString(),
    todayEnd: todayEnd.toISOString(),
    localStart: firstDayOfMonth.toLocaleString('es-CO'),
    localEnd: todayEnd.toLocaleString('es-CO')
  })
  
  return calculateExpensesByPeriod(transactions, firstDayOfMonth, todayEnd)
}

/**
 * Calcula total de ingresos
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + (t.valor || 0), 0)
}

/**
 * Calcula total de gastos
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + (t.valor || 0), 0)
}

/**
 * Agrupa gastos por categoría
 */
export function groupExpensesByCategory(transactions: Transaction[]): Record<string, number> {
  return transactions
    .filter(t => t.tipo === 'gasto' && t.categoria)
    .reduce((acc, t) => {
      const category = t.categoria!
      acc[category] = (acc[category] || 0) + (t.valor || 0)
      return acc
    }, {} as Record<string, number>)
}

/**
 * Calcula resumen de categorías con estadísticas
 */
export function calculateCategorySummary(transactions: Transaction[]): CategorySummary[] {
  const expensesByCategory = groupExpensesByCategory(transactions)
  const totalExpenses = calculateTotalExpenses(transactions)
  
  return Object.entries(expensesByCategory).map(([categoria, total]) => {
    const categoryTransactions = transactions.filter(t => t.categoria === categoria && t.tipo === 'gasto')
    const count = categoryTransactions.length
    const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    
    return {
      categoria,
      total,
      count,
      percentage: Math.round(percentage * 100) / 100
    }
  }).sort((a, b) => b.total - a.total) // Ordenar por monto descendente
}

/**
 * Calcula tendencia semanal para las últimas 4 semanas
 */
export function calculateWeeklyTrend(transactions: Transaction[]): WeeklyData[] {
  const weeks: WeeklyData[] = []
  const today = new Date()
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
    
    const weekSpent = calculateExpensesByPeriod(transactions, weekStart, weekEnd)
    const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
    
    weeks.push({
      week: weekLabel,
      amount: weekSpent,
      date: weekStart.toLocaleDateString('es-CO')
    })
  }
  
  return weeks
}

/**
 * Calcula resumen completo de transacciones
 */
export function calculateTransactionSummary(transactions: Transaction[]): TransactionSummary {
  return {
    totalSpent: calculateTotalExpenses(transactions),
    totalIncome: calculateTotalIncome(transactions),
    todayExpenses: calculateTodayExpenses(transactions),
    weekExpenses: calculateWeekExpenses(transactions),
    monthExpenses: calculateMonthExpenses(transactions),
    expensesByCategory: groupExpensesByCategory(transactions)
  }
}

/**
 * Formatea un monto como moneda colombiana
 */
export function formatTransactionAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Verifica si una fecha está en un rango específico
 */
export function isDateInRange(dateString: string, startDate: Date, endDate: Date): boolean {
  const date = new Date(dateString)
  return date >= startDate && date <= endDate
}
