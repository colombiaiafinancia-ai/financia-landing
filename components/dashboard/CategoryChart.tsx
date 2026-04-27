'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useCategories } from '@/hooks/useCategories'
import { CategoryGlyph } from './CategoryGlyph'
import { formatCurrency } from '@/utils/format'

interface CategoryData {
  name: string
  value: number
  percentage: number
  intensity: number
  heatLevel: number
}

interface CategoryChartProps {
  expensesByCategory: Record<string, number>
  onCategoryClick?: (category: string) => void
}

export const CategoryChart = ({ expensesByCategory, onCategoryClick }: CategoryChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)
  const { gastoCategories } = useCategories()

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

  const hasMoreBg = categoryData.length > 8
  const top5 = categoryData.slice(0, 5)
  const top7 = categoryData.slice(0, 7)

  const iconByCategoryName = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const c of gastoCategories) {
      map.set(c.nombre.trim().toLowerCase(), c.iconKey ?? null)
    }
    return map
  }, [gastoCategories])

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
          <p className="text-muted-foreground dark:text-white/70">No hay gastos registrados</p>
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

    return (
      <div
        key={category.name}
        className={`
          relative overflow-hidden rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform
          ${hoveredCategory === category.name ? 'scale-105 shadow-2xl' : 'hover:scale-102'}
          ${hoveredCategory && hoveredCategory !== category.name ? 'opacity-60' : ''}
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
          Mapa de Calor por Categoría
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70">
          Total: {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Grid móvil/tablet */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:hidden">
        {top5.map(HeatCard)}

        {categoryData.length > 5 && (
          <div
            className="
              relative rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300
              flex flex-col items-center justify-center
              bg-muted hover:bg-muted/80 border border-border
              dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/20
            "
            onClick={() => setShowAllModal(true)}
          >
            <span className="font-semibold text-sm text-foreground dark:text-white">Mostrar todo</span>
            <span className="text-xs mt-1 text-muted-foreground dark:text-white/70">
              +{categoryData.length - 5}
            </span>
          </div>
        )}
      </div>

      {/* Grid desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 hidden lg:grid">
        {top7.map(HeatCard)}

        {hasMoreBg && (
          <div
            className="
              relative rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300
              flex flex-col items-center justify-center
              bg-muted hover:bg-muted/80 border border-border
              dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/20
            "
            onClick={() => setShowAllModal(true)}
          >
            <span className="font-semibold text-sm text-foreground dark:text-white">Mostrar todo</span>
            <span className="text-xs mt-1 text-muted-foreground dark:text-white/70">
              +{categoryData.length - 7}
            </span>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-white/70">
          <span>Menor gasto</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className="w-4 h-2 rounded-sm" style={{ backgroundColor: getHeatmapColor(level) }} />
            ))}
          </div>
          <span>Mayor gasto</span>
        </div>
      </div>

      {/* Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="
              rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-y-auto
              bg-card border border-border text-card-foreground
              dark:bg-[#0D1D35] dark:border-white/20
            "
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-white">Todas las categorías</h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {categoryData.map((category) => (
                <div
                  key={category.name}
                  className="
                    flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                    hover:bg-muted
                    dark:hover:bg-white/10
                  "
                  onClick={() => {
                    onCategoryClick?.(category.name)
                    setShowAllModal(false)
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{category.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-white/70">
                      {formatCurrency(category.value)} ({category.percentage.toFixed(1)}%)
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getDotColor(category.heatLevel) }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
