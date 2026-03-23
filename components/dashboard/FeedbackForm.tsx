'use client'

import { useState } from 'react'
import { MessageCircle, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/utils/supabase/client'

interface FeedbackFormProps {
  userId?: string
  userEmail?: string
  userName?: string
}

export function FeedbackForm({ userId, userEmail, userName }: FeedbackFormProps) {
  const [topic, setTopic] = useState<'idea' | 'problema' | 'otro'>('idea')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState(userEmail || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const wrapperClass = `
    rounded-2xl p-4 sm:p-6 border
    bg-card text-card-foreground border-border
    dark:bg-transparent
    dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
    dark:backdrop-blur-lg
    dark:border-white/20
    dark:text-white
  `

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      alert('Cuéntanos tu sugerencia o propuesta antes de enviar.')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from('feedback_suggestions').insert({
        user_id: userId || null,
        user_email: contactEmail || null,
        user_name: userName || null,
        topic,
        message: message.trim(),
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error guardando sugerencia', error)
        setErrorMessage(error.message || 'Error desconocido al guardar sugerencia')
        setStatus('error')
        return
      }

      setStatus('success')
      setMessage('')
    } catch (err) {
      console.error('Error inesperado al enviar sugerencia', err)
      const fallback = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMessage(fallback)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={wrapperClass}>
      <div className="mb-4 flex items-start gap-3 sm:mb-6">
        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/15 sm:h-12 sm:w-12 dark:bg-[#5ce1e6]/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6 dark:text-[#5ce1e6]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
            ¿Tienes una idea o sugerencia?
          </h3>
          <p className="mt-1 text-xs text-slate-700 sm:text-sm dark:text-white/70">
            Cuéntanos cómo podemos mejorar FinanciaIA. Leemos todas las propuestas para seguir
            construyendo la plataforma contigo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { value: 'idea', label: 'Nueva idea' },
            { value: 'problema', label: 'Algo no funciona' },
            { value: 'otro', label: 'Otro' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTopic(option.value as typeof topic)}
              className={`
                rounded-lg border px-2 py-2 text-xs transition-all sm:px-3 sm:text-sm
                ${
                  topic === option.value
                    ? 'bg-primary/15 border-primary text-primary dark:bg-[#5ce1e6]/20 dark:border-[#5ce1e6] dark:text-[#5ce1e6]'
                    : 'bg-muted border-border text-slate-700 hover:bg-muted/80 dark:bg-white/5 dark:border-white/15 dark:text-white/70'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-900 sm:text-sm dark:text-white/80">
            Tu sugerencia o comentario *
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Ej: Me gustaría que el dashboard muestre un resumen semanal de mis gastos por categoría..."
            className="
              text-sm sm:text-base
              bg-background border-border text-foreground placeholder:text-slate-400
              dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
              focus-visible:ring-primary
            "
          />
          <p className="text-[11px] text-slate-500 sm:text-xs dark:text-white/50">
            Máx. 1000 caracteres. No compartas información sensible (contraseñas, números de
            tarjeta, etc.).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-900 sm:text-sm dark:text-white/80">
            Correo para contactarte (opcional)
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="
              bg-background border-border text-foreground placeholder:text-slate-400
              dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
              focus-visible:ring-primary
            "
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar sugerencia
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm dark:text-white/60">
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {status === 'success' && <span>¡Gracias! Tu sugerencia se ha enviado correctamente.</span>}
            {status === 'error' && (
              <span>
                Hubo un problema al enviar tu sugerencia: {errorMessage || 'intenta de nuevo más tarde'}.
              </span>
            )}
            {status === 'idle' && (
              <span>Usamos tus ideas para priorizar las próximas mejoras.</span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
