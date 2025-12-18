/**
 * INFRASTRUCTURE LAYER - Transaction Repository
 * 
 * Maneja ÚNICAMENTE el acceso a datos de transacciones en Supabase.
 * No contiene lógica de negocio.
 */

import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'

export interface TransactionEntity {
  id: string
  usuario_id: string
  valor: number
  categoria: string | null
  tipo: 'gasto' | 'ingreso' | null
  descripcion: string | null
  creado_en: string | null
}

export interface TransactionCreationData {
  usuario_id: string
  valor: number
  categoria: string
  tipo: 'gasto' | 'ingreso'
  descripcion?: string | null
}

export class TransactionRepository {
  /**
   * Obtiene el cliente Supabase apropiado según el entorno
   */
  private async getClient() {
    // Detectar entorno automáticamente
    if (typeof window !== 'undefined') {
      // Cliente browser para hooks y componentes
      return getBrowserSupabaseClient()
    } else {
      // Cliente server para API routes y Server Components
      return await getServerSupabaseClient()
    }
  }

  /**
   * Obtiene todas las transacciones de un usuario
   */
  async findAllByUser(userId: string): Promise<TransactionEntity[]> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('transacciones')
        .select('*')
        .eq('usuario_id', userId)
        .order('creado_en', { ascending: false })

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error fetching transactions:', error)
        throw new Error(`Error al obtener transacciones: ${error.message}`)
      }

      console.log('✅ TRANSACTION_REPO - All transactions loaded:', {
        userId,
        count: data?.length || 0,
        firstTransaction: data?.[0] ? {
          id: data[0].id,
          creado_en: data[0].creado_en,
          valor: data[0].valor,
          categoria: data[0].categoria
        } : null
      })

      return data || []
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene transacciones de un usuario por período específico
   */
  async findByUserAndPeriod(
    userId: string, 
    year?: number, 
    month?: number
  ): Promise<TransactionEntity[]> {
    try {
      const client = await this.getClient()
      
      let query = client
        .from('transacciones')
        .select('*')
        .eq('usuario_id', userId)
        .order('creado_en', { ascending: false })

      if (year && month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        // ✅ Calcular correctamente el último día del mes
        const lastDayOfMonth = new Date(year, month, 0).getDate()
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`
        
        console.log('📅 TRANSACTION_REPO - Date range filter:', { startDate, endDate, year, month })
        
        query = query
          .gte('creado_en', startDate)
          .lte('creado_en', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error fetching transactions by period:', error)
        throw new Error(`Error al obtener transacciones por período: ${error.message}`)
      }

      console.log('✅ TRANSACTION_REPO - Period transactions loaded:', {
        userId,
        year,
        month,
        count: data?.length || 0,
        transactions: data?.map(t => ({
          id: t.id,
          creado_en: t.creado_en,
          valor: t.valor,
          categoria: t.categoria
        })) || []
      })

      return data || []
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene transacciones del mes actual
   */
  async findMonthlyByUser(userId: string): Promise<TransactionEntity[]> {
    const now = new Date()
    return this.findByUserAndPeriod(userId, now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * Obtiene el gasto total del mes para un usuario
   */
  async getMonthlySpent(userId: string): Promise<number> {
    try {
      const client = await this.getClient()
      
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      
      console.log('📅 TRANSACTION_REPO - Monthly spent date range:', { startOfMonth, endOfMonth })
      
      const { data, error } = await client
        .from('transacciones')
        .select('valor')
        .eq('usuario_id', userId)
        .eq('tipo', 'gasto')
        .gte('creado_en', startOfMonth)
        .lte('creado_en', endOfMonth)

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error calculating monthly spent:', error)
        throw new Error(`Error al calcular gastos mensuales: ${error.message}`)
      }

      return (data || []).reduce((sum, transaction) => sum + transaction.valor, 0)
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene resumen de gastos por categoría
   */
  async getCategorySummary(userId: string): Promise<Array<{categoria: string, total: number, count: number}>> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('transacciones')
        .select('categoria, valor')
        .eq('usuario_id', userId)
        .eq('tipo', 'gasto')
        .not('categoria', 'is', null)

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error getting category summary:', error)
        throw new Error(`Error al obtener resumen por categoría: ${error.message}`)
      }

      // Agrupar por categoría
      const summary = (data || []).reduce((acc, transaction) => {
        const category = transaction.categoria!
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 }
        }
        acc[category].total += transaction.valor
        acc[category].count += 1
        return acc
      }, {} as Record<string, {total: number, count: number}>)

      // Convertir a array y ordenar por total
      return Object.entries(summary)
        .map(([categoria, stats]) => ({
          categoria,
          total: stats.total,
          count: stats.count
        }))
        .sort((a, b) => b.total - a.total)
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene resumen semanal de gastos
   */
  async getWeeklySummary(userId: string): Promise<Array<{week: string, total: number, date: string}>> {
    try {
      const client = await this.getClient()
      
      // Obtener transacciones de las últimas 4 semanas
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      
      const { data, error } = await client
        .from('transacciones')
        .select('valor, creado_en')
        .eq('usuario_id', userId)
        .eq('tipo', 'gasto')
        .gte('creado_en', fourWeeksAgo.toISOString().split('T')[0])
        .order('creado_en', { ascending: true })

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error getting weekly summary:', error)
        throw new Error(`Error al obtener resumen semanal: ${error.message}`)
      }

      // Agrupar por semana
      const weeklyData: Array<{week: string, total: number, date: string}> = []
      const today = new Date()
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
        const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
        
        const weekTransactions = (data || []).filter(t => {
          const transactionDate = new Date(t.creado_en!)
          return transactionDate >= weekStart && transactionDate <= weekEnd
        })
        
        const weekTotal = weekTransactions.reduce((sum, t) => sum + t.valor, 0)
        const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
        
        weeklyData.push({
          week: weekLabel,
          total: weekTotal,
          date: weekStart.toLocaleDateString('es-CO')
        })
      }
      
      return weeklyData
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Crea una nueva transacción
   */
  async create(transactionData: TransactionCreationData): Promise<TransactionEntity> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('transacciones')
        .insert({
          usuario_id: transactionData.usuario_id,
          valor: transactionData.valor,
          categoria: transactionData.categoria,
          tipo: transactionData.tipo,
          descripcion: transactionData.descripcion || null,
          creado_en: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error creating transaction:', error)
        throw new Error(`Error al crear transacción: ${error.message}`)
      }

      console.log('✅ TRANSACTION_REPO - Transaction created:', data)
      return data
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Actualiza una transacción existente
   */
  async update(
    transactionId: string, 
    userId: string, 
    updates: Partial<Omit<TransactionEntity, 'id' | 'usuario_id' | 'creado_en'>>
  ): Promise<TransactionEntity> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('transacciones')
        .update(updates)
        .eq('id', transactionId)
        .eq('usuario_id', userId) // Seguridad adicional
        .select()
        .single()

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error updating transaction:', error)
        throw new Error(`Error al actualizar transacción: ${error.message}`)
      }

      console.log('✅ TRANSACTION_REPO - Transaction updated:', data)
      return data
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Elimina una transacción
   */
  async delete(transactionId: string, userId: string): Promise<void> {
    try {
      const client = await this.getClient()
      
      const { error } = await client
        .from('transacciones')
        .delete()
        .eq('id', transactionId)
        .eq('usuario_id', userId) // Seguridad adicional

      if (error) {
        console.error('❌ TRANSACTION_REPO - Error deleting transaction:', error)
        throw new Error(`Error al eliminar transacción: ${error.message}`)
      }

      console.log('✅ TRANSACTION_REPO - Transaction deleted:', transactionId)
    } catch (error) {
      console.error('💥 TRANSACTION_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(userId: string, callback: () => void) {
    // Solo disponible en browser
    if (typeof window === 'undefined') {
      throw new Error('Real-time subscriptions only available in browser environment')
    }

    const client = getBrowserSupabaseClient()

    return client
      .channel('transactions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transacciones',
          filter: `usuario_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

// Singleton instance
export const transactionRepository = new TransactionRepository()