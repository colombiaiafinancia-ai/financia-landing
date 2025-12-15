/**
 * Hook de Presupuesto - Solo UI State
 * 
 * RESPONSABILIDAD: Manejo de estado de UI únicamente
 * - useState para estado local
 * - useEffect para efectos de UI
 * - Llamadas a casos de uso
 * 
 * NO CONTIENE:
 * ❌ Lógica de negocio
 * ❌ Acceso directo a Supabase
 * ❌ Validaciones de dominio
 * ❌ Cálculos complejos
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 2 - Hooks Simplificados
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { BudgetService } from '@/features/budgets'
import { getCurrentUser } from '@/services/supabase'
import { User } from '@supabase/supabase-js'

export const useBudgetNew = () => {
  // Estado de UI únicamente
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Cargar usuario y presupuesto
  const loadUserAndBudget = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener usuario usando nueva infraestructura
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        // Usar caso de uso para cargar presupuesto
        const budget = await BudgetService.loadWithFallback(currentUser.id)
        setTotalBudget(budget)
      }
    } catch (err) {
      console.error('Error loading user and budget:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserAndBudget()
  }, [loadUserAndBudget])

  // Guardar presupuesto
  const saveBudget = useCallback(async (newBudget: number): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado')
      return false
    }

    try {
      setError(null)
      
      // Usar caso de uso para guardar
      const success = await BudgetService.saveGeneral(user.id, newBudget)
      
      if (success) {
        setTotalBudget(newBudget)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error saving budget:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar presupuesto')
      return false
    }
  }, [user])

  // Refrescar datos
  const refetch = useCallback(async () => {
    if (user) {
      try {
        const budget = await BudgetService.loadWithFallback(user.id)
        setTotalBudget(budget)
      } catch (err) {
        console.error('Error refreshing budget:', err)
        setError(err instanceof Error ? err.message : 'Error al refrescar')
      }
    }
  }, [user])

  return {
    totalBudget,
    loading,
    error,
    saveBudget,
    user,
    refetch
  }
}
