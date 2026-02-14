'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = theme === 'system' ? systemTheme : theme
  const isDark = current === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        px-3 py-2 rounded-lg text-sm sm:text-base
        border border-border bg-card text-foreground
        hover:bg-muted transition-colors
      "
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
