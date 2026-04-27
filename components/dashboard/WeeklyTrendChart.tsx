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
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { formatCurrency } from '@/utils/format'

interface WeeklyData {
  week: string
  amount: number
  date: string
}

interface DailyData {
  date: string
  amount: number
}

interface MonthlyData {
  month: string
  amount: number
}

interface WeeklyTrendChartProps {
  weeklyData: WeeklyData[]
  dailyData?: DailyData[]
  monthlyData?: MonthlyData[]
  loadingTrend?: 'daily' | 'monthly' | null
  onFetchDaily?: () => void
  onFetchMonthly?: () => void
  onWeekClick?: (week: string) => void
  onDayClick?: (date: string) => void
  onMonthClick?: (month: string) => void
}

export const WeeklyTrendChart = ({ 
  weeklyData, 
  dailyData = [], 
  monthlyData = [], 
  loadingTrend,
  onFetchDaily,
  onFetchMonthly,
  onWeekClick, 
  onDayClick, 
  onMonthClick 
}: WeeklyTrendChartProps) => {
  const [period, setPeriod] = useState<'weekly' | 'daily' | 'monthly'>('weekly')
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? resolvedTheme === 'dark' : true

  useEffect(() => {
    if (period === 'daily' && dailyData.length === 0 && onFetchDaily) {
      onFetchDaily()
    }
    if (period === 'monthly' && monthlyData.length === 0 && onFetchMonthly) {
      onFetchMonthly()
    }
  }, [period, dailyData.length, monthlyData.length, onFetchDaily, onFetchMonthly])

  const getData = () => {
    switch (period) {
      case 'daily':
        return dailyData.map(d => {
          // Parsear la fecha como local para evitar desplazamiento por zona horaria
          const [year, month, day] = d.date.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          return {
            label: date.toLocaleDateString('es-CO', { weekday: 'short' }),
            amount: d.amount,
            fullDate: d.date
          }
        })
      case 'monthly':
        return monthlyData.map(m => ({ 
          label: m.month, 
          amount: m.amount,
          fullDate: m.month 
        }))
      default:
        return weeklyData.map(w => ({ 
          label: w.week, 
          amount: w.amount,
          fullDate: w.date 
        }))
    }
  }

  const data = getData()
  const isLoading = (period === 'daily' && loadingTrend === 'daily') || (period === 'monthly' && loadingTrend === 'monthly')

  const average = useMemo(() => {
    return data.length > 0
      ? data.reduce((sum, item) => sum + item.amount, 0) / data.length
      : 0
  }, [data])

  const getTrend = () => {
    if (data.length < 2) return { direction: 'stable' as const, percentage: 0 }
    const thisValue = data[data.length - 1]?.amount || 0
    const lastValue = data[data.length - 2]?.amount || 0
    if (lastValue === 0) return { direction: 'stable' as const, percentage: 0 }
    const percentage = ((thisValue - lastValue) / lastValue) * 100
    if (Math.abs(percentage) < 5) return { direction: 'stable' as const, percentage: 0 }
    return {
      direction: percentage > 0 ? ('up' as const) : ('down' as const),
      percentage: Math.abs(percentage)
    }
  }

  const trend = getTrend()

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up': return <TrendingUp className="h-5 w-5 text-red-500" />
      case 'down': return <TrendingDown className="h-5 w-5 text-green-500" />
      default: return <Minus className="h-5 w-5 text-slate-700 dark:text-white/70" />
    }
  }

  const getTrendMessage = () => {
    switch (trend.direction) {
      case 'up': return `Aumento de ${trend.percentage.toFixed(1)}%`
      case 'down': return `Disminución de ${trend.percentage.toFixed(1)}%`
      default: return 'Estable'
    }
  }

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up': return 'text-red-500'
      case 'down': return 'text-green-500'
      default: return 'text-slate-700 dark:text-white/70'
    }
  }

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
    return {
      grid: 'rgba(15, 23, 42, 0.12)',
      axis: 'rgba(15, 23, 42, 0.70)',
      avgLine: 'rgba(15, 23, 42, 0.35)',
      avgLabel: 'rgba(15, 23, 42, 0.65)',
      line: '#0EA5A4',
      dotFill: '#0EA5A4',
      activeDotFill: '#ffffff'
    }
  }, [isDark])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg p-3 shadow-lg bg-card border border-border text-card-foreground dark:bg-[#0D1D35] dark:border-white/20">
          <p className="font-medium text-slate-900 dark:text-white">{label}</p>
          <p className="font-semibold text-slate-900 dark:text-[#9DFAD7]">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const handleClick = (item: any) => {
    if (period === 'weekly' && onWeekClick) onWeekClick(item.fullDate)
    else if (period === 'daily' && onDayClick) onDayClick(item.fullDate)
    else if (period === 'monthly' && onMonthClick) onMonthClick(item.fullDate)
  }

  return (
    <div className="rounded-lg p-6 h-full bg-card border border-border text-card-foreground dark:bg-white/10 dark:backdrop-blur-sm dark:border-white/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tendencia de Gastos</h3>
          <p className="text-sm text-slate-700 dark:text-white/70">
            {period === 'weekly' && 'Últimas 4 semanas'}
            {period === 'daily' && 'Últimos 7 días'}
            {period === 'monthly' && 'Últimos 12 meses'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'weekly' 
                ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'daily' 
                ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === 'monthly' 
                ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mensual
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-white/50" />
          ) : (
            <>
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>{getTrendMessage()}</span>
            </>
          )}
        </div>
      </div>

      <div className="h-[70%]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary dark:text-[#5ce1e6]" />
              <p className="text-sm text-slate-500 dark:text-white/50">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.length ? data : [{ label: 'Sin datos', amount: 0 }]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={12} />
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
                  onClick: (e: any) => e?.payload && handleClick(e.payload)
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
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-slate-700 dark:text-white/70">
          {isLoading ? 'Calculando promedio...' : `Promedio: ${formatCurrency(average)}`}
        </p>
      </div>
    </div>
  )
}
