'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await requestPasswordReset(formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1D35] flex flex-col">
      <nav className="sticky top-0 z-50 bg-[#0D1D35]/95 backdrop-blur-sm border-b border-white/10 container mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-white hover:text-[#9DFAD7] transition-colors">
          FinancIA
        </Link>
        <Link href="/login" className="text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base">
          Volver al login
        </Link>
      </nav>

      <section className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-white/80 text-base md:text-lg">
              Ingresa tu email y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-white font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#9DFAD7] transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#9DFAD7]/20"
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-[#9DFAD7] hover:text-[#D4FFB5] text-sm font-medium transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
