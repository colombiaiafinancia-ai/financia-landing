'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/services/supabase'
import { logOut } from '@/actions/auth'
import { User } from '@supabase/supabase-js'

export const AuthNavigation = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getBrowserSupabaseClient()
    
    // Obtener el usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center space-x-3 md:space-x-4 ml-2 md:ml-4'>
        <div className='w-20 h-8 bg-white/10 rounded animate-pulse'></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className='flex items-center space-x-3 md:space-x-4 ml-2 md:ml-4'>
        <span className='text-white/80 text-sm md:text-base hidden md:block'>
          Hola, {user.user_metadata?.full_name || 'Usuario'}
        </span>
        <Link
          href='/dashboard'
          className='text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base font-medium'
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className='text-white hover:text-red-400 transition-colors text-sm md:text-base'
        >
          Cerrar Sesión
        </button>
      </div>
    )
  }

  return (
    <div className='flex items-center space-x-3 md:space-x-4 ml-2 md:ml-4'>
      <Link
        href='/login'
        className='text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base font-medium'
      >
        Iniciar Sesión
      </Link>
      <Link
        href='/register'
        className='bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-2 px-4 md:px-6 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#9DFAD7]/20 text-sm md:text-base'
      >
        Registrarse
      </Link>
    </div>
  )
} 