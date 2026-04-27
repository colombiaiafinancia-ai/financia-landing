'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface ExpenseSummaryProps {
  todayExpenses: number
  weekExpenses: number
  monthExpenses: number
  totalExpenses: number
}

export const ExpenseSummary = ({
  todayExpenses,
  weekExpenses,
  monthExpenses,
  totalExpenses
}: ExpenseSummaryProps) => {
  const expenseItems = [
    {
      icon: Clock,
      label: 'Hoy',
      amount: todayExpenses,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: Calendar,
      label: 'Esta Semana',
      amount: weekExpenses,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      icon: TrendingUp,
      label: 'Este Mes',
      amount: monthExpenses,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      icon: DollarSign,
      label: 'Total',
      amount: totalExpenses,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl"
    >
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
        Resumen de Gastos
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {expenseItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${item.bgColor} ${item.borderColor} border rounded-xl p-3 sm:p-4 text-center hover:scale-105 transition-transform duration-200`}
          >
            <item.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${item.color} mx-auto mb-2 sm:mb-3`} />
            <p className="text-white/70 text-xs sm:text-sm mb-1 sm:mb-2 font-medium">
              {item.label}
            </p>
            <p 
              className={`text-sm sm:text-lg lg:text-xl font-bold ${item.color} break-words`}
              title={formatCurrency(item.amount)}
            >
              {formatCurrency(item.amount, { compact: true })}
            </p>
          </motion.div>
        ))}
      </div>
      
      {/* Mensaje informativo */}
      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-white/60 text-xs sm:text-sm">
          💡 Mantente al día con tus gastos para un mejor control financiero
        </p>
      </div>
    </motion.div>
  )
}
