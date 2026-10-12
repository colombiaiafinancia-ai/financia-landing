'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, AtSign, Check, CheckCircle2, Clock, Copy, ExternalLink, Link2, Loader2, Lock, MessageCircle, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import { WhatsAppUsernameFields } from '@/components/WhatsAppUsernameFields'
import { Button } from '@/components/ui/button'

export function WhatsAppLinkCard({ onVerified, onContinueWeb }: { onVerified?: () => void; onContinueWeb?: () => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [state, setState] = useState('loading')
  const [hasUsername, setHasUsername] = useState<boolean | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [code, setCode] = useState<{ code: string; url: string; expiresAt: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const hydrated = useRef(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  const notifiedVersion = useRef<number | null>(null)
  const refresh = useCallback(async () => {
    const response = await fetch('/api/whatsapp/link/status', { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setProfile(result.profile); setState(result.state)
    if (!hydrated.current) {
      setHasUsername(result.profile.whatsapp_has_username); setUsername(result.profile.whatsapp_username ?? '')
      hydrated.current = true
    }
    if (result.linked && result.state === 'linked') { setChanging(false); setCode(null) }
  }, [])
  useEffect(() => {
    if (onVerified && state === 'linked' && profile?.whatsapp_verified_at && notifiedVersion.current !== profile.whatsapp_link_version) {
      notifiedVersion.current = profile.whatsapp_link_version; onVerified()
    }
  }, [onVerified, state, profile])
  // La tarjeta está al final del dashboard: solo se consulta la API (una función de Vercel)
  // cuando el usuario llega a verla, no en cada carga de la página.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { setInView(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])
  useEffect(() => {
    if (!inView) return
    refresh().catch(e => { setError(e.message); setState('error') })
  }, [refresh, inView])
  useEffect(() => {
    if (state !== 'waiting' && state !== 'conflict') return
    // Sondeo con espera creciente (3s → 10s) y solo con la pestaña visible;
    // se detiene cuando el código vence en vez de seguir consultando indefinidamente.
    let attempt = 0
    let timer: number | undefined
    let stopped = false
    const expiresAt = code ? Date.parse(code.expiresAt) : NaN
    const schedule = () => {
      if (stopped) return
      const delay = Math.min(3000 + attempt * 1000, 10_000)
      timer = window.setTimeout(tick, delay)
    }
    const tick = () => {
      attempt += 1
      const expired = Number.isFinite(expiresAt) && Date.now() > expiresAt
      if (!document.hidden) refresh().catch(e => setError(e.message))
      if (!expired) schedule()
    }
    const onFocus = () => { if (!document.hidden) refresh().catch(e => setError(e.message)) }
    schedule()
    window.addEventListener('focus', onFocus)
    return () => { stopped = true; window.clearTimeout(timer); window.removeEventListener('focus', onFocus) }
  }, [state, refresh, code])
  const save = async () => {
    const response = await fetch('/api/whatsapp/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasUsername, username }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
  }
  const start = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await save()
      const response = await fetch('/api/whatsapp/link/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const result = await response.json()
      setPassword('')
      if (!response.ok) throw new Error(result.error)
      setCode(result); setState('waiting')
      // An explicit link remains available if the browser blocks automatic opening.
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const linked = !!profile?.whatsapp_verified_at
  const [copied, setCopied] = useState(false)
  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(`VINCULAR ${code.code}`)
      .then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000) })
      .catch(() => setError('Selecciona y copia el código manualmente.'))
  }
  const statusPill = linked && state !== 'waiting'
    ? { label: 'Vinculado', dot: 'bg-emerald-400', cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' }
    : state === 'waiting'
      ? { label: 'Esperando mensaje', dot: 'bg-[#5ce1e6] animate-pulse', cls: 'border-[#5ce1e6]/30 bg-[#5ce1e6]/10 text-[#b9f3f5]' }
      : { label: 'Pendiente', dot: 'bg-amber-400', cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200' }

  return <section ref={sectionRef} id="whatsapp" data-onboarding-target="whatsapp-chat"
    className="w-full rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-6 dark:border-white/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:text-white">

    {/* Encabezado */}
    <div className="mb-5 flex items-start gap-3 sm:mb-6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-[#25D366]/20 sm:h-12 sm:w-12">
        <MessageCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-white sm:text-xl">{linked ? 'Tu WhatsApp en FinancIA' : 'Vincula tu WhatsApp'}</h3>
        <p className="text-xs text-white/70 sm:text-sm">
          {linked ? 'Registra gastos e ingresos escribiéndole al bot.' : 'Conecta tu número una sola vez para usar el bot y recibir recordatorios.'}
        </p>
      </div>
      {state !== 'loading' && state !== 'error' && <span className={`hidden flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${statusPill.cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${statusPill.dot}`} />{statusPill.label}
      </span>}
    </div>

    {state === 'loading' ? <div className="space-y-3" aria-busy="true">
      <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      <div className="h-11 w-48 animate-pulse rounded-xl bg-white/5" />
    </div> : <div className="space-y-5">

      {/* Pasos (solo si aún no está vinculado) */}
      {!linked && <ol className="space-y-3">
        {[
          <>Elige si tienes @usuario de WhatsApp. Si no sabes qué es, elige <strong className="font-semibold text-white">“No tengo @usuario”</strong>.</>,
          <>Toca <strong className="font-semibold text-white">“Vincular mi WhatsApp”</strong>. Se abrirá WhatsApp con un mensaje que empieza por <strong className="font-semibold text-white">VINCULAR</strong>.</>,
          <>Envía ese mensaje <strong className="font-semibold text-white">sin cambiarlo</strong>. Te confirmaremos en el chat cuando quede listo.</>,
        ].map((step, i) => <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/75">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">{i + 1}</span>
          <span className="pt-0.5">{step}</span>
        </li>)}
      </ol>}

      {/* Datos de la vinculación, agrupados como una lista de ajustes */}
      {profile && <dl className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20 text-sm">
        <div className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4">
          <dt className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[13px] text-white/60 sm:text-sm"><Smartphone className="h-4 w-4" />Teléfono de contacto</dt>
          <dd className="shrink-0 font-medium tabular-nums text-white">{profile.phone || 'Sin dato'}</dd>
        </div>
        {linked && <div className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4">
          <dt className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[13px] text-white/60 sm:text-sm"><ShieldCheck className="h-4 w-4 text-emerald-400" />WhatsApp verificado</dt>
          <dd className="shrink-0 font-medium tabular-nums text-white">{profile.whatsapp_phone || 'Identidad privada verificada'}</dd>
        </div>}
        {profile.whatsapp_username_observed && <div className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4">
          <dt className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[13px] text-white/60 sm:text-sm"><AtSign className="h-4 w-4" />Visto en WhatsApp</dt>
          <dd className="min-w-0 truncate font-medium text-white">@{profile.whatsapp_username_observed}</dd>
        </div>}
      </dl>}

      {/* Código de vinculación */}
      {code && state === 'waiting' && <div className="overflow-hidden rounded-xl border border-[#5ce1e6]/25 bg-[#5ce1e6]/[0.06]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#b9f3f5]">Tu mensaje de vinculación</span>
          <span className="flex items-center gap-1 text-xs text-white/55"><Clock className="h-3.5 w-3.5" />
            Vence a las {new Date(code.expiresAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <div className="px-4 py-4">
          <code className="block break-all font-mono text-[13px] leading-relaxed tracking-wide text-white sm:text-sm">VINCULAR {code.code}</code>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 sm:flex-row">
          <Button asChild className="h-10 rounded-xl px-4">
            <a href={code.url} target="_blank" rel="noopener noreferrer"><ExternalLink />Abrir WhatsApp</a>
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={copyCode}>
            {copied ? <><Check className="text-emerald-400" />Copiado</> : <><Copy />Copiar código</>}
          </Button>
        </div>
      </div>}

      {state === 'waiting' && <Callout tone="info" icon={Loader2} spin>
        Falta un paso: envía en WhatsApp el mensaje que empieza por <strong className="font-semibold">VINCULAR</strong>, sin cambiarlo. Esta página se actualizará sola.
      </Callout>}
      <form onSubmit={start} className="space-y-5">
        <WhatsAppUsernameFields hasUsername={hasUsername} username={username} onChoice={setHasUsername} onUsername={setUsername} disabled={busy} />

        {linked && !changing ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" disabled={busy} className="h-11 rounded-xl px-5" onClick={async () => {
            setBusy(true); setError(''); try { await save(); setNotice('Datos guardados. Tu vinculación sigue vigente.') } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
          }}>
            {busy ? <Loader2 className="animate-spin" /> : <Check />}Guardar @usuario
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl px-5">
            <a href="https://wa.me/573227031301" target="_blank" rel="noopener noreferrer"><MessageCircle />Abrir chat</a>
          </Button>
          <Button type="button" variant="ghost" className="h-11 rounded-xl px-5 text-white/70" onClick={() => setChanging(true)}>
            <RefreshCw />Cambiar WhatsApp
          </Button>
        </div> : <div className="space-y-4">
          {linked && <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white">Confirma tu contraseña para cambiar WhatsApp</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña de FinancIA"
                className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#5ce1e6]/60 focus:ring-2 focus:ring-[#5ce1e6]/25" />
            </span>
          </label>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={busy || state === 'error'} variant={code && state === 'waiting' ? 'outline' : 'default'} className="h-11 rounded-xl px-5">
              {busy ? <Loader2 className="animate-spin" /> : code || state === 'expired' ? <RefreshCw /> : <Link2 />}
              {busy ? 'Preparando…' : code || state === 'expired' ? 'Generar otro código' : 'Vincular mi WhatsApp'}
            </Button>
            {linked && <Button type="button" variant="ghost" className="h-11 rounded-xl px-5 text-white/70"
              onClick={() => { setChanging(false); setPassword(''); setError('') }}>Cancelar</Button>}
          </div>
        </div>}
      </form>

      {/* Estados */}
      {state === 'expired' && <Callout tone="warn" icon={Clock}>El código venció. Toca “Generar otro código” y envíalo en WhatsApp.</Callout>}
      {state === 'conflict' && <Callout tone="warn" icon={AlertTriangle} role="alert">
        Este WhatsApp ya está conectado a otra cuenta de FinancIA, así que no cambiamos nada. Revisa que hayas iniciado sesión con la cuenta correcta.
      </Callout>}

      {!linked && <button className="text-sm text-white/55 underline-offset-4 transition hover:text-white hover:underline" type="button" onClick={onContinueWeb}>
        Continuar en la web; vinculación pendiente
      </button>}
    </div>}

    {notice && <div className="mt-4"><Callout tone="success" icon={CheckCircle2}>{notice}</Callout></div>}
    {error && <div className="mt-4"><Callout tone="warn" icon={AlertTriangle} role="alert">
      <span>{error}</span>{' '}
      <button className="font-medium underline underline-offset-4" onClick={() => refresh().then(() => setError('')).catch(e => setError(e.message))}>Reintentar</button>
    </Callout></div>}
  </section>
}

const calloutTones = {
  info: 'border-[#5ce1e6]/25 bg-[#5ce1e6]/[0.08] text-[#d6f7f8]',
  warn: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-100',
  success: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-100',
}
function Callout({ tone, icon: Icon, spin = false, role = 'status', children }: {
  tone: keyof typeof calloutTones; icon: React.ComponentType<{ className?: string }>; spin?: boolean; role?: string; children: React.ReactNode
}) {
  return <div role={role} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${calloutTones[tone]}`}>
    <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${spin ? 'animate-spin' : ''}`} />
    <div className="min-w-0">{children}</div>
  </div>
}
