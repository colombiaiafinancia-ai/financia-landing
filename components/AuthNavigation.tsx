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
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

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
      <div className='flex items-center space-x-2 md:space-x-3 ml-1 md:ml-2'>
        <div className='w-16 h-8 bg-white/10 rounded animate-pulse'></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className='flex items-center space-x-2 md:space-x-3 ml-1 md:ml-2'>
        <span className='text-white/80 text-xs md:text-sm hidden sm:inline-block'>
          Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}
        </span>
        <Link
          href='/dashboard'
          className='text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base font-medium whitespace-nowrap'
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className='text-white hover:text-red-400 transition-colors text-sm md:text-base whitespace-nowrap'
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className='flex items-center space-x-2 md:space-x-3 ml-1 md:ml-2'>
      <Link
        href='/login'
        className='text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base font-medium whitespace-nowrap'
      >
        Iniciar
      </Link>
      <Link
        href='/register'
        className='bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-1 px-3 md:py-2 md:px-5 rounded-lg hover:opacity-90 transition-all duration-300 text-sm md:text-base shadow-md whitespace-nowrap'
      >
        Registrarse
      </Link>
    </div>
  )
}