'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/utils/format'

interface BudgetModalProps {
  isOpen: boolean
  currentBudget: number
  onClose: () => void
  onSave: (budget: number) => void
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  currentBudget,
  onClose,
  onSave
}) => {
  const [budgetInput, setBudgetInput] = useState('')
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(currentBudget > 0 ? currentBudget.toString() : '')
    }
  }, [isOpen, currentBudget])

  const handleInputChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '')
    setBudgetInput(numericValue)
    setIsValid(numericValue === '' || parseInt(numericValue) > 0)
  }

  const handleSave = () => {
    const budget = parseInt(budgetInput)
    if (budget > 0) {
      onSave(budget)
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && budgetInput) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className='bg-[#1a2642] border border-white/20 rounded-2xl p-6 md:p-8 max-w-md w-full'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='text-center space-y-6'>
            {/* Título */}
            <div>
              <h3 className='text-xl md:text-2xl font-bold text-white mb-2'>
                {currentBudget > 0 ? 'Actualizar Presupuesto' : 'Configurar Presupuesto'}
              </h3>
              <p className='text-white/70 text-sm md:text-base'>
                Define tu presupuesto mensual para gestionar mejor tus finanzas
              </p>
            </div>

            {/* Input */}
            <div className='space-y-4'>
              <div className='relative'>
                <input
                  type='text'
                  value={budgetInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder='Ej: 2500000'
                  className={`w-full bg-white/5 border ${
                    isValid ? 'border-white/20 focus:border-[#9DFAD7]' : 'border-red-500'
                  } rounded-xl px-4 py-3 text-white text-center text-lg md:text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#9DFAD7]/20 transition-all`}
                  autoFocus
                />
                <div className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-lg pointer-events-none'>
                  $
                </div>
              </div>

              {budgetInput && isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='text-[#9DFAD7] font-medium text-lg'
                >
                  {formatCurrency(parseInt(budgetInput))}
                </motion.div>
              )}

              {!isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='text-red-400 text-sm'
                >
                  Por favor ingresa un monto válido
                </motion.div>
              )}
            </div>

            {/* Botones */}
            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                className='flex-1 bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-all duration-300'
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!budgetInput || !isValid}
                className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all duration-300 ${
                  budgetInput && isValid
                    ? 'bg-gradient-to-r from-[#9DFAD7] to-[#D4FFB5] text-[#0D1D35] hover:opacity-90 transform hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                {currentBudget > 0 ? 'Actualizar' : 'Configurar'}
              </button>
            </div>

            {/* Sugerencias */}
            <div className='text-left'>
              <p className='text-white/60 text-xs mb-2'>💡 Sugerencias:</p>
              <div className='space-y-1 text-xs text-white/50'>
                <p>• Incluye todos tus gastos mensuales</p>
                <p>• Deja un margen del 10-20% para imprevistos</p>
                <p>• Puedes cambiar este valor cuando quieras</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
