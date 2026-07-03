'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useCategories } from '@/hooks/useCategories'
import { CategoryGlyph } from './CategoryGlyph'
import { formatCurrency } from '@/utils/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CategoryData {
  name: string
  value: number
  percentage: number
  intensity: number
  heatLevel: number
}

interface CategoryChartProps {
  expensesByCategory: Record<string, number>
  variant?: 'gasto' | 'ingreso'
  selectedCategory?: string | null
  onCategoryClick?: (category: string) => void
}

export const CategoryChart = ({
  expensesByCategory,
  variant = 'gasto',
  selectedCategory = null,
  onCategoryClick,
}: CategoryChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)
  const { gastoCategories, ingresoCategories } = useCategories()

  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? resolvedTheme === 'dark' : true // evita flicker

  const { totalAmount, categoryData } = useMemo(() => {
    const entries = Object.entries(expensesByCategory).filter(([, value]) => value > 0)
    const total = entries.reduce((sum, [, value]) => sum + value, 0)
    const values = entries.map(([, v]) => v)
    const max = Math.max(...values, 1)
    const sortedEntries = [...entries].sort((a, b) => b[1] - a[1])
    const maxRank = Math.max(sortedEntries.length - 1, 1)
    const data: CategoryData[] = sortedEntries
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        intensity: value / max,
        heatLevel: Math.round((sortedEntries.length === 1 ? 1 : 1 - index / maxRank) * 4)
      }))
    return { totalAmount: total, categoryData: data }
  }, [expensesByCategory])

  const top5 = categoryData.slice(0, 5)
  const top7 = categoryData.slice(0, 7)
  const mobileVisible = categoryData.length > 5 ? categoryData.slice(0, 4) : top5
  const desktopVisible = categoryData.length > 7 ? categoryData.slice(0, 7) : top7

  const iconByCategoryName = useMemo(() => {
    const map = new Map<string, string | null>()
    const categories = variant === 'ingreso' ? ingresoCategories : gastoCategories
    for (const c of categories) {
      map.set(c.nombre.trim().toLowerCase(), c.iconKey ?? null)
    }
    return map
  }, [gastoCategories, ingresoCategories, variant])

  const heatmapColorsDark = [
    'rgba(96, 165, 250, 0.18)',
    'rgba(45, 212, 191, 0.24)',
    'rgba(34, 197, 94, 0.46)',
    'rgba(245, 158, 11, 0.62)',
    'rgba(236, 72, 153, 0.86)'
  ]

  const heatmapColorsLight = [
    'rgb(219, 234, 254)',
    'rgb(204, 251, 241)',
    'rgb(187, 247, 208)',
    'rgb(253, 230, 138)',
    'rgb(244, 114, 182)'
  ]

  const getHeatmapColor = (level: number) => {
    const colors = isDark ? heatmapColorsDark : heatmapColorsLight
    const idx = Math.min(Math.max(Math.round(level), 0), colors.length - 1)
    return colors[idx] || colors[0]
  }

  const getBorderColor = (level: number) => {
    const borderColorsDark = [
      'rgba(96, 165, 250, 0.38)',
      'rgba(45, 212, 191, 0.42)',
      'rgba(34, 197, 94, 0.55)',
      'rgba(245, 158, 11, 0.65)',
      'rgba(236, 72, 153, 0.75)'
    ]
    const borderColorsLight = [
      'rgba(37, 99, 235, 0.25)',
      'rgba(13, 148, 136, 0.25)',
      'rgba(22, 163, 74, 0.30)',
      'rgba(217, 119, 6, 0.32)',
      'rgba(219, 39, 119, 0.38)'
    ]
    const colors = isDark ? borderColorsDark : borderColorsLight
    const idx = Math.min(Math.max(Math.round(level), 0), colors.length - 1)
    return colors[idx] || colors[0]
  }

  const getDotColor = (level: number) => {
    const dotColors = ['#60a5fa', '#2dd4bf', '#22c55e', '#f59e0b', '#ec4899']
    const idx = Math.min(Math.max(Math.round(level), 0), dotColors.length - 1)
    return dotColors[idx] || dotColors[0]
  }

  const textMain = isDark ? 'text-white' : 'text-slate-900'
  const textSub = isDark ? 'text-white/70' : 'text-slate-700'

  if (categoryData.length === 0) {
    return (
      <div
        className="
          rounded-lg p-6 h-[400px] flex items-center justify-center
          bg-card border border-border
          dark:bg-white/10 dark:backdrop-blur-sm dark:border-white/20
        "
      >
        <div className="text-center">
          <p className="text-muted-foreground dark:text-white/70">
            {variant === 'ingreso' ? 'No hay ingresos registrados' : 'No hay gastos registrados'}
          </p>
          <p className="text-sm text-muted-foreground/80 dark:text-white/50 mt-1">
            Los gastos aparecerán aquí cuando registres transacciones
          </p>
        </div>
      </div>
    )
  }

  const HeatCard = (category: CategoryData) => {
    const bg = getHeatmapColor(category.heatLevel)
    const iconKey = iconByCategoryName.get(category.name.trim().toLowerCase()) ?? null
    const isSelected = selectedCategory === category.name

    return (
      <div
        key={category.name}
        className={`
          relative overflow-hidden rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform
          ${hoveredCategory === category.name ? 'scale-105 shadow-2xl' : 'hover:scale-102'}
          ${hoveredCategory && hoveredCategory !== category.name ? 'opacity-60' : ''}
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-card dark:ring-[#9DFAD7] dark:ring-offset-[#0D1D35] scale-105 shadow-2xl' : ''}
        `}
        style={{
          backgroundColor: bg,
          borderColor: getBorderColor(category.heatLevel),
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
        onMouseEnter={() => setHoveredCategory(category.name)}
        onMouseLeave={() => setHoveredCategory(null)}
        onClick={() => onCategoryClick?.(category.name)}
      >
        {/* Indicador de intensidad */}
        <div className="absolute top-2 right-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getDotColor(category.heatLevel) }}
          />
        </div>

        {/* Icono */}
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <div
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
              ${isDark ? (category.intensity > 0.6 ? 'bg-white/20' : 'bg-white/10') : 'bg-white/35'}
            `}
          >
            <CategoryGlyph
              iconKey={iconKey}
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${textMain}`}
            />
          </div>
        </div>

        {/* Información */}
        <div className="text-center">
          <h4 className={`text-xs sm:text-sm font-semibold mb-1 truncate ${textMain}`}>
            {category.name}
          </h4>
          <p className={`text-xs sm:text-sm font-bold ${textMain}`}>
            {formatCurrency(category.value)}
          </p>
          <p className={`text-xs ${textSub}`}>{category.percentage.toFixed(1)}%</p>
        </div>

        {/* Barra inferior */}
        <div className={`absolute bottom-0 left-0 w-full h-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
          <div
            className={`${isDark ? 'bg-white/50' : 'bg-black/30'} h-full transition-all duration-300`}
            style={{ width: `${category.intensity * 100}%` }}
          />
        </div>
      </div>
    )
  }

  const ViewAllCard = ({ hiddenCount }: { hiddenCount: number }) => (
    <button
      type="button"
      onClick={() => setShowAllModal(true)}
      className="
        relative flex min-h-[116px] flex-col items-center justify-center rounded-xl border border-border bg-muted p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted/80
        dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10
        sm:min-h-[140px] sm:p-4
      "
    >
      <span className="text-sm font-semibold text-foreground dark:text-white">
        Ver todas
      </span>
      <span className="mt-1 text-xs text-muted-foreground dark:text-white/70">
        +{hiddenCount} categorias
      </span>
    </button>
  )

  return (
    <div
      className="
        rounded-lg p-4 sm:p-6
        bg-card border border-border text-card-foreground
        dark:bg-white/10 dark:backdrop-blur-sm dark:border-white/20
      "
    >
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-white">
          {variant === 'ingreso' ? 'Mapa de Calor por Ingresos' : 'Mapa de Calor por Gastos'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70">
          Total: {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Grid móvil/tablet */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:hidden">
        {mobileVisible.map(HeatCard)}
        {categoryData.length > mobileVisible.length && (
          <ViewAllCard hiddenCount={categoryData.length - mobileVisible.length} />
        )}
      </div>

      {/* Grid desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 hidden lg:grid">
        {desktopVisible.map(HeatCard)}
        {categoryData.length > desktopVisible.length && (
          <ViewAllCard hiddenCount={categoryData.length - desktopVisible.length} />
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-white/70">
          <span>{variant === 'ingreso' ? 'Menor ingreso' : 'Menor gasto'}</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className="w-4 h-2 rounded-sm" style={{ backgroundColor: getHeatmapColor(level) }} />
            ))}
          </div>
          <span>{variant === 'ingreso' ? 'Mayor ingreso' : 'Mayor gasto'}</span>
        </div>
      </div>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-lg border border-border bg-card text-card-foreground dark:border-white/20 dark:bg-[#0D1D35] dark:text-white">
          <DialogHeader>
            <DialogTitle>
              {variant === 'ingreso' ? 'Todas las categorias de ingresos' : 'Todas las categorias de gastos'}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {categoryData.map((category) => {
              const iconKey = iconByCategoryName.get(category.name.trim().toLowerCase()) ?? null
              const isSelected = selectedCategory === category.name

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    onCategoryClick?.(category.name)
                    setShowAllModal(false)
                  }}
                  className={`
                    flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition hover:bg-muted
                    dark:hover:bg-white/10
                    ${isSelected ? 'border-primary bg-primary/10 dark:border-[#9DFAD7] dark:bg-[#9DFAD7]/10' : 'border-border bg-background dark:border-white/10 dark:bg-white/5'}
                  `}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted dark:bg-white/10">
                      <CategoryGlyph
                        iconKey={iconKey}
                        className="h-4 w-4 text-foreground dark:text-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground dark:text-white">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-white/70">
                        {category.percentage.toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-foreground dark:text-white">
                    {formatCurrency(category.value)}
                  </p>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
