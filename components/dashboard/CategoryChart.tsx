'use client'

import { useMemo, useState, useEffect } from 'react'
import { TrendingUp, DollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'

interface CategoryData {
  name: string
  value: number
  percentage: number
  intensity: number
}

interface CategoryChartProps {
  expensesByCategory: Record<string, number>
  onCategoryClick?: (category: string) => void
}

export const CategoryChart = ({ expensesByCategory, onCategoryClick }: CategoryChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)

  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? resolvedTheme === 'dark' : true // evita flicker

  const totalAmount = Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0)

  const categoryData: CategoryData[] = useMemo(() => {
    const values = Object.values(expensesByCategory)
    const max = Math.max(...values, 1)

    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
        intensity: value / max
      }))
      .sort((a, b) => b.value - a.value)
  }, [expensesByCategory, totalAmount])

  const hasMoreSm = categoryData.length > 5
  const hasMoreBg = categoryData.length > 8
  const top5 = categoryData.slice(0, 5)
  const top7 = categoryData.slice(0, 7)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)

  // DARK: tu paleta original (idéntica)
  const heatmapColorsDark = [
    'rgba(157, 250, 215, 0.10)',
    'rgba(157, 250, 215, 0.30)',
    'rgba(34, 197, 94, 0.40)',
    'rgba(245, 158, 11, 0.50)',
    'rgba(239, 68, 68, 0.60)',
    'rgba(239, 68, 68, 0.80)',
    'rgba(220, 38, 127, 0.90)'
  ]

  // LIGHT: paleta auxiliar más visible
  const heatmapColorsLight = [
    'rgb(224, 247, 240)', // menta clara
    'rgb(187, 247, 208)', // green-200
    'rgb(134, 239, 172)', // green-300
    'rgb(253, 230, 138)', // amber-200
    'rgb(253, 186, 116)', // orange-300
    'rgb(252, 165, 165)', // red-300
    'rgb(244, 114, 182)'  // pink-400
  ]

  const getHeatmapColor = (intensity: number) => {
    const colors = isDark ? heatmapColorsDark : heatmapColorsLight
    const idx = Math.floor(intensity * (colors.length - 1))
    return colors[idx] || colors[0]
  }

  const getBorderColor = (intensity: number) => {
    if (isDark) {
      if (intensity > 0.8) return 'rgba(220, 38, 127, 0.5)'
      if (intensity > 0.6) return 'rgba(239, 68, 68, 0.4)'
      if (intensity > 0.4) return 'rgba(245, 158, 11, 0.3)'
      if (intensity > 0.2) return 'rgba(34, 197, 94, 0.3)'
      return 'rgba(157, 250, 215, 0.2)'
    }
    // Light: bordes más visibles
    if (intensity > 0.8) return 'rgba(219, 39, 119, 0.35)'
    if (intensity > 0.6) return 'rgba(239, 68, 68, 0.30)'
    if (intensity > 0.4) return 'rgba(245, 158, 11, 0.28)'
    if (intensity > 0.2) return 'rgba(34, 197, 94, 0.25)'
    return 'rgba(2, 132, 199, 0.18)'
  }

  // ✅ Requisito: en LIGHT todo el texto negro
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

  const HeatCard = (category: CategoryData, index: number) => {
    const bg = getHeatmapColor(category.intensity)

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
          borderColor: getBorderColor(category.intensity),
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
            className={`
              w-2 h-2 rounded-full
              ${category.intensity > 0.8 ? 'bg-red-500' :
                category.intensity > 0.6 ? 'bg-orange-500' :
                category.intensity > 0.4 ? 'bg-yellow-500' :
                category.intensity > 0.2 ? 'bg-green-500' : 'bg-blue-400'}
            `}
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
            {index === 0 ? (
              <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${textMain}`} />
            ) : (
              <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${textMain}`} />
            )}
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
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
              <div key={i} className="w-4 h-2 rounded-sm" style={{ backgroundColor: getHeatmapColor(intensity) }} />
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHeatmapColor(category.intensity) }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
