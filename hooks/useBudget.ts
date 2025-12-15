'use client'

import { useState, useEffect } from 'react'
import { CategoryBudgetService } from '@/features/budgets'
import { getCurrentUser } from '@/services/supabase'
import { User } from '@supabase/supabase-js'

/**
 * Hook refactorizado para presupuesto general - Solo maneja UI state
 * 
 * La lógica de negocio y acceso a datos se delegó a CategoryBudgetService
 */
export const useBudget = () => {
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const loadBudgetFromSupabase = async (userId: string) => {
    try {
      console.log('💰 HOOK - Loading budget for user:', userId)
      
      // ✅ Usar caso de uso en lugar de lógica directa
      const budgetTotal = await CategoryBudgetService.loadFromSupabase(userId)
      
      console.log('✅ HOOK - Budget loaded:', budgetTotal)
      setTotalBudget(budgetTotal)
      
      // Sincronizar con localStorage como respaldo
      localStorage.setItem(`budget_${userId}`, budgetTotal.toString())
    } catch (error) {
      console.error('❌ HOOK - Error loading budget:', error)
      
      // Fallback a localStorage
      const savedBudget = localStorage.getItem(`budget_${userId}`)
      const budgetValue = savedBudget ? parseFloat(savedBudget) : 0
      console.log('📱 HOOK - Using localStorage fallback:', budgetValue)
      setTotalBudget(budgetValue)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const loadUser = async () => {
      try {
        // ✅ Usar cliente centralizado
        const currentUser = await getCurrentUser()
        
        if (mounted) {
          if (currentUser) {
            setUser(currentUser)
            await loadBudgetFromSupabase(currentUser.id)
          } else {
            setUser(null)
            setTotalBudget(0)
          }
        }
      } catch (error) {
        console.error('❌ HOOK - Error getting user:', error)
        if (mounted) {
          setUser(null)
          setTotalBudget(0)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadUser()
    
    return () => {
      mounted = false
    }
  }, [])

  const saveBudget = async (newBudget: number) => {
    if (!user) return false

    try {
      console.log('💰 HOOK - Saving budget:', { userId: user.id, budget: newBudget })
      
      // ✅ Usar caso de uso en lugar de lógica directa
      const success = await CategoryBudgetService.saveGeneral(user.id, newBudget)
      
      if (success) {
        console.log('✅ HOOK - Budget saved successfully')
        
        // Actualizar estado local
        setTotalBudget(newBudget)
        
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
        setTotalBudget(newBudget)
        return true
      } catch (localError) {
        console.error('❌ HOOK - Error saving to localStorage:', localError)
        return false
      }
    }
  }

  return {
    totalBudget,
    loading,
    error: null,
    saveBudget,
    user,
    refetch: () => user ? loadBudgetFromSupabase(user.id) : Promise.resolve()
  }
}