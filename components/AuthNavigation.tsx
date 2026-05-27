'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/services/supabase'
import { logOut } from '@/actions/auth'
import { User } from '@supabase/supabase-js'

type AuthNavigationProps = {
  variant?: 'dark' | 'light'
}

export const AuthNavigation = ({ variant = 'dark' }: AuthNavigationProps) => {
  const isLight = variant === 'light'
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

  const linkClass = isLight
    ? 'text-slate-600 hover:text-[#06B6D4] transition-colors text-sm md:text-base font-medium whitespace-nowrap'
    : 'text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base font-medium whitespace-nowrap'

  const greetingClass = isLight
    ? 'text-slate-500 text-xs md:text-sm hidden sm:inline-block'
    : 'text-white/80 text-xs md:text-sm hidden sm:inline-block'

  const logoutClass = isLight
    ? 'text-slate-600 hover:text-red-500 transition-colors text-sm md:text-base whitespace-nowrap'
    : 'text-white hover:text-red-400 transition-colors text-sm md:text-base whitespace-nowrap'

  const registerClass = isLight
    ? 'bg-[#06B6D4] text-[#0d1a2e] font-semibold py-1 px-3 md:py-2 md:px-5 rounded-lg hover:brightness-110 transition-all duration-300 text-sm md:text-base shadow-md whitespace-nowrap'
    : 'bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-1 px-3 md:py-2 md:px-5 rounded-lg hover:opacity-90 transition-all duration-300 text-sm md:text-base shadow-md whitespace-nowrap'

  const skeletonClass = isLight ? 'bg-slate-200' : 'bg-white/10'

  if (isLoading) {
    return (
      <div className='ml-1 flex items-center space-x-2 md:ml-2 md:space-x-3'>
        <div className={`h-8 w-16 animate-pulse rounded ${skeletonClass}`} />
      </div>
    )
  }

  if (user) {
    return (
      <div className='ml-1 flex items-center space-x-2 md:ml-2 md:space-x-3'>
        <span className={greetingClass}>
          Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}
        </span>
        <Link href='/dashboard' className={linkClass}>
          Dashboard
        </Link>
        <button onClick={handleLogout} className={logoutClass}>
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className='ml-1 flex items-center space-x-2 md:ml-2 md:space-x-3'>
      <Link href='/login' className={linkClass}>
        Iniciar
      </Link>
      <Link href='/register' className={registerClass}>
        Registrarse
      </Link>
    </div>
  )
}