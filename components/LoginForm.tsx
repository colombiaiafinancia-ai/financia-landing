'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logIn } from '@/actions/auth'

export const LoginForm = () => {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await logIn(formData)
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Redirigir al dashboard después del login exitoso
        router.push('/dashboard')
        router.refresh() // Forzar actualización para que el middleware detecte la sesión
      }
    } catch (error) {
      setError('Error inesperado. Intenta nuevamente')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {error && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        <div className='space-y-4'>
          <div>
            <label 
              htmlFor='email' 
              className='block text-white font-medium mb-2'
            >
              Email
            </label>
            <input
              type='email'
              id='email'
              name='email'
              required
              disabled={isLoading}
              className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#9DFAD7] transition-colors'
              placeholder='tu@email.com'
            />
          </div>

          <div>
            <label 
              htmlFor='password' 
              className='block text-white font-medium mb-2'
            >
              Contraseña
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                required
                disabled={isLoading}
                className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#9DFAD7] transition-colors pr-12'
                placeholder='Tu contraseña'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors'
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <label className='flex items-center'>
            <input
              type='checkbox'
              className='w-4 h-4 text-[#9DFAD7] bg-white/5 border-white/10 rounded focus:ring-[#9DFAD7] focus:ring-2'
            />
            <span className='ml-2 text-white/80 text-sm'>Recordarme</span>
          </label>
          <Link
            href='/forgot-password'
            className='text-[#9DFAD7] hover:text-[#D4FFB5] text-sm font-medium transition-colors'
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#9DFAD7]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  )
} 