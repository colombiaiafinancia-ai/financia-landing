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

type CategoryType = 'Gasto' | 'Ingreso'

type CategoryRow = {
  id: string
  nombre: string
  tipo: CategoryType
  iconKey: string | null
}

function TypePill({ tipo }: { tipo: CategoryType }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
        tipo === 'Gasto'
          ? 'bg-amber-600/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
          : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
      )}
    >
      {tipo}
    </span>
  )
}

function DefaultCategoryCard({ c }: { c: CategoryRow }) {
  return (
    <div
      className={cn(
        'flex min-h-[2.75rem] items-center gap-2 rounded-lg border px-2.5 py-2',
        'text-foreground transition-colors',
        c.tipo === 'Gasto'
          ? 'border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/15 dark:border-amber-500/25 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
          : 'border-emerald-600/25 bg-emerald-600/10 hover:bg-emerald-600/15 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15',
        'dark:text-white'
      )}
      role="listitem"
      title={c.nombre}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          c.tipo === 'Gasto'
            ? 'bg-amber-600/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
            : 'bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
        )}
      >
        <CategoryGlyph iconKey={c.iconKey} className="h-3.5 w-3.5" />
      </div>
      <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight">
        {c.nombre}
      </span>
    </div>
  )
}

function OwnedCategoryCard({
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
        'group flex min-h-[3.25rem] items-center gap-2 rounded-lg border px-2.5 py-2',
        'text-foreground transition-colors',
        c.tipo === 'Gasto'
          ? 'border-amber-600/35 bg-amber-600/10 hover:bg-amber-600/15 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
          : 'border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/15 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15',
        'dark:text-white'
      )}
      role="listitem"
      title={c.nombre}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          c.tipo === 'Gasto'
            ? 'bg-amber-600/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
            : 'bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
        )}
      >
        <CategoryGlyph iconKey={c.iconKey} className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium leading-tight">
          {c.nombre}
        </span>
        <div className="mt-1">
          <TypePill tipo={c.tipo} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary dark:text-white/50 dark:hover:text-[#5ce1e6]"
          title="Editar"
          aria-label={`Editar ${c.nombre}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive dark:text-white/50 dark:hover:text-red-400"
          title="Eliminar"
          aria-label={`Eliminar ${c.nombre}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function EmptyCategoryState({ type }: { type: CategoryType }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/25 px-3 py-4 text-center dark:border-white/10 dark:bg-white/[0.035]">
      <p className="text-[11px] leading-snug text-muted-foreground dark:text-white/55">
        Aun no tienes categorias personalizadas de {type.toLowerCase()}.
      </p>
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
  const [activeType, setActiveType] = useState<CategoryType>('Gasto')
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
        err instanceof Error ? err.message : 'No se pudo eliminar la categoria.'
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

  const visibleDefaultCategories = useMemo(
    () => defaultCategories.filter((c) => c.tipo === activeType),
    [activeType, defaultCategories]
  )

  const visibleOwnedCategories = useMemo(
    () => sortedOwned.filter((c) => c.tipo === activeType),
    [activeType, sortedOwned]
  )

  const gridClass = 'grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3'

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
          <h3 className="truncate text-xs font-semibold sm:text-sm">Mis categorias</h3>
        </div>
        <Button size="sm" className="h-8 shrink-0 px-2 text-xs sm:px-3" onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Crear
        </Button>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <p className="text-center text-[11px] text-muted-foreground dark:text-white/60">Cargando...</p>
        ) : (
          <div className="flex max-h-[min(52vh,480px)] flex-col gap-4 overflow-y-auto pr-0.5 scrollbar-thin">
            <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/35 p-1 dark:border-white/10 dark:bg-white/[0.045]">
              {(['Gasto', 'Ingreso'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                    activeType === type && type === 'Gasto'
                      ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-400 dark:text-[#0D1D35]'
                      : activeType === type
                        ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-400 dark:text-[#0D1D35]'
                      : 'text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white'
                  )}
                >
                  {type === 'Gasto' ? 'Gastos' : 'Ingresos'}
                </button>
              ))}
            </div>

            {visibleDefaultCategories.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-white/45">
                    Predeterminadas
                  </p>
                  <span className="text-[10px] text-muted-foreground dark:text-white/40">
                    {visibleDefaultCategories.length}
                  </span>
                </div>
                <div className={gridClass} role="list">
                  {visibleDefaultCategories.map((c) => (
                    <DefaultCategoryCard key={c.id} c={c} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-white/45">
                  Personalizadas
                </p>
                <span className="text-[10px] text-muted-foreground dark:text-white/40">
                  {visibleOwnedCategories.length}
                </span>
              </div>
              {visibleOwnedCategories.length === 0 ? (
                <EmptyCategoryState type={activeType} />
              ) : (
                <div className={gridClass} role="list">
                  {visibleOwnedCategories.map((c) => (
                    <OwnedCategoryCard
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

      <CreateCategoryDialog open={openCreate} onOpenChange={setOpenCreate} defaultType={activeType} />
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
              Eliminar categoria
            </DialogTitle>
          </DialogHeader>

          {categoryPendingDelete && (
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-700 dark:text-white/85">
                Seguro que quieres eliminar la categoria{' '}
                <span className="font-semibold text-foreground dark:text-white">
                  {categoryPendingDelete.nombre}
                </span>
                ? Esta accion no se puede deshacer desde aqui.
              </p>

              <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-white/65">
                Las transacciones que usen esta categoria se moveran automaticamente a la categoria predeterminada{' '}
                <span className="font-medium text-foreground dark:text-white/85">Otros</span>. Si tenias un
                presupuesto asignado a esta categoria, se fusionara con el de Otros.
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
                  Categoria personalizada
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
                    'Eliminando...'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 shrink-0" />
                      Si, eliminar
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
              No se puede eliminar la categoria
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
