'use client'

export function WhatsAppUsernameFields({ hasUsername, username, onChoice, onUsername, disabled = false }: {
  hasUsername: boolean | null; username: string; onChoice: (value: boolean) => void;
  onUsername: (value: string) => void; disabled?: boolean
}) {
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="font-medium">Tu @usuario de WhatsApp</legend>
    <div className="flex flex-wrap gap-4 text-sm">
      <label className="flex items-center gap-2"><input type="radio" name="whatsappHasUsername" value="true" required
        checked={hasUsername === true} onChange={() => onChoice(true)} />Tengo @usuario</label>
      <label className="flex items-center gap-2"><input type="radio" name="whatsappHasUsername" value="false" required
        checked={hasUsername === false} onChange={() => onChoice(false)} />No tengo @usuario</label>
    </div>
    {hasUsername === true && <label className="block text-sm">@usuario
      <input name="whatsappUsername" aria-label="Tu @usuario de WhatsApp" required maxLength={129}
        autoCapitalize="none" autoCorrect="off" placeholder="@tuusuario" value={username}
        onChange={e => onUsername(e.target.value)} className="mt-1 w-full rounded-md border border-current/30 bg-transparent px-3 py-2" />
    </label>}
    {hasUsername === false && <p className="text-sm opacity-85">No hay problema: conectamos WhatsApp con tu número. Si más adelante creas un @usuario, puedes agregarlo aquí.</p>}
    <p className="text-xs opacity-75">El @usuario es un nombre opcional que puedes crear en tu perfil de WhatsApp. Si no lo has creado, elige “No tengo @usuario”.</p>
  </fieldset>
}
