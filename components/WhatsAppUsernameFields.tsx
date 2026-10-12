'use client'

import { AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const segmentClass = (active: boolean) => cn(
  'relative flex-1 cursor-pointer select-none whitespace-nowrap rounded-lg px-2 py-2 text-center text-[13px] font-medium transition-all sm:px-3 sm:text-sm',
  'focus-within:ring-2 focus-within:ring-[#5ce1e6]/60',
  active
    ? 'bg-white/15 text-white shadow-sm shadow-black/20'
    : 'text-white/60 hover:text-white/85'
)

export function WhatsAppUsernameFields({ hasUsername, username, onChoice, onUsername, disabled = false }: {
  hasUsername: boolean | null; username: string; onChoice: (value: boolean) => void;
  onUsername: (value: string) => void; disabled?: boolean
}) {
  return <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
    <legend className="mb-2 text-sm font-semibold text-white">Tu @usuario de WhatsApp</legend>

    {/* Control segmentado: los radios siguen siendo nativos (accesibles y validables) */}
    <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1" role="radiogroup" aria-label="¿Tienes @usuario de WhatsApp?">
      <label className={segmentClass(hasUsername === true)}>
        <input type="radio" name="whatsappHasUsername" value="true" required className="sr-only"
          checked={hasUsername === true} onChange={() => onChoice(true)} />
        Tengo @usuario
      </label>
      <label className={segmentClass(hasUsername === false)}>
        <input type="radio" name="whatsappHasUsername" value="false" required className="sr-only"
          checked={hasUsername === false} onChange={() => onChoice(false)} />
        No tengo @usuario
      </label>
    </div>

    {hasUsername === true && <label className="block">
      <span className="sr-only">@usuario</span>
      <span className="relative block">
        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input name="whatsappUsername" aria-label="Tu @usuario de WhatsApp" required maxLength={129}
          autoCapitalize="none" autoCorrect="off" placeholder="tuusuario" value={username}
          onChange={e => onUsername(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#5ce1e6]/60 focus:ring-2 focus:ring-[#5ce1e6]/25" />
      </span>
    </label>}

    {hasUsername === false && <p className="text-sm leading-relaxed text-white/75">
      No hay problema: conectamos WhatsApp con tu número. Si más adelante creas un @usuario, puedes agregarlo aquí.
    </p>}
    <p className="text-xs leading-relaxed text-white/45">
      El @usuario es un nombre opcional que puedes crear en tu perfil de WhatsApp. Si no lo has creado, elige “No tengo @usuario”.
    </p>
  </fieldset>
}
