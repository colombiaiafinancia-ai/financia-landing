import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'
import type { BrowserSupabaseClient, ServerSupabaseClient } from '@/services/supabase/types'

export interface TransactionEntity {
  id: string
  user_id: string
  occurred_at: string
  direction: 'gasto' | 'ingreso'
  status: 'confirmada' | 'pendiente'
  amount: number
  category_id: string
  description: string | null
  merchant: string | null
  meta: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateTransactionData {
  user_id: string
  direction: 'gasto' | 'ingreso'
  amount: number
  category_id: string
  description?: string | null
  occurred_at?: string // si no se envía, se usa now()
}

export class TransactionRepository {
  private async getClient() {
    if (typeof window !== 'undefined') {
      return getBrowserSupabaseClient()
    } else {
      return await getServerSupabaseClient()
    }
  }

  async findAllByUser(userId: string): Promise<TransactionEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })

    if (error) throw new Error(`Error fetching transactions: ${error.message}`)
    return data || []
  }

  async findByUserAndPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TransactionEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)
      .order('occurred_at', { ascending: false })

    if (error) throw new Error(`Error fetching transactions by period: ${error.message}`)
    return data || []
  }

  async create(data: CreateTransactionData): Promise<TransactionEntity> {
    const client = await this.getClient()
    const { data: result, error } = await client
      .from('transactions')
      .insert({
        user_id: data.user_id,
        occurred_at: data.occurred_at || new Date().toISOString(),
        direction: data.direction,
        status: 'confirmada',
        amount: data.amount,
        category_id: data.category_id,
        description: data.description || null,
        merchant: null,
        meta: {}
      })
      .select()
      .single()

    if (error) throw new Error(`Error creating transaction: ${error.message}`)
    return result
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<Omit<TransactionEntity, 'id' | 'user_id' | 'created_at'>>
  ): Promise<TransactionEntity> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`Error updating transaction: ${error.message}`)
    return data
  }

  async delete(id: string, userId: string): Promise<void> {
    const client = await this.getClient()
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`Error deleting transaction: ${error.message}`)
  }

  /** Mueve todas las transacciones del usuario de una categoría a otra (p. ej. al eliminar categoría → Otros). */
  async reassignCategoryForUser(
    userId: string,
    fromCategoryId: string,
    toCategoryId: string
  ): Promise<void> {
    if (fromCategoryId === toCategoryId) return
    const client = await this.getClient()
    const { error } = await client
      .from('transactions')
      .update({ category_id: toCategoryId, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('category_id', fromCategoryId)

    if (error) throw new Error(`Error reasignando transacciones: ${error.message}`)
  }

  subscribeToChanges(userId: string, callback: () => void) {
    if (typeof window === 'undefined') throw new Error('Real-time only in browser')
    const client = getBrowserSupabaseClient()
    return client
      .channel('transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe()
  }
}

export const transactionRepository = new TransactionRepository()