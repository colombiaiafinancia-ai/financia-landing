'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

export type EditableCategory = {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
  iconKey: string | null
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: EditableCategory | null
}) {
  const { updateUserCategory } = useCategories()
  const [name, setName] = useState('')
  const [iconKey, setIconKey] = useState<string | null>(DEFAULT_CATEGORY_ICON_KEY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && category) {
      setName(category.nombre)
      setIconKey(category.iconKey || DEFAULT_CATEGORY_ICON_KEY)
    }
  }, [open, category])

  const submit = async () => {
    if (!category || !name.trim()) return
    try {
      setSaving(true)
      await updateUserCategory(category.id, {
        nombre: name.trim(),
        iconKey,
      })
      onOpenChange(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md border border-border bg-card text-card-foreground',
          'dark:border-white/20 dark:bg-[#0D1D35] dark:text-white'
        )}
      >
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
        </DialogHeader>

        {category && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground dark:text-white/60">
              Tipo: <span className="font-medium text-foreground dark:text-white">{category.tipo}</span>{' '}
              (no se puede cambiar)
            </p>

            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nombre</Label>
              <Input
                id="edit-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="dark:border-white/20 dark:bg-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2.5 scrollbar-thin dark:border-white/15">
                <CategoryIconPicker value={iconKey} onChange={setIconKey} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={saving || !name.trim()}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
