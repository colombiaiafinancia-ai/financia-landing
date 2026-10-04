'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WhatsAppUsernameFields } from '@/components/WhatsAppUsernameFields'

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
  return <section ref={sectionRef} id="whatsapp" className="rounded-xl border border-green-700/40 bg-green-950 p-6 text-white" data-onboarding-target="whatsapp-chat">
    <h3 className="text-xl font-semibold">{linked ? 'Tu WhatsApp en FinancIA' : 'Vincula tu WhatsApp'}</h3>
    <p className="my-2 text-sm text-white/80">{linked ? 'Tu cuenta está vinculada.' : 'Para usar el bot de WhatsApp y recibir recordatorios, conecta tu número. Solo se hace una vez.'}</p>
    {!linked && <ol className="my-3 list-decimal space-y-1 pl-5 text-sm text-white/90">
      <li>Elige si tienes @usuario de WhatsApp. Si no sabes qué es, elige <strong>“No tengo @usuario”</strong>.</li>
      <li>Toca <strong>“Vincular mi WhatsApp”</strong>. Se abrirá WhatsApp con un mensaje que empieza por <strong>VINCULAR</strong>.</li>
      <li>Envía ese mensaje <strong>sin cambiarlo</strong>. Te confirmaremos en el chat cuando quede listo.</li>
    </ol>}
    {state === 'loading' ? <p>Cargando…</p> : <>
      {profile && <div className="my-3 space-y-1 text-sm">
        <p>Teléfono de contacto: {profile.phone || 'Sin dato'}</p>
        {linked && <p>WhatsApp verificado: {profile.whatsapp_phone || 'Identidad privada de WhatsApp verificada'}</p>}
        {profile.whatsapp_username_observed && <p>@ observado en WhatsApp: @{profile.whatsapp_username_observed}</p>}
      </div>}
      <form onSubmit={start} className="space-y-4">
        <WhatsAppUsernameFields hasUsername={hasUsername} username={username} onChoice={setHasUsername} onUsername={setUsername} disabled={busy} />
        {linked && !changing ? <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} className="rounded bg-white px-4 py-2 text-green-950" onClick={async () => {
            setBusy(true); setError(''); try { await save(); setNotice('Datos guardados. Tu vinculación sigue vigente.') } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
          }}>Guardar @usuario</button>
          <button type="button" className="rounded border px-4 py-2" onClick={() => setChanging(true)}>Cambiar WhatsApp</button>
          <a href="https://wa.me/573227031301" target="_blank" rel="noopener noreferrer" className="rounded border px-4 py-2">Abrir chat</a>
        </div> : <>
          {linked && <label className="block text-sm">Confirma tu contraseña para cambiar WhatsApp
            <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded border bg-transparent p-2" />
          </label>}
          <button disabled={busy || state === 'error'} className="rounded bg-white px-4 py-2 font-semibold text-green-950 disabled:opacity-50">
            {busy ? 'Preparando…' : code || state === 'expired' ? 'Generar otro código' : 'Vincular mi WhatsApp'}
          </button>
        </>}
      </form>
      {state === 'waiting' && <p className="mt-3" role="status">Falta un paso: envía en WhatsApp el mensaje que empieza por VINCULAR, sin cambiarlo. Si WhatsApp no se abrió, toca “Abrir WhatsApp con el código”. Esta página se actualizará sola.</p>}
      {state === 'expired' && <p className="mt-3" role="status">El código venció. Toca “Generar otro código” y envíalo en WhatsApp.</p>}
      {state === 'conflict' && <p className="mt-3" role="alert">Este WhatsApp ya está conectado a otra cuenta de FinancIA, así que no cambiamos nada. Revisa que hayas iniciado sesión con la cuenta correcta.</p>}
      {code && state === 'waiting' && <div className="mt-3 space-y-2 break-all">
        <code className="block rounded bg-black/20 p-2 text-sm">VINCULAR {code.code}</code>
        <p className="text-xs">Vence a las {new Date(code.expiresAt).toLocaleTimeString()}. No compartas este código.</p>
        <a href={code.url} target="_blank" rel="noopener noreferrer" className="mr-4 underline">Abrir WhatsApp con el código</a>
        <button type="button" className="underline" onClick={() => navigator.clipboard.writeText(`VINCULAR ${code.code}`).then(() => setNotice('Código copiado.')).catch(() => setError('Selecciona y copia el código manualmente.'))}>Copiar código</button>
      </div>}
      {!linked && <button className="mt-4 text-sm underline" type="button" onClick={onContinueWeb}>Continuar en la web; vinculación pendiente</button>}
    </>}
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    {error && <div role="alert" className="mt-3 text-sm text-amber-200">{error} <button className="underline" onClick={() => refresh().then(() => setError('')).catch(e => setError(e.message))}>Reintentar consulta</button></div>}
  </section>
}
