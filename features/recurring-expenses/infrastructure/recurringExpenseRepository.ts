import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'
import type { RecurringExpenseStatus, RecurringFrequency } from '@/lib/recurring-expenses'

export interface RecurringExpenseEntity {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string
  direction: 'gasto' | 'ingreso'
  merchant: string | null
  frequency: RecurringFrequency
  billing_day: number | null
  next_charge_date: string
  starts_at: string
  ends_at: string | null
  status: RecurringExpenseStatus
  auto_create: boolean
  notes: string | null
  created_at: string
  updated_at: string
  ended_at: string | null
}

export interface CreateRecurringExpenseData {
  user_id: string
  name: string
  amount: number
  category_id: string
  direction?: 'gasto' | 'ingreso'
  merchant?: string | null
  frequency: RecurringFrequency
  billing_day?: number | null
  next_charge_date: string
  starts_at?: string
  auto_create?: boolean
  notes?: string | null
}

export class RecurringExpenseRepository {
  private async getClient() {
    if (typeof window !== 'undefined') {
      return getBrowserSupabaseClient()
    }
    return await getServerSupabaseClient()
  }

  async findAllByUser(userId: string): Promise<RecurringExpenseEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('status', { ascending: true })
      .order('next_charge_date', { ascending: true })

    if (error) throw new Error(`Error fetching recurring expenses: ${error.message}`)
    return data || []
  }

  async create(data: CreateRecurringExpenseData): Promise<RecurringExpenseEntity> {
    const client = await this.getClient()
    const { data: result, error } = await client
      .from('recurring_expenses')
      .insert({
        user_id: data.user_id,
        name: data.name,
        amount: data.amount,
        category_id: data.category_id,
        direction: data.direction || 'gasto',
        merchant: data.merchant || null,
        frequency: data.frequency,
        billing_day: data.billing_day || null,
        next_charge_date: data.next_charge_date,
        starts_at: data.starts_at || data.next_charge_date,
        auto_create: data.auto_create ?? true,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Error creating recurring expense: ${error.message}`)
    return result
  }

  async update(
    userId: string,
    id: string,
    updates: Partial<Omit<RecurringExpenseEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<RecurringExpenseEntity> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('recurring_expenses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`Error updating recurring expense: ${error.message}`)
    return data
  }

  async delete(userId: string, id: string): Promise<void> {
    const client = await this.getClient()
    const { error } = await client
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`Error deleting recurring expense: ${error.message}`)
  }
}

export const recurringExpenseRepository = new RecurringExpenseRepository()
