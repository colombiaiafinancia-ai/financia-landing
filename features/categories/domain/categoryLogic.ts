/**
 * DOMAIN LAYER - Categories
 * 
 * Contiene lógica de negocio pura relacionada con categorías.
 * No conoce Supabase ni infraestructura.
 */

export interface Category {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
}

export type CategoryType = 'Gasto' | 'Ingreso'

/**
 * Valida si un nombre de categoría es válido
 */
export function validateCategoryName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push('El nombre de la categoría es requerido')
  }
  
  if (name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres')
  }
  
  if (name.trim().length > 50) {
    errors.push('El nombre no puede exceder 50 caracteres')
  }
  
  // Validar caracteres especiales
  const validNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-_0-9]+$/
  if (!validNameRegex.test(name.trim())) {
    errors.push('El nombre solo puede contener letras, números, espacios, guiones y guiones bajos')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida si un tipo de categoría es válido
 */
export function validateCategoryType(type: string): type is CategoryType {
  return type === 'Gasto' || type === 'Ingreso'
}

/**
 * Filtra categorías por tipo
 */
export function filterCategoriesByType(categories: Category[], type: CategoryType): Category[] {
  return categories.filter(category => category.tipo === type)
}

/**
 * Ordena categorías por nombre alfabéticamente
 */
export function sortCategoriesByName(categories: Category[], ascending: boolean = true): Category[] {
  return [...categories].sort((a, b) => {
    const comparison = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    return ascending ? comparison : -comparison
  })
}

/**
 * Busca categorías por nombre (búsqueda parcial)
 */
export function searchCategoriesByName(categories: Category[], searchTerm: string): Category[] {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return categories
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim()
  return categories.filter(category => 
    category.nombre.toLowerCase().includes(normalizedSearch)
  )
}

/**
 * Obtiene estadísticas básicas de categorías
 */
export function getCategoryStats(categories: Category[]) {
  const gastoCategories = filterCategoriesByType(categories, 'Gasto')
  const ingresoCategories = filterCategoriesByType(categories, 'Ingreso')
  
  return {
    total: categories.length,
    gastos: gastoCategories.length,
    ingresos: ingresoCategories.length,
    porcentajeGastos: categories.length > 0 ? (gastoCategories.length / categories.length) * 100 : 0,
    porcentajeIngresos: categories.length > 0 ? (ingresoCategories.length / categories.length) * 100 : 0
  }
}

