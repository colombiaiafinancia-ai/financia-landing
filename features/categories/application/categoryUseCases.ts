import { categoryRepository, CategoryEntity, CreateCategoryData } from '../infrastructure/categoryRepository'
import { transactionRepository } from '@/features/transactions/infrastructure/transactionRepository'
import { categoryBudgetRepository } from '@/features/budgets/infrastructure/categoryBudgetRepository'
import { validateCategoryName, validateCategoryType, type Category } from '../domain/categoryLogic'
import { DEFAULT_CATEGORY_ICON_KEY, isValidCategoryIconKey } from '../domain/categoryIcons'

export interface CategoryFilters {
  type?: 'Gasto' | 'Ingreso'  // la UI usa mayúsculas y tilde
  searchTerm?: string
}

export interface CategoryCreationData {
  nombre: string
  tipo: 'Gasto' | 'Ingreso'  // UI espera así
  userId?: string
  iconKey?: string | null
}

export interface CategoryDTO {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
  iconKey: string | null
  isUserOwned: boolean
}

export class CategoryUseCases {
  private mapEntityToDTO(entity: CategoryEntity): CategoryDTO {
    return {
      id: entity.id,
      nombre: entity.name,
      tipo: entity.direction === 'gasto' ? 'Gasto' : 'Ingreso',
      iconKey: entity.icon_key,
      isUserOwned: !!entity.user_id,
    }
  }

  async getCategoriesForUser(userId: string, filters?: CategoryFilters): Promise<CategoryDTO[]> {
    let categories = await categoryRepository.findAllForUser(userId)

    if (filters?.type) {
      const direction = filters.type === 'Gasto' ? 'gasto' : 'ingreso'
      categories = categories.filter(c => c.direction === direction)
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      categories = categories.filter(c => c.name.toLowerCase().includes(term))
    }

    return categories.map(this.mapEntityToDTO)
  }

  async getCategoriesByType(userId: string): Promise<{ gastos: CategoryDTO[]; ingresos: CategoryDTO[] }> {
    const [gastos, ingresos] = await Promise.all([
      categoryRepository.findByDirection(userId, 'gasto'),
      categoryRepository.findByDirection(userId, 'ingreso')
    ])
    return {
      gastos: gastos.map(this.mapEntityToDTO),
      ingresos: ingresos.map(this.mapEntityToDTO)
    }
  }

  async createCategory(data: CategoryCreationData): Promise<CategoryDTO> {
    const nameValidation = validateCategoryName(data.nombre)
    if (!nameValidation.isValid) {
      throw new Error(`Nombre inválido: ${nameValidation.errors.join(', ')}`)
    }

    if (!validateCategoryType(data.tipo)) {
      throw new Error('Tipo de categoría inválido')
    }

    const direction = data.tipo === 'Gasto' ? 'gasto' : 'ingreso'
    const exists = await categoryRepository.existsByNameAndDirection(data.nombre, data.userId || '', direction)
    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre')
    }

    const createData: CreateCategoryData = {
      name: data.nombre.trim(),
      direction,
      user_id: data.userId || null,
      icon_key: isValidCategoryIconKey(data.iconKey) ? data.iconKey : DEFAULT_CATEGORY_ICON_KEY,
    }
    const entity = await categoryRepository.create(createData)
    return this.mapEntityToDTO(entity)
  }

  async getOrCreateCategory(
    userId: string,
    data: { nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey?: string | null }
  ): Promise<CategoryDTO> {
    const direction = data.tipo === 'Gasto' ? 'gasto' : 'ingreso'
    const existing = await categoryRepository.findByNameAndDirectionForUser(
      userId,
      data.nombre,
      direction
    )
    if (existing) return this.mapEntityToDTO(existing)

    return this.createCategory({
      nombre: data.nombre,
      tipo: data.tipo,
      userId,
      iconKey: data.iconKey,
    })
  }

  async getUserOwnedCategories(userId: string): Promise<CategoryDTO[]> {
    const categories = await categoryRepository.findUserOwnedCategories(userId)
    return categories.map(this.mapEntityToDTO)
  }

  async deleteUserOwnedCategory(userId: string, categoryId: string): Promise<void> {
    const entity = await categoryRepository.findById(categoryId)
    if (!entity || entity.user_id !== userId) {
      throw new Error('No puedes eliminar esta categoría')
    }

    const otros = await categoryRepository.findByNameAndDirectionForUser(userId, 'Otros', entity.direction)
    if (!otros) {
      throw new Error(
        'No se encontró la categoría predeterminada «Otros» para este tipo. No se puede completar la eliminación.'
      )
    }
    if (otros.id === categoryId) {
      throw new Error('No puedes eliminar la categoría «Otros».')
    }

    await transactionRepository.reassignCategoryForUser(userId, categoryId, otros.id)
    await categoryBudgetRepository.mergeBudgetsFromCategoryToCategory(userId, categoryId, otros.id)
    await categoryRepository.deleteUserOwnedCategory(categoryId, userId)
  }

  async updateUserOwnedCategory(
    userId: string,
    categoryId: string,
    data: { nombre?: string; iconKey?: string | null }
  ): Promise<CategoryDTO> {
    const entity = await categoryRepository.findById(categoryId)
    if (!entity || entity.user_id !== userId) {
      throw new Error('No puedes editar esta categoría')
    }

    if (data.nombre !== undefined) {
      const nameValidation = validateCategoryName(data.nombre)
      if (!nameValidation.isValid) {
        throw new Error(`Nombre inválido: ${nameValidation.errors.join(', ')}`)
      }
      const exists = await categoryRepository.existsByNameAndDirection(
        data.nombre,
        userId,
        entity.direction,
        categoryId
      )
      if (exists) {
        throw new Error('Ya existe una categoría con ese nombre')
      }
    }

    const icon_key =
      data.iconKey !== undefined
        ? isValidCategoryIconKey(data.iconKey)
          ? data.iconKey
          : DEFAULT_CATEGORY_ICON_KEY
        : undefined

    const updated = await categoryRepository.updateUserOwnedCategory(userId, categoryId, {
      ...(data.nombre !== undefined ? { name: data.nombre.trim() } : {}),
      ...(icon_key !== undefined ? { icon_key } : {}),
    })
    return this.mapEntityToDTO(updated)
  }
}

export const categoryUseCases = new CategoryUseCases()