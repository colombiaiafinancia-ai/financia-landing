'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryGlyph } from './CategoryGlyph'

export type CategorySelectItem = {
  id: string
  nombre: string
  iconKey: string | null
}

interface CategorySelectWithIconsProps {
  id: string
  categories: CategorySelectItem[]
  value: string
  onChange: (categoryId: string) => void
  disabled?: boolean
  placeholder?: string
}

export function CategorySelectWithIcons({
  id,
  categories,
  value,
  onChange,
  disabled,
  placeholder = 'Selecciona una categoría',
}: CategorySelectWithIconsProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDocMouseDown)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = categories.find((c) => c.id === value)

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 sm:py-3 text-sm sm:text-base outline-none',
          'bg-background text-foreground border-border focus:ring-2 focus:ring-primary',
          'dark:bg-white/10 dark:text-white dark:border-white/20',
          disabled && 'opacity-60'
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected ? (
            <>
              <CategoryGlyph
                iconKey={selected.iconKey}
                className="text-foreground dark:text-white/90"
              />
              <span className="truncate">{selected.nombre}</span>
            </>
          ) : (
            <span className="truncate text-muted-foreground dark:text-white/50">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform dark:text-white/60',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && !disabled && (
        <ul
          className={cn(
            'absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border py-1 shadow-md',
            'border-border bg-popover text-popover-foreground',
            'dark:border-white/20 dark:bg-[#0D1D35] dark:text-white'
          )}
          role="listbox"
        >
          {categories.map((cat) => (
            <li key={cat.id} role="option" aria-selected={cat.id === value}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm',
                  'hover:bg-muted dark:hover:bg-white/10'
                )}
                onClick={() => {
                  onChange(cat.id)
                  setOpen(false)
                }}
              >
                <CategoryGlyph
                  iconKey={cat.iconKey}
                  className="text-foreground dark:text-white/85"
                />
                <span className="truncate">{cat.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
