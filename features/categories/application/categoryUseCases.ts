import { categoryRepository, CategoryEntity, CreateCategoryData } from '../infrastructure/categoryRepository'
import { validateCategoryName, validateCategoryType, type Category } from '../domain/categoryLogic'

export interface CategoryFilters {
  type?: 'Gasto' | 'Ingreso'  // la UI usa mayúsculas y tilde
  searchTerm?: string
}

export interface CategoryCreationData {
  nombre: string
  tipo: 'Gasto' | 'Ingreso'  // UI espera así
  userId?: string
}

export interface CategoryDTO {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
}

export class CategoryUseCases {
  private mapEntityToDTO(entity: CategoryEntity): CategoryDTO {
    return {
      id: entity.id,
      nombre: entity.name,
      tipo: entity.direction === 'gasto' ? 'Gasto' : 'Ingreso'
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

    const exists = await categoryRepository.existsByName(data.nombre, data.userId || '')
    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre')
    }

    const createData: CreateCategoryData = {
      name: data.nombre.trim(),
      direction: data.tipo === 'Gasto' ? 'gasto' : 'ingreso',
      user_id: data.userId || null
    }
    const entity = await categoryRepository.create(createData)
    return this.mapEntityToDTO(entity)
  }

  // Otros métodos (update, delete, etc.) similares...
}

export const categoryUseCases = new CategoryUseCases()