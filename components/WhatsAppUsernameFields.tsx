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
    {hasUsername === false && <p className="text-sm opacity-85">Puedes vincular WhatsApp con tu número. Cuando tengas un @usuario, actualízalo aquí.</p>}
    <p className="text-xs opacity-75">Tu @usuario nos ayuda a mantener tu perfil actualizado. La vinculación se confirma enviando un código desde WhatsApp.</p>
  </fieldset>
}
