'use client'

import { CATEGORY_ICON_MAP, type CategoryIconKey } from '@/features/categories/domain/categoryIcons'
import { CategoryGlyph } from './CategoryGlyph'
import { cn } from '@/lib/utils'

/**
 * Solo la rejilla. El recuadro con scroll (max-h-40 + borde) va en el modal padre.
 */
export function CategoryIconPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (iconKey: CategoryIconKey) => void
}) {
  const keys = Object.keys(CATEGORY_ICON_MAP) as CategoryIconKey[]

  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {keys.map((key) => {
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
              'border-border bg-background hover:bg-muted/60',
              'dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/10',
              selected && 'border-primary bg-primary/15 text-primary dark:border-primary dark:bg-primary/15'
            )}
            title={key}
          >
            <CategoryGlyph
              iconKey={key}
              className={cn(
                'h-4 w-4',
                selected ? 'text-primary' : 'text-muted-foreground dark:text-white/80'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
