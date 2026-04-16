'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, Tags, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCategories } from '@/hooks/useCategories'
import { CategoryGlyph } from './CategoryGlyph'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { EditCategoryDialog, type EditableCategory } from './EditCategoryDialog'
import { cn } from '@/lib/utils'

type CategoryRow = {
  id: string
  nombre: string
  tipo: 'Gasto' | 'Ingreso'
  iconKey: string | null
}

function CategoryBadge({ tipo }: { tipo: 'Gasto' | 'Ingreso' }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1 py-px text-[9px] font-bold leading-none',
        'bg-muted/90 text-muted-foreground dark:bg-white/15 dark:text-white/75'
      )}
      title={tipo}
    >
      {tipo === 'Gasto' ? 'G' : 'I'}
    </span>
  )
}

function DefaultCategoryChip({ c }: { c: CategoryRow }) {
  return (
    <div
      className={cn(
        'flex min-h-[2rem] items-center gap-1 rounded-md border px-1.5 py-1',
        'border-border/40 bg-muted/10 dark:border-white/[0.08] dark:bg-white/[0.04]'
      )}
    >
      <CategoryGlyph iconKey={c.iconKey} className="h-3 w-3 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[10px] font-medium leading-tight sm:text-[11px]">
        {c.nombre}
      </span>
      <CategoryBadge tipo={c.tipo} />
    </div>
  )
}

