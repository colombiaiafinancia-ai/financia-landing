import { getBrowserSupabaseClient, getServerSupabaseClient } from '@/services/supabase'

export interface CategoryEntity {
  id: string
  user_id: string | null
  name: string
  direction: 'gasto' | 'ingreso'
  icon_key: string | null
  parent_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryData {
  name: string
  direction: 'gasto' | 'ingreso'
  icon_key?: string | null
  user_id?: string | null
  parent_id?: string | null
}

export class CategoryRepository {
  private async getClient() {
    if (typeof window !== 'undefined') {
      return getBrowserSupabaseClient()
    } else {
      return await getServerSupabaseClient()
    }
  }

  async findAllForUser(userId: string): Promise<CategoryEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(`Error fetching categories: ${error.message}`)
    return data || []
  }

  async findByDirection(userId: string, direction: 'gasto' | 'ingreso'): Promise<CategoryEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('direction', direction)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(`Error fetching categories by direction: ${error.message}`)
    return data || []
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`Error fetching category: ${error.message}`)
    return data
  }

  async create(data: CreateCategoryData): Promise<CategoryEntity> {
    const client = await this.getClient()
    const { data: result, error } = await client
      .from('categories')
      .insert({
        name: data.name,
        direction: data.direction,
        icon_key: data.icon_key || null,
        user_id: data.user_id || null,
        parent_id: data.parent_id || null,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(`Error creating category: ${error.message}`)
    return result
  }

  async update(id: string, updates: Partial<Omit<CategoryEntity, 'id' | 'created_at'>>): Promise<CategoryEntity> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating category: ${error.message}`)
    return data
  }

  async delete(id: string): Promise<void> {
    const client = await this.getClient()
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting category: ${error.message}`)
  }

  async findByNameAndDirectionForUser(
    userId: string,
    name: string,
    direction: 'gasto' | 'ingreso'
  ): Promise<CategoryEntity | null> {
    const client = await this.getClient()
    const normalizedName = name.trim()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('direction', direction)
      .ilike('name', normalizedName)
      .eq('is_active', true)
      .order('user_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Error finding category by name: ${error.message}`)
    return data
  }

  async findUserOwnedCategories(userId: string): Promise<CategoryEntity[]> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(`Error fetching user owned categories: ${error.message}`)
    return data || []
  }

  async deleteUserOwnedCategory(id: string, userId: string): Promise<void> {
    const client = await this.getClient()
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`Error deleting user category: ${error.message}`)
  }

  async updateUserOwnedCategory(
    userId: string,
    categoryId: string,
    patch: { name?: string; icon_key?: string | null }
  ): Promise<CategoryEntity> {
    const client = await this.getClient()
    const { data, error } = await client
      .from('categories')
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.icon_key !== undefined ? { icon_key: patch.icon_key } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`Error updating user category: ${error.message}`)
    return data
  }

  async existsByName(name: string, userId: string, excludeId?: string): Promise<boolean> {
    const client = await this.getClient()
    let query = client
      .from('categories')
      .select('id')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .ilike('name', name.trim())

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query
    if (error) throw new Error(`Error checking category existence: ${error.message}`)
    return (data || []).length > 0
  }

  async existsByNameAndDirection(
    name: string,
    userId: string,
    direction: 'gasto' | 'ingreso',
    excludeId?: string
  ): Promise<boolean> {
    const client = await this.getClient()
    let query = client
      .from('categories')
      .select('id')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('direction', direction)
      .ilike('name', name.trim())

    if (excludeId) query = query.neq('id', excludeId)

    const { data, error } = await query
    if (error) throw new Error(`Error checking category existence by type: ${error.message}`)
    return (data || []).length > 0
  }
}

export const categoryRepository = new CategoryRepository()