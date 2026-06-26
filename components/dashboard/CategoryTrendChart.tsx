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
import { TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/utils/format'
import type { TransactionDTO } from '@/features/transactions/dto/transactionDTO'
import {
  filterCategoryExpenses,
  buildCategoryDailyTrend,
  buildCategoryWeeklyTrend,
  buildCategoryMonthlyTrend
} from '@/utils/categoryTrend'
import { useCategories } from '@/hooks/useCategories'
import { CategoryGlyph } from './CategoryGlyph'

interface CategoryTrendChartProps {
  categoryName: string
  transactionType?: 'gasto' | 'ingreso'
  transactions: TransactionDTO[]
  onClose: () => void
}

export const CategoryTrendChart = ({
  categoryName,
  transactionType = 'gasto',
  transactions,
  onClose
}: CategoryTrendChartProps) => {
  const [period, setPeriod] = useState<'weekly' | 'daily' | 'monthly'>('weekly')
  const { gastoCategories } = useCategories()
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? resolvedTheme === 'dark' : true

  const categoryIconKey = useMemo(() => {
    const match = gastoCategories.find(
      (c) => c.nombre.trim().toLowerCase() === categoryName.trim().toLowerCase()
    )
    return match?.iconKey ?? null
  }, [gastoCategories, categoryName])

  const periodLabel =
    period === 'weekly'
      ? 'Últimas 4 semanas'
      : period === 'daily'
        ? 'Últimos 7 días'
        : 'Últimos 12 meses'

  const categoryTransactions = useMemo(
    () => filterCategoryExpenses(transactions, categoryName, transactionType),
    [transactions, categoryName, transactionType]
  )

  const weeklyData = useMemo(
    () => buildCategoryWeeklyTrend(categoryTransactions),
    [categoryTransactions]
  )

  const dailyData = useMemo(
    () => buildCategoryDailyTrend(categoryTransactions, 7),
    [categoryTransactions]
  )

  const monthlyData = useMemo(
    () => buildCategoryMonthlyTrend(categoryTransactions, 12),
    [categoryTransactions]
  )

  const data = useMemo(() => {
    switch (period) {
      case 'daily':
        return dailyData.map((d) => {
          const [year, month, day] = d.date.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          return {
            label: date.toLocaleDateString('es-CO', { weekday: 'short' }),
            amount: d.amount,
            fullDate: d.date
          }
        })
      case 'monthly':
        return monthlyData.map((m) => ({
          label: m.month,
          amount: m.amount,
          fullDate: m.month
        }))
      default:
        return weeklyData.map((w) => ({
          label: w.week,
          amount: w.amount,
          fullDate: w.date
        }))
    }
  }, [period, dailyData, monthlyData, weeklyData])

  const average = useMemo(() => {
    return data.length > 0
      ? data.reduce((sum, item) => sum + item.amount, 0) / data.length
      : 0
  }, [data])

  const trend = useMemo(() => {
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
  }, [data])

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
        return `Aumento de ${trend.percentage.toFixed(1)}%`
      case 'down':
        return `Disminución de ${trend.percentage.toFixed(1)}%`
      default:
        return 'Estable'
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

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4 text-card-foreground dark:border-white/20 dark:bg-white/10 dark:backdrop-blur-sm sm:p-6">
      <div className="mb-3 shrink-0 space-y-2 sm:mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/30 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 dark:border-[#9DFAD7]/40 dark:text-[#9DFAD7] dark:hover:bg-[#9DFAD7]/10"
          >
            <ArrowLeft className="h-3 w-3" />
            Balance general
          </button>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/10">
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  period === 'weekly'
                    ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setPeriod('daily')}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  period === 'daily'
                    ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Diario
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  period === 'monthly'
                    ? 'bg-white dark:bg-[#0D1D35] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mensual
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {getTrendIcon()}
              <span className={`text-xs font-medium ${getTrendColor()}`}>{getTrendMessage()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 dark:border-[#9DFAD7]/25 dark:bg-[#9DFAD7]/5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary dark:text-[#9DFAD7]/90">
            Vista por categoría
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/15">
              <CategoryGlyph iconKey={categoryIconKey} className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-tight text-slate-900 break-words dark:text-white sm:text-base">
                {categoryName}
              </h3>
              <p className="text-[11px] leading-tight text-slate-600 dark:text-white/60 sm:text-xs">
                Solo esta categoría · {periodLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
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
                r: 6
              }}
              activeDot={{
                r: 8,
                stroke: chartTheme.line,
                strokeWidth: 2,
                fill: chartTheme.activeDotFill
              }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 shrink-0 text-center">
        <p className="text-xs text-slate-700 dark:text-white/70 sm:text-sm">
          Promedio: {formatCurrency(average)}
        </p>
      </div>
    </div>
  )
}