function OwnedCategoryChip({
  c,
  onEdit,
  onDelete,
}: {
  c: CategoryRow
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex min-h-[2rem] items-center gap-0.5 rounded-md border px-1 py-0.5',
        'border-border/50 bg-muted/25 dark:border-white/[0.1] dark:bg-white/[0.07]'
      )}
    >
      <CategoryGlyph iconKey={c.iconKey} className="ml-0.5 h-3 w-3 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[10px] font-medium leading-tight sm:text-[11px]">
        {c.nombre}
      </span>
      <CategoryBadge tipo={c.tipo} />
      <div className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-0.5 text-muted-foreground hover:bg-primary/15 hover:text-primary dark:text-white/50 dark:hover:text-[#5ce1e6]"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive dark:text-white/50 dark:hover:text-red-400"
          title="Eliminar"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function MyCategoriesSection() {
  const {
    gastoCategories,
    ingresoCategories,
    userOwnedCategories,
    deleteUserCategory,
    loading,
  } = useCategories()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EditableCategory | null>(null)
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<CategoryRow | null>(null)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const [categoryDeleteBlockedMessage, setCategoryDeleteBlockedMessage] = useState<string | null>(null)

  const confirmDeleteCategory = async () => {
    if (!categoryPendingDelete) return
    setDeletingCategory(true)
    try {
      await deleteUserCategory(categoryPendingDelete.id)
      setCategoryPendingDelete(null)
    } catch (err) {
      setCategoryDeleteBlockedMessage(
        err instanceof Error ? err.message : 'No se pudo eliminar la categoría.'
      )
      setCategoryPendingDelete(null)
    } finally {
      setDeletingCategory(false)
    }
  }

  const defaultCategories = useMemo(() => {
    const byId = new Map<string, (typeof gastoCategories)[0]>()
    for (const c of [...gastoCategories, ...ingresoCategories]) {
      if (!c.isUserOwned) byId.set(c.id, c)
    }
    return [...byId.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    )
  }, [gastoCategories, ingresoCategories])

  const sortedOwned = useMemo(
    () =>
      [...userOwnedCategories].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      ),
    [userOwnedCategories]
  )

  const gridClass =
    'grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 2xl:grid-cols-4'

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col rounded-2xl border border-border bg-card text-card-foreground',
        'dark:border-white/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5',
        'dark:backdrop-blur-lg dark:text-white'
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-3 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Tags className="h-4 w-4 text-primary" />
          </div>
          <h3 className="truncate text-xs font-semibold sm:text-sm">Mis categorías</h3>
        </div>
        <Button size="sm" className="h-8 shrink-0 px-2 text-xs sm:px-3" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Crear
        </Button>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <p className="text-center text-[11px] text-muted-foreground dark:text-white/60">Cargando…</p>
        ) : (
          <div className="flex max-h-[min(52vh,480px)] flex-col gap-3 overflow-y-auto pr-0.5 scrollbar-thin">
            {defaultCategories.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-white/45">
                  Predeterminadas
                </p>
                <div className={gridClass} role="list">
                  {defaultCategories.map((c) => (
                    <DefaultCategoryChip key={c.id} c={c} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-white/45">
                Personalizadas
              </p>
              {sortedOwned.length === 0 ? (
                <p className="text-[10px] leading-snug text-muted-foreground dark:text-white/55">
                  Crea tus propias categorías para organizar mejor tus finanzas.
                </p>
              ) : (
                <div className={gridClass} role="list">
                  {sortedOwned.map((c) => (
                    <OwnedCategoryChip
                      key={c.id}
                      c={c}
                      onEdit={() =>
                        setEditingCategory({
                          id: c.id,
                          nombre: c.nombre,
                          tipo: c.tipo,
                          iconKey: c.iconKey,
                        })
                      }
                      onDelete={() => setCategoryPendingDelete(c)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateCategoryDialog open={openCreate} onOpenChange={setOpenCreate} defaultType="Gasto" />
      <EditCategoryDialog
        open={editingCategory !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null)
        }}
        category={editingCategory}
      />

      <Dialog
        open={categoryPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingCategory) setCategoryPendingDelete(null)
        }}
      >
        <DialogContent
          className={cn(
            'max-w-md border border-border bg-card text-card-foreground',
            'dark:border-white/20 dark:bg-[#0D1D35] dark:text-white'
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-red-600 dark:text-red-400">
              ¿Eliminar categoría?
            </DialogTitle>
          </DialogHeader>

          {categoryPendingDelete && (
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-700 dark:text-white/85">
                ¿Estás seguro de que quieres eliminar la categoría{' '}
                <span className="font-semibold text-foreground dark:text-white">
                  «{categoryPendingDelete.nombre}»
                </span>
                ? Esta acción no se puede deshacer desde aquí.
              </p>

              <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-white/65">
                Las transacciones que usen esta categoría se moverán automáticamente a la categoría predeterminada{' '}
                <span className="font-medium text-foreground dark:text-white/85">«Otros»</span>. Si tenías un
                presupuesto asignado a esta categoría, se fusionará con el de «Otros».
              </p>

              <div
                className={cn(
                  'rounded-xl border p-4 text-center',
                  'border-border bg-muted',
                  'dark:border-white/10 dark:bg-white/[0.06]'
                )}
              >
                <div className="mb-3 flex justify-center">
                  <CategoryGlyph
                    iconKey={categoryPendingDelete.iconKey}
                    className="h-10 w-10 text-amber-500 dark:text-amber-400"
                  />
                </div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-300">
                  {categoryPendingDelete.nombre}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/65">{categoryPendingDelete.tipo}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-white/40">
                  Categoría personalizada
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'flex-1 border-border text-foreground hover:bg-muted',
                    'dark:border-[#5ce1e6]/40 dark:text-white dark:hover:bg-white/10'
                  )}
                  disabled={deletingCategory}
                  onClick={() => setCategoryPendingDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className={cn(
                    'flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90',
                    'dark:bg-[#5ce1e6] dark:text-slate-900 dark:hover:bg-[#4dd4d9]'
                  )}
                  disabled={deletingCategory}
                  onClick={() => void confirmDeleteCategory()}
                >
                  {deletingCategory ? (
                    'Eliminando…'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 shrink-0" />
                      Sí, eliminar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDeleteBlockedMessage !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryDeleteBlockedMessage(null)
        }}
      >
        <DialogContent
          className={cn(
            'max-w-md border border-border bg-card text-card-foreground',
            'dark:border-white/20 dark:bg-[#0D1D35] dark:text-white'
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-red-600 dark:text-red-400">
              No se puede eliminar la categoría
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-center text-sm text-slate-700 dark:text-white/80">
              Para poder borrarla, primero debes liberar los datos que la usan.
            </p>

            <div
              className={cn(
                'rounded-lg border p-4 text-center text-sm leading-relaxed',
                'border-border bg-muted',
                'dark:border-white/10 dark:bg-white/5 dark:text-white/85'
              )}
            >
              {categoryDeleteBlockedMessage}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'flex-1 border-border text-foreground hover:bg-muted',
                  'dark:border-white/20 dark:text-white dark:hover:bg-white/10'
                )}
                onClick={() => setCategoryDeleteBlockedMessage(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className={cn(
                  'flex-1 bg-primary text-primary-foreground hover:bg-primary/90',
                  'dark:bg-[#5ce1e6] dark:text-slate-900 dark:hover:bg-[#4dd4d9]'
                )}
                onClick={() => setCategoryDeleteBlockedMessage(null)}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
