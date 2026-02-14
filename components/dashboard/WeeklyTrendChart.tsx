'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

interface WeeklyData {
  week: string
  amount: number
  date: string
}

interface WeeklyTrendChartProps {
  weeklyData: WeeklyData[]
  onWeekClick?: (week: string) => void
}

export const WeeklyTrendChart = ({ weeklyData, onWeekClick }: WeeklyTrendChartProps) => {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? resolvedTheme === 'dark' : true // evita flicker

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const average = useMemo(() => {
    return weeklyData.length > 0
      ? weeklyData.reduce((sum, item) => sum + item.amount, 0) / weeklyData.length
      : 0
  }, [weeklyData])

  const getTrend = () => {
    if (weeklyData.length < 2) return { direction: 'stable' as const, percentage: 0 }

    const thisWeek = weeklyData[weeklyData.length - 1]?.amount || 0
    const lastWeek = weeklyData[weeklyData.length - 2]?.amount || 0

    if (lastWeek === 0) return { direction: 'stable' as const, percentage: 0 }

    const percentage = ((thisWeek - lastWeek) / lastWeek) * 100
    if (Math.abs(percentage) < 5) return { direction: 'stable' as const, percentage: 0 }

    return {
      direction: percentage > 0 ? ('up' as const) : ('down' as const),
      percentage: Math.abs(percentage)
    }
  }

  const trend = getTrend()

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-red-500" />
      case 'down':
        return <TrendingDown className="h-5 w-5 text-green-500" />
      default:
        return <Minus className="h-5 w-5 text-slate-700 dark:text-white/70" />
    }
  }

  const getTrendMessage = () => {
    switch (trend.direction) {
      case 'up':
        return `Gastos aumentaron ${trend.percentage.toFixed(1)}%`
      case 'down':
        return `Gastos disminuyeron ${trend.percentage.toFixed(1)}%`
      default:
        return 'Gastos estables'
    }
  }

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-red-500'
      case 'down':
        return 'text-green-500'
      default:
        return 'text-slate-700 dark:text-white/70'
    }
  }

  // Colores del chart (dark se mantiene EXACTO)
  const chartTheme = useMemo(() => {
    if (isDark) {
      return {
        grid: 'rgba(255,255,255,0.1)',
        axis: 'rgba(255,255,255,0.7)',
        avgLine: 'rgba(255,255,255,0.5)',
        avgLabel: 'rgba(255,255,255,0.7)',
        line: '#9DFAD7',
        dotFill: '#9DFAD7',
        activeDotFill: '#0D1D35'
      }
    }
    // Light: ejes/grilla más visibles en blanco + texto negro (requisito)
    return {
      grid: 'rgba(15, 23, 42, 0.12)',   // slate-900/12
      axis: 'rgba(15, 23, 42, 0.70)',   // slate-900/70
      avgLine: 'rgba(15, 23, 42, 0.35)',
      avgLabel: 'rgba(15, 23, 42, 0.65)',
      line: '#0EA5A4',                  // teal visible en light
      dotFill: '#0EA5A4',
      activeDotFill: '#ffffff'
    }
  }, [isDark])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const weekData = weeklyData.find((w) => w.week === label)

      return (
        <div
          className="
            rounded-lg p-3 shadow-lg
            bg-card border border-border text-card-foreground
            dark:bg-[#0D1D35] dark:border-white/20
          "
        >
          <p className="font-medium text-slate-900 dark:text-white">{label}</p>
          <p className="font-semibold text-slate-900 dark:text-[#9DFAD7]">
            {formatCurrency(data.value)}
          </p>
          {weekData && (
            <p className="text-sm text-slate-700 dark:text-white/70">{weekData.date}</p>
          )}
        </div>
      )
    }
    return null
  }

  if (weeklyData.length === 0) {
    return (
      <div
        className="
          rounded-lg p-6 h-full flex items-center justify-center
          bg-card border border-border
          dark:bg-white/10 dark:backdrop-blur-sm dark:border-white/20
        "
      >
        <div className="text-center">
          <p className="text-slate-900 dark:text-white/70">No hay datos suficientes</p>
          <p className="text-sm text-slate-700 dark:text-white/50 mt-1">
            Las tendencias aparecerán con más transacciones
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="
        rounded-lg p-6 h-full
        bg-card border border-border text-card-foreground
        dark:bg-white/10 dark:backdrop-blur-sm dark:border-white/20
      "
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tendencia semanal</h3>
          <p className="text-sm text-slate-700 dark:text-white/70">Últimas 4 semanas</p>
        </div>

        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>{getTrendMessage()}</span>
        </div>
      </div>

      <div className="h-[77%]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={weeklyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="week" stroke={chartTheme.axis} fontSize={12} />
            <YAxis
              stroke={chartTheme.axis}
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />

            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke={chartTheme.avgLine}
                strokeDasharray="5 5"
                label={{
                  value: 'Promedio',
                  position: 'insideTopRight',
                  style: { fontSize: '12px', fill: chartTheme.avgLabel }
                }}
              />
            )}


            <Line
              type="monotone"
              dataKey="amount"
              stroke={chartTheme.line}
              strokeWidth={3}
              dot={{
                fill: chartTheme.dotFill,
                strokeWidth: 2,
                r: 6,
                cursor: 'pointer',
                onClick: (e: any) => {
                  if (e?.payload?.week) onWeekClick?.(e.payload.week)
                }
              }}
              activeDot={{
                r: 8,
                stroke: chartTheme.line,
                strokeWidth: 2,
                fill: chartTheme.activeDotFill,
                cursor: 'pointer'
              }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-slate-700 dark:text-white/70">
          Promedio semanal: {formatCurrency(average)}
        </p>
      </div>
    </div>
  )
}
