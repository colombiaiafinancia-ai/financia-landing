'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/actions/auth'
import { getBrowserSupabaseClient } from '@/services/supabase'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const router = useRouter()

  // Procesar el token del enlace: Supabase PKCE envía token_hash en query (?token_hash=...&type=recovery).
  // El formato antiguo usa hash (#access_token=...) que getSession() detecta automáticamente.
useEffect(() => {
  const supabase = getBrowserSupabaseClient()

  async function init() {
    try {
      const params = new URLSearchParams(window.location.search)

      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      // CASO 1: PKCE flow
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error
      }

      // CASO 2: token_hash flow (TU CASO)
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })

        if (error) throw error
      }

      // ahora verificar sesión
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No session')
      }

      setSessionReady(true)

      window.history.replaceState({}, '', '/reset-password')

    } catch (err) {
      console.error(err)
      setVerificationError(
        'Enlace inválido o expirado. Solicita uno nuevo.'
      )
    }
  }

  init()
}, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await resetPassword(formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
        const supabase = getBrowserSupabaseClient()
        await supabase.auth.signOut()
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToLogin = async () => {
    const supabase = getBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[#0D1D35] flex flex-col">
      <nav className="sticky top-0 z-50 bg-[#0D1D35]/95 backdrop-blur-sm border-b border-white/10 container mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-white hover:text-[#9DFAD7] transition-colors">
          Finanzas Consulting - FinancIA
        </Link>
        <button
          type="button"
          onClick={handleGoToLogin}
          className="text-white hover:text-[#9DFAD7] transition-colors text-sm md:text-base bg-transparent border-none cursor-pointer"
        >
          Iniciar sesión
        </button>
      </nav>

      <section className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nueva contraseña
            </h1>
            <p className="text-white/80 text-base md:text-lg">
              Elige una contraseña nueva y confírmala.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8">
            {verificationError ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-red-400">{verificationError}</p>
                <Link
                  href="/forgot-password"
                  className="inline-block text-[#9DFAD7] hover:text-[#D4FFB5] font-medium underline"
                >
                  Solicitar nuevo enlace
                </Link>
              </div>
            ) : !sessionReady ? (
              <div className="text-center py-8 text-white/80">
                Verificando enlace...
              </div>
            ) : (
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
                <label htmlFor="password" className="block text-white font-medium mb-2">
                  Contraseña nueva
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#9DFAD7] transition-colors pr-12"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-white font-medium mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#9DFAD7] transition-colors pr-12"
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#9DFAD7]/20"
              >
                {isLoading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-[#9DFAD7] hover:text-[#D4FFB5] text-sm font-medium transition-colors bg-transparent border-none cursor-pointer underline"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
