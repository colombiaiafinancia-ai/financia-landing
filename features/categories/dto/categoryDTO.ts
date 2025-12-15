/**
 * DTOs para Categories Feature
 * 
 * Define los contratos de datos que la UI debe usar.
 * La UI NUNCA debe acceder a entidades de Supabase directamente.
 */

/**
 * DTO principal para categorías
 */
export interface CategoryDTO {
  readonly id: string
  readonly nombre: string
  readonly tipo: 'Gasto' | 'Ingreso'
}

/**
 * DTO para estadísticas de categorías
 */
export interface CategoryStatsDTO {
  readonly total: number
  readonly gastos: number
  readonly ingresos: number
  readonly porcentajeGastos: number
  readonly porcentajeIngresos: number
}

/**
 * DTO para filtros de categorías
 */
export interface CategoryFiltersDTO {
  readonly type?: 'Gasto' | 'Ingreso'
  readonly searchTerm?: string
  readonly sortBy?: 'name'
  readonly sortOrder?: 'asc' | 'desc'
}

/**
 * DTO para creación de categorías
 */
export interface CreateCategoryDTO {
  readonly nombre: string
  readonly tipo: 'Gasto' | 'Ingreso'
}

/**
 * DTO para actualización de categorías
 */
export interface UpdateCategoryDTO {
  readonly nombre?: string
  readonly tipo?: 'Gasto' | 'Ingreso'
}

/**
 * DTO para categorías agrupadas por tipo
 */
export interface CategoriesByTypeDTO {
  readonly gastos: readonly CategoryDTO[]
  readonly ingresos: readonly CategoryDTO[]
}

/**
 * Mappers para convertir entre domain models y DTOs
 */
export class CategoryDTOMapper {
  /**
   * Convierte del modelo de dominio a DTO
   */
  static toDTO(category: {
    id: string
    nombre: string
    tipo: 'Gasto' | 'Ingreso'
  }): CategoryDTO {
    return {
      id: category.id,
      nombre: category.nombre,
      tipo: category.tipo
    }
  }
  
  /**
   * Convierte múltiples categorías a DTOs
   */
  static toDTOs(categories: Array<{
    id: string
    nombre: string
    tipo: 'Gasto' | 'Ingreso'
  }>): readonly CategoryDTO[] {
    return categories.map(this.toDTO)
  }
  
  /**
   * Convierte estadísticas a DTO
   */
  static statsToDTO(stats: {
    total: number
    gastos: number
    ingresos: number
    porcentajeGastos: number
    porcentajeIngresos: number
  }): CategoryStatsDTO {
    return {
      total: stats.total,
      gastos: stats.gastos,
      ingresos: stats.ingresos,
      porcentajeGastos: Math.round(stats.porcentajeGastos * 100) / 100,
      porcentajeIngresos: Math.round(stats.porcentajeIngresos * 100) / 100
    }
  }
  
  /**
   * Convierte categorías agrupadas a DTO
   */
  static groupedToDTO(grouped: {
    gastos: Array<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso' }>
    ingresos: Array<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso' }>
  }): CategoriesByTypeDTO {
    return {
      gastos: this.toDTOs(grouped.gastos),
      ingresos: this.toDTOs(grouped.ingresos)
    }
  }
}
