/**
 * Repositorio de Transactions - Capa de Infraestructura
 * 
 * RESPONSABILIDAD: Acceso a datos ÚNICAMENTE
 * - Queries a Supabase
 * - Suscripciones en tiempo real
 * - Manejo de errores de infraestructura
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

import { getServerSupabaseClient, getBrowserSupabaseClient } from '@/services/supabase'
import type { BrowserSupabaseClient, ServerSupabaseClient } from '@/services/supabase/types'

/**
 * Tipos de infraestructura (mapeo directo con BD)
 */
export interface TransactionEntity {
  id?: string
  user_id: string
  monto: number
  categoria: string
  tipo: string
  descripcion?: string
  fecha: string
  created_at?: string
  updated_at?: string
}

export interface TransactionCreateEntity {
  user_id: string
  monto: number
  categoria: string
  tipo: string
  descripcion?: string
  fecha?: string
}

/**
 * Repositorio para transacciones
 */
export class TransactionRepository {
  private client: BrowserSupabaseClient | ServerSupabaseClient | null = null

  /**
   * Obtener cliente apropiado según el entorno
   */
  private async getClient(): Promise<BrowserSupabaseClient | ServerSupabaseClient> {
    if (this.client) {
      return this.client
    }

    if (typeof window !== 'undefined') {
      // Browser environment
      this.client = getBrowserSupabaseClient()
    } else {
      // Server environment
      this.client = await getServerSupabaseClient()
    }

    return this.client
  }

  /**
   * Obtener transacciones por rango de fechas
   */
  async findByUserAndDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TransactionEntity[]> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .select('*')
      .eq('user_id', userId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: false })

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Obtener transacciones del mes actual
   */
  async findMonthlyByUser(
    userId: string, 
    year?: number, 
    month?: number
  ): Promise<TransactionEntity[]> {
    const now = new Date()
    const currentYear = year || now.getFullYear()
    const currentMonth = month || (now.getMonth() + 1)
    
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`

    return this.findByUserAndDateRange(userId, startDate, endDate)
  }

  /**
   * Obtener gastos por categoría en un período
   */
  async findExpensesByCategory(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Record<string, number>> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .select('categoria, monto')
      .eq('user_id', userId)
      .eq('tipo', 'gasto')
      .gte('fecha', startDate)
      .lte('fecha', endDate)

    if (error) {
      throw new Error(`Error fetching expenses by category: ${error.message}`)
    }

    // Agrupar por categoría
    const expensesByCategory: Record<string, number> = {}
    data?.forEach(transaction => {
      if (transaction.categoria) {
        expensesByCategory[transaction.categoria] = 
          (expensesByCategory[transaction.categoria] || 0) + Math.abs(transaction.monto || 0)
      }
    })

    return expensesByCategory
  }

  /**
   * Obtener total gastado en un período
   */
  async getTotalSpentByUser(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<number> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .select('monto')
      .eq('user_id', userId)
      .eq('tipo', 'gasto')
      .gte('fecha', startDate)
      .lte('fecha', endDate)

    if (error) {
      throw new Error(`Error fetching total spent: ${error.message}`)
    }

    return data?.reduce((total, transaction) => total + Math.abs(transaction.monto || 0), 0) || 0
  }

  /**
   * Obtener total de ingresos en un período
   */
  async getTotalIncomeByUser(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<number> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .select('monto')
      .eq('user_id', userId)
      .eq('tipo', 'ingreso')
      .gte('fecha', startDate)
      .lte('fecha', endDate)

    if (error) {
      throw new Error(`Error fetching total income: ${error.message}`)
    }

    return data?.reduce((total, transaction) => total + Math.abs(transaction.monto || 0), 0) || 0
  }

  /**
   * Crear nueva transacción
   */
  async create(transaction: TransactionCreateEntity): Promise<TransactionEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .insert({
        ...transaction,
        fecha: transaction.fecha || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating transaction: ${error.message}`)
    }

    return data
  }

  /**
   * Actualizar transacción existente
   */
  async update(
    id: string, 
    updates: Partial<Omit<TransactionEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<TransactionEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating transaction: ${error.message}`)
    }

    return data
  }

  /**
   * Eliminar transacción
   */
  async delete(id: string, userId: string): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from('transacciones')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Seguridad: solo el dueño puede eliminar

    if (error) {
      throw new Error(`Error deleting transaction: ${error.message}`)
    }
  }

  /**
   * Obtener transacción por ID
   */
  async findById(id: string, userId: string): Promise<TransactionEntity | null> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('transacciones')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching transaction: ${error.message}`)
    }

    return data
  }

  /**
   * Obtener todas las transacciones de un usuario
   */
  async findAllByUser(userId: string, limit?: number): Promise<TransactionEntity[]> {
    const client = await this.getClient()

    let query = client
      .from('transacciones')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching all transactions: ${error.message}`)
    }

    return data || []
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
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

// Instancia singleton para reutilización
export const transactionRepository = new TransactionRepository()
