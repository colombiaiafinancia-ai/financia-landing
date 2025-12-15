'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export interface UnifiedTransaction {
  id: string
  usuario_id: string
  valor: number
  categoria: string | null
  tipo: string | null
  descripcion: string | null
  creado_en: string | null
}

export const useTransactionsUnified = () => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  // Obtener usuario autenticado - Solo una vez
  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (mounted) {
          if (error) {
            // Filtrar errores de refresh token
            if (!error.message.includes('Invalid Refresh Token')) {
              console.error('Error getting user:', error.message)
            }
            setUser(null)
          } else {
            setUser(user)
          }
        }
      } catch (err) {
        // Filtrar errores de refresh token
        if (err instanceof Error && !err.message.includes('Invalid Refresh Token')) {
          console.error('Error getting user:', err)
        }
        if (mounted) {
          setUser(null)
        }
      }
    }
    
    getUser()
    
    return () => {
      mounted = false
    }
  }, []) // Sin dependencias para evitar re-ejecuciones

  // Función para cargar transacciones - Memoizada
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📋 TRANSACTION - Cargando transacciones...')
      
      // Verificar autenticación usando getUser() - método seguro
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authenticatedUser) {
        console.log('⚠️ TRANSACTION - Usuario no autenticado, saltando carga')
        setLoading(false)
        setTransactions([])
        return
      }

      console.log('📋 TRANSACTION - Usuario autenticado:', authenticatedUser.id)
      
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('usuario_id', authenticatedUser.id)
        .order('creado_en', { ascending: false })

      if (error) {
        console.error('❌ TRANSACTION - Error fetching transactions:', error)
        setError(`Error al cargar transacciones: ${error.message}`)
        setTransactions([])
      } else {
        console.log('✅ TRANSACTION - Transacciones cargadas:', data?.length || 0)
        setTransactions(data || [])
      }
    } catch (err) {
      console.error('💥 TRANSACTION - Error:', err)
      setError('Error al cargar transacciones')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Cargar transacciones cuando se monte el componente
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Cálculos derivados - Optimizados con useMemo
  const totalSpent = useMemo(() => 
    transactions
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + (t.valor || 0), 0), 
    [transactions]
  )

  const totalIncome = useMemo(() => 
    transactions
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + (t.valor || 0), 0), 
    [transactions]
  )

  // Gastos de hoy
  const todayExpenses = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    
    const todayTransactions = transactions.filter(t => {
      if (!t.creado_en || t.tipo !== 'gasto') return false
      const transactionDate = new Date(t.creado_en)
      return transactionDate >= todayStart && transactionDate <= todayEnd
    })
    
    return todayTransactions.reduce((sum, t) => sum + (t.valor || 0), 0)
  }, [transactions])

  // Gastos de esta semana
  const weekExpenses = useMemo(() => {
    const today = new Date()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate())
    
    return transactions
      .filter(t => {
        if (!t.creado_en || t.tipo !== 'gasto') return false
        const transactionDate = new Date(t.creado_en)
        return transactionDate >= weekStart && transactionDate <= todayEnd
      })
      .reduce((sum, t) => sum + (t.valor || 0), 0)
  }, [transactions])

  // Gastos de este mes
  const monthExpenses = useMemo(() => {
    const today = new Date()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    return transactions
      .filter(t => {
        if (!t.creado_en || t.tipo !== 'gasto') return false
        const transactionDate = new Date(t.creado_en)
        return transactionDate >= firstDayOfMonth && transactionDate <= todayEnd
      })
      .reduce((sum, t) => sum + (t.valor || 0), 0)
  }, [transactions])

  // Gastos por categoría
  const expensesByCategory = useMemo(() => 
    transactions
      .filter(t => t.tipo === 'gasto' && t.categoria)
      .reduce((acc, t) => {
        if (t.categoria) {
          acc[t.categoria] = (acc[t.categoria] || 0) + (t.valor || 0)
        }
        return acc
      }, {} as Record<string, number>), 
    [transactions]
  )

  // Tendencia semanal - Optimizada y sin logs
  const weeklyTrend = useMemo(() => {
    if (transactions.length === 0) {
      return []
    }
    
    const weeks = []
    const today = new Date()
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
      
      const weekTransactions = transactions.filter(t => {
        if (!t.creado_en || t.tipo !== 'gasto') return false
        const transactionDate = new Date(t.creado_en)
        return transactionDate >= weekStart && transactionDate <= weekEnd
      })
      
      const weekTotal = weekTransactions.reduce((sum, t) => sum + (t.valor || 0), 0)
      const weekLabel = i === 0 ? 'Esta semana' : `Hace ${i} semana${i > 1 ? 's' : ''}`
      
      weeks.push({
        amount: weekTotal,
        date: weekStart.toLocaleDateString('es-CO'),
        week: weekLabel
      })
    }
    
    return weeks
  }, [transactions])

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: {
    valor: number
    categoria: string
    tipo: 'gasto' | 'ingreso'
    descripcion?: string
  }) => {
    console.log('💰 TRANSACTION - Creando nueva transacción...')
    
    // Verificar autenticación usando getUser() - método seguro
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authenticatedUser) {
      console.error('❌ TRANSACTION - Error de autenticación:', authError)
      throw new Error('Usuario no autenticado')
    }

    console.log('💰 TRANSACTION - Usuario autenticado:', authenticatedUser.id)

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        usuario_id: authenticatedUser.id,
        valor: transactionData.valor,
        categoria: transactionData.categoria,
        tipo: transactionData.tipo,
        descripcion: transactionData.descripcion || null
      })
      .select()

    if (error) {
      console.error('❌ TRANSACTION - Error creating transaction:', error)
      throw error
    }

    console.log('✅ TRANSACTION - Transacción creada:', data[0])

    // Recargar transacciones después de crear una nueva
    await fetchTransactions()
    return data[0]
  }, [supabase, fetchTransactions])

  // Función para eliminar una transacción
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      console.log('🗑️ TRANSACTION - Eliminando transacción:', transactionId)

      // Verificar autenticación usando getUser() - método seguro
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authenticatedUser) {
        console.error('❌ TRANSACTION - Error de autenticación:', authError)
        return false
      }

      console.log('🗑️ TRANSACTION - Usuario autenticado:', authenticatedUser.id)

      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', transactionId)
        .eq('usuario_id', authenticatedUser.id) // Asegurar que solo elimine sus propias transacciones

      if (error) {
        console.error('❌ TRANSACTION - Error eliminando transacción:', error)
        console.error('❌ TRANSACTION - Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return false
      }

      console.log('✅ TRANSACTION - Transacción eliminada exitosamente')
      // Refrescar datos después de eliminar
      await fetchTransactions()
      return true
    } catch (error) {
      console.error('💥 TRANSACTION - Error inesperado eliminando transacción:', error)
      return false
    }
  }, [supabase, fetchTransactions])

  return {
    transactions,
    loading,
    error,
    totalSpent,
    totalIncome,
    todayExpenses,
    weekExpenses,
    monthExpenses,
    expensesByCategory,
    weeklyTrend,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
    user
  }
}