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
  useEffect(() => { refresh().catch(e => { setError(e.message); setState('error') }) }, [refresh])
  useEffect(() => {
    if (state !== 'waiting' && state !== 'conflict') return
    const poll = () => { if (!document.hidden) refresh().catch(e => setError(e.message)) }
    const timer = setInterval(poll, 3000)
    window.addEventListener('focus', poll)
    return () => { clearInterval(timer); window.removeEventListener('focus', poll) }
  }, [state, refresh])
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
  return <section id="whatsapp" className="rounded-xl border border-green-700/40 bg-green-950 p-6 text-white" data-onboarding-target="whatsapp-chat">
    <h3 className="text-xl font-semibold">{linked ? 'Tu WhatsApp en FinancIA' : 'Vincula tu WhatsApp'}</h3>
    <p className="my-2 text-sm text-white/80">{linked ? 'Tu cuenta está vinculada.' : 'Paso obligatorio para usar el bot y los recordatorios. Puedes seguir usando la web mientras lo completas.'}</p>
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
      {state === 'waiting' && <p className="mt-3" role="status">Esperando tu mensaje. Envía el código al bot para completar la vinculación.</p>}
      {state === 'expired' && <p className="mt-3" role="status">El código venció. Genera otro para continuar.</p>}
      {state === 'conflict' && <p className="mt-3" role="alert">Este WhatsApp ya tiene una asociación. No se cambió ninguna cuenta. Revisa la cuenta con la que iniciaste sesión.</p>}
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
