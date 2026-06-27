'use client'

import { useEffect, useState } from 'react'
import { Inbox, MessageCircle, RefreshCw, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/utils/supabase/client'

interface FeedbackEntry {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  topic: 'idea' | 'problema' | 'otro'
  message: string
  created_at: string
}

interface FeedbackFormProps {
  userId?: string
  userEmail?: string
  userName?: string
  isSuperUser?: boolean
}

const wrapperClass = `
  rounded-2xl p-4 sm:p-6 border
  bg-card text-card-foreground border-border
  dark:bg-transparent
  dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
  dark:backdrop-blur-lg
  dark:border-white/20
  dark:text-white
`

const topicMeta: Record<string, { label: string; color: string }> = {
  idea: { label: 'Nueva idea', color: 'bg-blue-500/15 text-blue-400' },
  problema: { label: 'Algo no funciona', color: 'bg-red-500/15 text-red-400' },
  otro: { label: 'Otro', color: 'bg-slate-500/15 text-slate-400' },
}

function AdminInbox() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/feedback')
      const data = await res.json()
      if (data.ok) setEntries(data.data)
      else setError(data.error || 'Error cargando sugerencias')
    } catch {
      setError('Error de red al cargar sugerencias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className={wrapperClass}>
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/15 sm:h-12 sm:w-12 dark:bg-[#5ce1e6]/20 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-primary sm:h-6 sm:w-6 dark:text-[#5ce1e6]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
              Sugerencias de usuarios
            </h3>
            <p className="mt-1 text-xs text-slate-700 sm:text-sm dark:text-white/70">
              Comentarios y propuestas enviados por los usuarios.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Recargar"
          className="flex-shrink-0 rounded-lg border border-border bg-muted/40 p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/60 dark:hover:bg-white/[0.1]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary dark:border-[#5ce1e6]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground dark:text-white/30" />
          <p className="text-sm text-muted-foreground dark:text-white/50">
            Aun no hay sugerencias enviadas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const meta = topicMeta[entry.topic] ?? { label: entry.topic, color: 'bg-slate-500/15 text-slate-400' }
            const date = new Date(entry.created_at).toLocaleDateString('es-CO', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })
            const sender = entry.user_name || entry.user_email || 'Usuario anonimo'

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-white/80">
                    {sender}
                  </span>
                  {entry.user_email && entry.user_name && (
                    <span className="text-xs text-muted-foreground dark:text-white/40">
                      ({entry.user_email})
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground dark:text-white/40">
                    {date}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-white/90">
                  {entry.message}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AdminView({ userId, userEmail, userName }: { userId?: string; userEmail?: string; userName?: string }) {
  const [tab, setTab] = useState<'inbox' | 'form'>('inbox')

  return (
    <div>
      <div className="mb-4 flex border-b border-border dark:border-white/15">
        {([
          { key: 'inbox', label: 'Ver sugerencias' },
          { key: 'form', label: 'Enviar sugerencia' },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`mr-6 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#5ce1e6] text-[#5ce1e6]'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'inbox' ? (
        <AdminInbox />
      ) : (
        <FeedbackForm userId={userId} userEmail={userEmail} userName={userName} />
      )}
    </div>
  )
}

export function FeedbackForm({ userId, userEmail, userName, isSuperUser }: FeedbackFormProps) {
  const [topic, setTopic] = useState<'idea' | 'problema' | 'otro'>('idea')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState(userEmail || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (isSuperUser) return <AdminView userId={userId} userEmail={userEmail} userName={userName} />

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
