import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'

export interface CategoryBudgetEntity {
  id: string
  user_id: string
  category_id: string
  amount: number
  created_at: string
  updated_at: string
}

export class CategoryBudgetRepository {
  private async getClient() {
    if (typeof window !== 'undefined') {
      return getBrowserSupabaseClient()
    } else {
      return await getServerSupabaseClient()
    }
  }

  async findAllByUser(userId: string): Promise<CategoryBudgetEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('category_budgets')
      .select('*')
      .eq('user_id', userId)

    if (error) throw new Error(`Error fetching category budgets: ${error.message}`)
    return data || []
  }

  async findByUserAndCategory(userId: string, categoryId: string): Promise<CategoryBudgetEntity | null> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('category_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (error) throw new Error(`Error fetching category budget: ${error.message}`)
    return data
  }

  async upsert(userId: string, categoryId: string, amount: number): Promise<CategoryBudgetEntity> {
    const client = await this.getClient()
    // Usamos upsert con onConflict especificando la constraint única
    const { data, error } = await client
      .from('category_budgets')
      .upsert(
        { user_id: userId, category_id: categoryId, amount },
        { 
          onConflict: 'user_id, category_id', // debe coincidir con la constraint única
          ignoreDuplicates: false 
        }
      )
      .select()
      .single()

    if (error) throw new Error(`Error upserting category budget: ${error.message}`)
    return data
  }

  async delete(userId: string, categoryId: string): Promise<void> {
    const client = await this.getClient()
    const { error } = await client
      .from('category_budgets')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId)

    if (error) throw new Error(`Error deleting category budget: ${error.message}`)
  }

  /**
   * Fusiona el presupuesto de `fromCategoryId` en `toCategoryId` (suma importes si ya existe presupuesto en destino).
   * Usado al eliminar una categoría personalizada cuyo presupuesto debe conservarse en «Otros».
   */
  async mergeBudgetsFromCategoryToCategory(
    userId: string,
    fromCategoryId: string,
    toCategoryId: string
  ): Promise<void> {
    if (fromCategoryId === toCategoryId) return
    const client = await this.getClient()
    const from = await this.findByUserAndCategory(userId, fromCategoryId)
    if (!from) return

    const to = await this.findByUserAndCategory(userId, toCategoryId)
    const now = new Date().toISOString()

    if (to) {
      const sum = Number(to.amount) + Number(from.amount)
      const { error: mergeErr } = await client
        .from('category_budgets')
        .update({ amount: sum, updated_at: now })
        .eq('id', to.id)
        .eq('user_id', userId)
      if (mergeErr) {
        throw new Error(`Error fusionando presupuestos: ${mergeErr.message}`)
      }
      const { error: delErr } = await client
        .from('category_budgets')
        .delete()
        .eq('id', from.id)
        .eq('user_id', userId)
      if (delErr) throw new Error(`Error al liberar presupuesto antiguo: ${delErr.message}`)
    } else {
      const { error } = await client
        .from('category_budgets')
        .update({ category_id: toCategoryId, updated_at: now })
        .eq('id', from.id)
        .eq('user_id', userId)
      if (error) throw new Error(`Error reasignando presupuesto: ${error.message}`)
    }
  }

  subscribeToChanges(userId: string, callback: () => void) {
    if (typeof window === 'undefined') throw new Error('Real-time only in browser')
    const client = getBrowserSupabaseClient()
    return client
      .channel('category_budgets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'category_budgets', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe()
  }
}

export const categoryBudgetRepository = new CategoryBudgetRepository()