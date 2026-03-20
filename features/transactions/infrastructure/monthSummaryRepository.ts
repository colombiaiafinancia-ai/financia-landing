import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'

export interface MonthSummary {
  user_id: string
  month: string
  income_total: number
  expense_total: number
  net_total: number
}

export interface MonthCategorySummary {
  user_id: string
  month: string
  category_id: string
  direction: 'gasto' | 'ingreso'
  total: number
}

export class MonthSummaryRepository {
  private async getClient() {
    if (typeof window !== 'undefined') {
      return getBrowserSupabaseClient()
    } else {
      return await getServerSupabaseClient()
    }
  }

  /**
   * Obtiene el resumen global del mes para un usuario
   */
  async getMonthSummary(userId: string, monthDate: string): Promise<MonthSummary | null> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('user_month_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .maybeSingle()

    if (error) throw new Error(`Error fetching month summary: ${error.message}`)
    return data
  }

  /**
   * Obtiene el resumen por categoría del mes para un usuario (solo gastos)
   */
  async getMonthCategoryExpenses(userId: string, monthDate: string): Promise<MonthCategorySummary[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('user_month_category_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .eq('direction', 'gasto')

    if (error) throw new Error(`Error fetching month category summary: ${error.message}`)
    return data || []
  }

  /**
   * Obtiene el resumen diario para calcular tendencia semanal
   * (últimos 28 días)
   */
  async getDailyExpenses(userId: string, startDate: string, endDate: string): Promise<{ day: string; total: number }[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('user_day_category_summary')
      .select('day, total')
      .eq('user_id', userId)
      .eq('direction', 'gasto')
      .gte('day', startDate)
      .lte('day', endDate)

    if (error) throw new Error(`Error fetching daily expenses: ${error.message}`)
    
    // Agrupar por día (aunque la tabla ya tiene un registro por día y categoría, debemos sumar)
    const map = new Map<string, number>()
    data?.forEach(item => {
      const current = map.get(item.day) || 0
      map.set(item.day, current + item.total)
    })
    return Array.from(map.entries()).map(([day, total]) => ({ day, total }))
  }
}

export const monthSummaryRepository = new MonthSummaryRepository()