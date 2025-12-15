'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export const useBudget = () => {
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const loadBudgetFromSupabase = async (userId: string) => {
    try {
      const supabase = createSupabaseClient()
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const monthStart = new Date(currentYear, currentMonth - 1, 1)
      const monthEnd = new Date(currentYear, currentMonth, 0)

      console.log('🔍 BUDGET - Cargando presupuesto para:', { 
        userId, 
        mes: currentMonth, 
        año: currentYear,
        monthStart: monthStart.toISOString().split('T')[0],
        monthEnd: monthEnd.toISOString().split('T')[0]
      })

      // Buscar presupuestos del mes actual por categoría
      const { data, error } = await supabase
        .from('presupuestos')
        .select('valor, categorias')
        .eq('usuario_id', userId)
        .gte('mes', monthStart.toISOString().split('T')[0])
        .lte('mes', monthEnd.toISOString().split('T')[0])

      if (error) {
        console.error('❌ BUDGET - Error cargando presupuesto:', error)
        // Fallback a localStorage
        const savedBudget = localStorage.getItem(`budget_${userId}`)
        const budgetValue = savedBudget ? parseFloat(savedBudget) : 0
        console.log('📱 BUDGET - Usando localStorage fallback:', budgetValue)
        setTotalBudget(budgetValue)
        return
      }

      if (data && data.length > 0) {
        // Sumar todos los presupuestos del mes (por categoría)
        const totalBudgetValue = data.reduce((sum, budget) => sum + Number(budget.valor), 0)
        console.log('✅ BUDGET - Presupuesto cargado desde Supabase:', totalBudgetValue, 'de', data.length, 'categorías')
        console.log('📊 BUDGET - Detalle por categoría:', data.map(b => `${b.categorias}: $${b.valor}`).join(', '))
        setTotalBudget(totalBudgetValue)
        // Sincronizar con localStorage como respaldo
        localStorage.setItem(`budget_${userId}`, totalBudgetValue.toString())
      } else {
        console.log('📭 BUDGET - No hay presupuesto en Supabase, usando localStorage')
        // No hay presupuesto en Supabase, intentar localStorage
        const savedBudget = localStorage.getItem(`budget_${userId}`)
        const budgetValue = savedBudget ? parseFloat(savedBudget) : 0
        setTotalBudget(budgetValue)
      }
    } catch (error) {
      console.error('💥 BUDGET - Error en catch:', error)
      // Fallback a localStorage en caso de error
      const savedBudget = localStorage.getItem(`budget_${userId}`)
      const budgetValue = savedBudget ? parseFloat(savedBudget) : 0
      setTotalBudget(budgetValue)
    }
  }

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    // Obtener usuario actual con manejo de errores
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        // Filtrar errores de refresh token
        if (!error.message.includes('Invalid Refresh Token')) {
          console.error('Error obteniendo usuario:', error.message)
        }
        setUser(null)
        setTotalBudget(0)
      } else {
        setUser(user)
        if (user) {
          loadBudgetFromSupabase(user.id)
        }
      }
      setLoading(false)
    })

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Filtrar eventos de refresh token inválido
        if (event === 'TOKEN_REFRESHED' && !session) {
          return
        }
        
        setUser(session?.user || null)
        
        if (session?.user) {
          loadBudgetFromSupabase(session.user.id)
        } else {
          setTotalBudget(0)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const saveBudget = async (newBudget: number) => {
    if (!user) return false

    try {
      console.log('💾 BUDGET - Guardando presupuesto:', { userId: user.id, budget: newBudget })
      
      const supabase = createSupabaseClient()
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const monthDate = new Date(currentYear, currentMonth - 1, 1)

      // Primero eliminar presupuestos existentes del mes
      const { error: deleteError } = await supabase
        .from('presupuestos')
        .delete()
        .eq('usuario_id', user.id)
        .gte('mes', monthDate.toISOString().split('T')[0])
        .lte('mes', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0])

      if (deleteError) {
        console.error('❌ BUDGET - Error eliminando presupuestos anteriores:', deleteError)
      }

      // Crear un presupuesto general para el mes
      const { data, error } = await supabase
        .from('presupuestos')
        .insert({
          usuario_id: user.id,
          mes: monthDate.toISOString().split('T')[0],
          categorias: 'General',
          valor: newBudget
        })
        .select()

      if (error) {
        console.error('❌ BUDGET - Error guardando en Supabase:', error)
        // Fallback a localStorage
        console.log('📱 BUDGET - Usando localStorage como fallback')
        localStorage.setItem(`budget_${user.id}`, newBudget.toString())
        setTotalBudget(newBudget)
        return true
      }

      console.log('✅ BUDGET - Presupuesto guardado en Supabase:', data)
      
      // Actualizar estado local
      setTotalBudget(newBudget)
      
      // Sincronizar con localStorage como respaldo
      localStorage.setItem(`budget_${user.id}`, newBudget.toString())
      
      return true
    } catch (error) {
      console.error('💥 BUDGET - Error en catch al guardar:', error)
      
      // Fallback a localStorage
      try {
        localStorage.setItem(`budget_${user.id}`, newBudget.toString())
        setTotalBudget(newBudget)
        return true
      } catch (localError) {
        console.error('Error al guardar en localStorage:', localError)
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