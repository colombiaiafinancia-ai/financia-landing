'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryIconPicker } from './CategoryIconPicker'
import { DEFAULT_CATEGORY_ICON_KEY } from '@/features/categories/domain/categoryIcons'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'

export function CreateCategoryDialog({
  open,
  onOpenChange,
  defaultType,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType: 'Gasto' | 'Ingreso'
  onCreated?: (categoryId: string) => void
}) {
  const { getOrCreateCategory } = useCategories()
  const [name, setName] = useState('')
  const [type, setType] = useState<'Gasto' | 'Ingreso'>(defaultType)
  const [iconKey, setIconKey] = useState<string | null>(DEFAULT_CATEGORY_ICON_KEY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setType(defaultType)
    }
  }, [open, defaultType])

  const submit = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      const category = await getOrCreateCategory({
        nombre: name.trim(),
        tipo: type,
        iconKey,
      })
      onCreated?.(category.id)
      setName('')
      setType(defaultType)
      setIconKey(DEFAULT_CATEGORY_ICON_KEY)
      onOpenChange(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo crear la categoría')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 rounded-2xl border border-white/15 bg-[#0D1D35] p-0 text-white shadow-2xl',
          'dark:bg-[#0D1D35]'
        )}
      >
        <DialogHeader className="space-y-2 border-b border-white/10 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white">
            Nueva categoría
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-white/60">
            Elige si es gasto o ingreso, el nombre y un icono.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <span className="sr-only">Tipo de categoría</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('Gasto')}
                className={cn(
                  'rounded-xl border px-4 py-3.5 text-sm font-medium transition-all',
                  type === 'Gasto'
                    ? 'border-red-500/70 bg-red-950/45 text-red-100 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.35)]'
                    : 'border-white/15 bg-[#071224]/90 text-white/70 hover:border-white/25 hover:bg-[#071224]'
                )}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('Ingreso')}
                className={cn(
                  'rounded-xl border px-4 py-3.5 text-sm font-medium transition-all',
                  type === 'Ingreso'
                    ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]'
                    : 'border-white/15 bg-[#071224]/90 text-white/70 hover:border-white/25 hover:bg-[#071224]'
                )}
              >
                Ingreso
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium text-white">
              Nombre
            </Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Streaming, Freelance..."
              className={cn(
                'h-11 rounded-xl border-white/15 bg-[#071224] text-white placeholder:text-white/40',
                'focus-visible:ring-[#5ce1e6]/50'
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Icono</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-white/15 bg-[#071224]/50 p-2.5 scrollbar-thin">
              <CategoryIconPicker value={iconKey} onChange={setIconKey} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1 rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving || !name.trim()}
            className={cn(
              'flex-1 rounded-xl border-0 font-medium text-[#0D1D35]',
              'bg-[#5ce1e6] hover:bg-[#4dd0e1] disabled:opacity-50'
            )}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
