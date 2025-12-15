/**
 * INFRASTRUCTURE LAYER - Categories Repository
 * 
 * Maneja ÚNICAMENTE el acceso a datos de categorías en Supabase.
 * No contiene lógica de negocio.
 */

import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'
import { Category } from '../domain/categoryLogic'

export interface CategoryEntity {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
  creado_en?: string
  actualizado_en?: string
}

export class CategoryRepository {
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
   * Mapea entidad de base de datos a modelo de dominio
   */
  private mapEntityToDomain(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      nombre: entity.nombre,
      tipo: entity.tipo
    }
  }

  /**
   * Obtiene todas las categorías
   */
  async getAll(): Promise<Category[]> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('categorias')
        .select('id, nombre, tipo')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('❌ CATEGORY_REPO - Error fetching categories:', error)
        throw new Error(`Error al obtener categorías: ${error.message}`)
      }

      return (data || []).map(this.mapEntityToDomain)
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene categorías por tipo
   */
  async getByType(type: 'Gasto' | 'Ingreso'): Promise<Category[]> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('categorias')
        .select('id, nombre, tipo')
        .eq('tipo', type)
        .order('nombre', { ascending: true })

      if (error) {
        console.error('❌ CATEGORY_REPO - Error fetching categories by type:', error)
        throw new Error(`Error al obtener categorías de tipo ${type}: ${error.message}`)
      }

      return (data || []).map(this.mapEntityToDomain)
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  async getById(id: string): Promise<Category | null> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('categorias')
        .select('id, nombre, tipo')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          return null
        }
        console.error('❌ CATEGORY_REPO - Error fetching category by ID:', error)
        throw new Error(`Error al obtener categoría: ${error.message}`)
      }

      return data ? this.mapEntityToDomain(data) : null
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Crea una nueva categoría
   */
  async create(categoryData: Omit<Category, 'id'>): Promise<Category> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('categorias')
        .insert({
          nombre: categoryData.nombre,
          tipo: categoryData.tipo
        })
        .select('id, nombre, tipo')
        .single()

      if (error) {
        console.error('❌ CATEGORY_REPO - Error creating category:', error)
        throw new Error(`Error al crear categoría: ${error.message}`)
      }

      console.log('✅ CATEGORY_REPO - Category created:', data)
      return this.mapEntityToDomain(data)
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Actualiza una categoría existente
   */
  async update(id: string, categoryData: Partial<Omit<Category, 'id'>>): Promise<Category> {
    try {
      const client = await this.getClient()
      
      const { data, error } = await client
        .from('categorias')
        .update({
          ...(categoryData.nombre && { nombre: categoryData.nombre }),
          ...(categoryData.tipo && { tipo: categoryData.tipo })
        })
        .eq('id', id)
        .select('id, nombre, tipo')
        .single()

      if (error) {
        console.error('❌ CATEGORY_REPO - Error updating category:', error)
        throw new Error(`Error al actualizar categoría: ${error.message}`)
      }

      console.log('✅ CATEGORY_REPO - Category updated:', data)
      return this.mapEntityToDomain(data)
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Elimina una categoría
   */
  async delete(id: string): Promise<void> {
    try {
      const client = await this.getClient()
      
      const { error } = await client
        .from('categorias')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ CATEGORY_REPO - Error deleting category:', error)
        throw new Error(`Error al eliminar categoría: ${error.message}`)
      }

      console.log('✅ CATEGORY_REPO - Category deleted:', id)
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }

  /**
   * Verifica si existe una categoría con el mismo nombre
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      
      let query = client
        .from('categorias')
        .select('id')
        .ilike('nombre', name.trim())

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ CATEGORY_REPO - Error checking category existence:', error)
        throw new Error(`Error al verificar categoría: ${error.message}`)
      }

      return (data || []).length > 0
    } catch (error) {
      console.error('💥 CATEGORY_REPO - Unexpected error:', error)
      throw error
    }
  }
}

// Singleton instance
export const categoryRepository = new CategoryRepository()

