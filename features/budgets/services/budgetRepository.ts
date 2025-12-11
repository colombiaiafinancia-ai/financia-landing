/**
 * Repositorio de Budgets - Capa de Infraestructura
 * 
 * RESPONSABILIDAD: Acceso a datos ÚNICAMENTE
 * - Queries a Supabase
 * - Suscripciones en tiempo real
 * - Manejo de errores de infraestructura
 * - Transformación de datos de BD a dominio
 * 
 * NO DEBE CONTENER:
 * ❌ Lógica de negocio
 * ❌ Validaciones de dominio
 * ❌ Cálculos de fechas
 * ❌ Formateo de datos para UI
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Separación de Capas
 */

import { getServerSupabaseClient, getBrowserSupabaseClient } from '@/services/supabase'
import type { BrowserSupabaseClient, ServerSupabaseClient } from '@/services/supabase/types'

/**
 * Tipos de infraestructura (mapeo directo con BD)
 */
export interface BudgetEntity {
  id?: string
  user_id: string
  monto_mensual: number
  mes: number
  año: number
  created_at?: string
  updated_at?: string
}

export interface CategoryBudgetEntity {
  id?: string
  usuario_id: string
  mes: string // Formato: YYYY-MM-01
  valor: number
  categorias: string
  created_at?: string
  updated_at?: string
}

/**
 * Repositorio para presupuestos generales
 */
export class BudgetRepository {
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
   * Obtener presupuesto por período específico
   */
  async findByUserAndPeriod(
    userId: string, 
    year: number, 
    month: number
  ): Promise<BudgetEntity | null> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuestos')
      .select('*')
      .eq('user_id', userId)
      .eq('mes', month)
      .eq('año', year)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No existe presupuesto para este período
        return null
      }
      throw new Error(`Error fetching budget: ${error.message}`)
    }

    return data
  }

  /**
   * Obtener todos los presupuestos de un usuario
   */
  async findAllByUser(userId: string): Promise<BudgetEntity[]> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuestos')
      .select('*')
      .eq('user_id', userId)
      .order('año', { ascending: false })
      .order('mes', { ascending: false })

    if (error) {
      throw new Error(`Error fetching budgets: ${error.message}`)
    }

    return data || []
  }

  /**
   * Crear nuevo presupuesto
   */
  async create(budget: Omit<BudgetEntity, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuestos')
      .insert(budget)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating budget: ${error.message}`)
    }

    return data
  }

  /**
   * Actualizar presupuesto existente
   */
  async update(
    userId: string,
    year: number,
    month: number,
    updates: Partial<Pick<BudgetEntity, 'monto_mensual'>>
  ): Promise<BudgetEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuestos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('mes', month)
      .eq('año', year)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating budget: ${error.message}`)
    }

    return data
  }

  /**
   * Eliminar presupuesto
   */
  async delete(userId: string, year: number, month: number): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from('presupuestos')
      .delete()
      .eq('user_id', userId)
      .eq('mes', month)
      .eq('año', year)

    if (error) {
      throw new Error(`Error deleting budget: ${error.message}`)
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
      .channel('budgets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'presupuestos',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

/**
 * Repositorio para presupuestos por categoría
 */
export class CategoryBudgetRepository {
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
   * Obtener presupuestos por período
   */
  async findByUserAndPeriod(userId: string, monthDate: string): Promise<CategoryBudgetEntity[]> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuesto')
      .select('*')
      .eq('usuario_id', userId)
      .eq('mes', monthDate)

    if (error) {
      throw new Error(`Error fetching category budgets: ${error.message}`)
    }

    return data || []
  }

  /**
   * Obtener presupuesto específico por categoría
   */
  async findByUserPeriodAndCategory(
    userId: string, 
    monthDate: string, 
    categoria: string
  ): Promise<CategoryBudgetEntity | null> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuesto')
      .select('*')
      .eq('usuario_id', userId)
      .eq('mes', monthDate)
      .eq('categorias', categoria)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching category budget: ${error.message}`)
    }

    return data
  }

  /**
   * Crear presupuesto por categoría
   */
  async create(budget: Omit<CategoryBudgetEntity, 'id' | 'created_at' | 'updated_at'>): Promise<CategoryBudgetEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuesto')
      .insert(budget)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating category budget: ${error.message}`)
    }

    return data
  }

  /**
   * Actualizar presupuesto por categoría
   */
  async update(id: string, updates: Partial<Pick<CategoryBudgetEntity, 'valor'>>): Promise<CategoryBudgetEntity> {
    const client = await this.getClient()

    const { data, error } = await client
      .from('presupuesto')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating category budget: ${error.message}`)
    }

    return data
  }

  /**
   * Eliminar presupuesto por categoría
   */
  async delete(userId: string, monthDate: string, categoria: string): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from('presupuesto')
      .delete()
      .eq('usuario_id', userId)
      .eq('mes', monthDate)
      .eq('categorias', categoria)

    if (error) {
      throw new Error(`Error deleting category budget: ${error.message}`)
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
      .channel('category_budgets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'presupuesto',
          filter: `usuario_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

// Instancias singleton para reutilización
export const budgetRepository = new BudgetRepository()
export const categoryBudgetRepository = new CategoryBudgetRepository()
