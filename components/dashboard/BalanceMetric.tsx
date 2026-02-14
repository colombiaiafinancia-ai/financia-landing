'use client'

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface BalanceMetricProps {
  totalIncome: number
  spentAmount: number
}

export const BalanceMetric = ({ totalIncome, spentAmount }: BalanceMetricProps) => {
  const balance = totalIncome - spentAmount
  const hasTransactions = totalIncome > 0 || spentAmount > 0

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        relative overflow-hidden rounded-2xl p-4 sm:p-6 lg:p-8 

        /* LIGHT */
        bg-card text-card-foreground border border-border

        /* DARK (idéntico a tu versión original) */
        dark:bg-transparent
        dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
        dark:backdrop-blur-lg
        dark:border-white/20
        dark:text-white
      "
    >
      {/* Efectos de fondo */}
      <div
        className="
          pointer-events-none absolute inset-0

          /* LIGHT */
          bg-gradient-to-br from-primary/10 to-transparent

          /* DARK (igual a tu original) */
          dark:from-[#5ce1e6]/10 dark:to-transparent
        "
      />
      <div
        className="
          absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 rounded-full blur-3xl

          /* LIGHT */
          bg-primary/10

          /* DARK (igual a tu original) */
          dark:bg-[#5ce1e6]/5
        "
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="
              w-12 h-12 rounded-xl flex items-center justify-center

              /* LIGHT */
              bg-primary

              /* DARK (igual a tu original) */
              dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1]
            "
          >
            <DollarSign className="h-6 w-6 text-primary-foreground dark:text-[#0D1D35]" />
          </div>

          <div>
            <h2 className="text-xl font-bold dark:text-white">Balance Mensual</h2>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              Ingresos vs Gastos
            </p>
          </div>
        </div>

        {hasTransactions ? (
          <>
            {/* Balance Principal */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                {balance >= 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Balance Positivo
                    </span>
                  </>
                ) : (
                  <>
                    {/* 🔁 Rojo -> Amarillo */}
                    <TrendingDown className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Balance Negativo
                    </span>
                  </>
                )}
              </div>

              <p
                className={`text-4xl font-bold ${
                  balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {formatCOP(Math.abs(balance))}
              </p>

              <p className="text-sm mt-1 text-muted-foreground dark:text-white/60">
                {balance >= 0 ? 'Tienes un excedente' : 'Tienes un déficit'}
              </p>
            </div>

            {/* Desglose de ingresos y gastos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm mb-1 text-muted-foreground dark:text-white/70">
                  Total Ingresos
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCOP(totalIncome)}
                </p>
              </div>

              {/* 🔁 Rojo -> Amarillo (Gastos) */}
              <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 text-amber-700 dark:text-amber-400" />
                <p className="text-sm mb-1 text-muted-foreground dark:text-white/70">
                  Total Gastos
                </p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {formatCOP(spentAmount)}
                </p>
              </div>
            </div>

            {/* Mensaje motivacional */}
            <div className="mt-6 flex justify-center">
              <div
                className={`
                  px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2
                  border

                  ${
                    balance >= 0
                      ? `
                        /* LIGHT */
                        bg-green-600/15 
                        text-green-700 
                        border-green-600/40

                        /* DARK */
                        dark:bg-green-500/10 
                        dark:text-green-400 
                        dark:border-green-500/30
                      `
                      : `
                        /* LIGHT */
                        bg-amber-600/15 
                        text-amber-800 
                        border-amber-600/40

                        /* DARK */
                        dark:bg-amber-500/10 
                        dark:text-amber-400 
                        dark:border-amber-500/30
                      `
                  }
                `}
              >
                <span className="leading-none">{balance >= 0 ? '🎉' : '💡'}</span>
                <span>
                  {balance >= 0
                    ? '¡Excelente! Estás ahorrando dinero este mes'
                    : 'Considera revisar tus gastos para mejorar tu balance'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/20 dark:bg-[#5ce1e6]/20">
              <DollarSign className="h-8 w-8 text-primary dark:text-[#5ce1e6]" />
            </div>
            <h3 className="text-xl font-semibold dark:text-white mb-2">
              ¡Comienza a registrar tus finanzas!
            </h3>
            <p className="text-sm max-w-md mx-auto text-muted-foreground dark:text-white/70">
              Agrega tus primeros ingresos y gastos para ver tu balance mensual aquí.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
