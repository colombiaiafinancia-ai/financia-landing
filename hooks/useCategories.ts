'use client'

import { useCategoriesContext } from '@/contexts/CategoriesContext'

interface UseCategoriesResult {
  gastoCategories: Array<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey: string | null; isUserOwned: boolean }>
  ingresoCategories: Array<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey: string | null; isUserOwned: boolean }>
  userOwnedCategories: Array<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey: string | null; isUserOwned: boolean }>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getOrCreateCategory: (data: {
    nombre: string
    tipo: 'Gasto' | 'Ingreso'
    iconKey?: string | null
  }) => Promise<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey: string | null; isUserOwned: boolean }>
  createUserCategory: (data: {
    nombre: string
    tipo: 'Gasto' | 'Ingreso'
    iconKey?: string | null
  }) => Promise<{ id: string; nombre: string; tipo: 'Gasto' | 'Ingreso'; iconKey: string | null; isUserOwned: boolean }>
  deleteUserCategory: (categoryId: string) => Promise<void>
  updateUserCategory: (
    categoryId: string,
    data: { nombre?: string; iconKey?: string | null }
  ) => Promise<void>
  loadUserOwnedCategories: () => Promise<void>
}

export const useCategories = (): UseCategoriesResult => {
  return useCategoriesContext()
}