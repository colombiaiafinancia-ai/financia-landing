'use client'

import { useState, useEffect, useCallback } from 'react'
import { CategoryBudgetService, BudgetDTOMapper, type LegacyBudgetDataDTO } from '@/features/budgets'
import { getCurrentUser } from '@/services/supabase'
import { AsyncState, AsyncStateUtils } from '@/types/asyncState'
import { ErrorHandler } from '@/types/errors'
import { User } from '@supabase/supabase-js'

/**
 * Hook refactorizado para presupuesto general - Usa AsyncState y DTOs
 * 
 * ✅ Solo maneja UI state
 * ✅ Usa DTOs en lugar de valores primitivos
 * ✅ Sigue el contrato AsyncState estándar
 * ✅ Manejo de errores estandarizado
 */
export const useBudget = (): AsyncState<LegacyBudgetDataDTO> & {
  totalBudget: number
  user: User | null
  saveBudget: (newBudget: number) => Promise<boolean>
  // Aliases de compatibilidad
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} => {
  const [state, setState] = useState<AsyncState<LegacyBudgetDataDTO>>(
    AsyncStateUtils.createInitial<LegacyBudgetDataDTO>()
  )
  
  const [user, setUser] = useState<User | null>(null)
  const errorHandler = ErrorHandler

  const loadBudgetData = useCallback(async (userId: string) => {
    try {
      console.log('💰 HOOK - Loading budget for user:', userId)
      
      // ✅ Usar caso de uso en lugar de lógica directa
      const budgetTotal = await CategoryBudgetService.loadFromSupabase(userId)
      
      // ✅ Crear DTO estructurado
      const dto: LegacyBudgetDataDTO = {
        totalBudget: budgetTotal,
        spent: 0, // Se calculará en otro hook
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
      }
      
      console.log('✅ HOOK - Budget loaded:', dto)
      setState(AsyncStateUtils.createWithData(dto, () => loadBudgetData(userId)))
      
      // Sincronizar con localStorage como respaldo
      localStorage.setItem(`budget_${userId}`, budgetTotal.toString())
    } catch (error) {
      console.error('❌ HOOK - Error loading budget:', error)
      
      // Fallback a localStorage
      try {
        const savedBudget = localStorage.getItem(`budget_${userId}`)
        const budgetValue = savedBudget ? parseFloat(savedBudget) : 0
        
        const fallbackDto: LegacyBudgetDataDTO = {
          totalBudget: budgetValue,
          spent: 0,
          month: new Date().toISOString().slice(0, 7)
        }
        
        console.log('📱 HOOK - Using localStorage fallback:', fallbackDto)
        setState(AsyncStateUtils.createWithData(fallbackDto, () => loadBudgetData(userId)))
      } catch (localError) {
        const errorMessage = errorHandler.handle(error, 'budget', { 
          action: 'load', 
          userId,
          fallbackError: localError 
        })
        setState(AsyncStateUtils.createWithError(errorMessage, () => loadBudgetData(userId)))
      }
    }
  }, [errorHandler])

  const loadUser = useCallback(async () => {
    try {
      setState(AsyncStateUtils.createLoading(() => loadUser()))
      
      // ✅ Usar cliente centralizado
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        await loadBudgetData(currentUser.id)
      } else {
        setUser(null)
        const emptyDto: LegacyBudgetDataDTO = {
          totalBudget: 0,
          spent: 0,
          month: new Date().toISOString().slice(0, 7)
        }
        setState(AsyncStateUtils.createWithData(emptyDto, () => loadUser()))
      }
    } catch (error) {
      console.error('❌ HOOK - Error getting user:', error)
      const errorMessage = errorHandler.handle(error, 'budget', { action: 'auth' })
      setState(AsyncStateUtils.createWithError(errorMessage, () => loadUser()))
      setUser(null)
    }
  }, [loadBudgetData, errorHandler])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const saveBudget = useCallback(async (newBudget: number): Promise<boolean> => {
    if (!user) return false

    try {
      console.log('💰 HOOK - Saving budget:', { userId: user.id, budget: newBudget })
      
      // ✅ Usar caso de uso en lugar de lógica directa
      const success = await CategoryBudgetService.saveGeneral(user.id, newBudget)
      
      if (success) {
        console.log('✅ HOOK - Budget saved successfully')
        
        // Actualizar DTO
        const updatedDto: LegacyBudgetDataDTO = {
          totalBudget: newBudget,
          spent: state.data?.spent || 0,
          month: new Date().toISOString().slice(0, 7)
        }
        
        setState(AsyncStateUtils.createWithData(updatedDto, () => loadBudgetData(user.id)))
        
        // Sincronizar con localStorage como respaldo
        localStorage.setItem(`budget_${user.id}`, newBudget.toString())
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ HOOK - Error saving budget:', error)
      
      // Fallback a localStorage
      try {
        localStorage.setItem(`budget_${user.id}`, newBudget.toString())
        
        const fallbackDto: LegacyBudgetDataDTO = {
          totalBudget: newBudget,
          spent: state.data?.spent || 0,
          month: new Date().toISOString().slice(0, 7)
        }
        
        setState(AsyncStateUtils.createWithData(fallbackDto, () => loadBudgetData(user.id)))
        return true
      } catch (localError) {
        errorHandler.handle(error, 'budget', { 
          action: 'save', 
          userId: user.id, 
          amount: newBudget,
          fallbackError: localError 
        })
        return false
      }
    }
  }, [user, state.data, loadBudgetData, errorHandler])

  return {
    ...state,
    totalBudget: state.data?.totalBudget || 0,
    user,
    saveBudget,
    // Aliases de compatibilidad
    loading: state.isLoading,
    error: state.error,
    refetch: state.refetch
  }
}