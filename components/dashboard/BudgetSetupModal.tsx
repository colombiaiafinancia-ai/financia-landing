import React, { useState, useEffect } from 'react'
import { formatCurrency } from '@/utils/format'

interface BudgetSetupModalProps {
  isOpen: boolean
  currentBudget: number
  onClose: () => void
  onSave: (budget: number) => Promise<void>
}

export const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  isOpen,
  currentBudget,
  onClose,
  onSave
}) => {
  const [budgetInput, setBudgetInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(currentBudget > 0 ? currentBudget.toString() : '')
      setError(null)
    }
  }, [isOpen, currentBudget])

  const handleInputChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '')
    setBudgetInput(numericValue)
    setError(null)
  }

  const handleSave = async () => {
    const budget = parseInt(budgetInput)
    
    if (!budget || budget <= 0) {
      setError('Por favor ingresa un presupuesto válido mayor a 0')
      return
    }

    if (budget > 1000000000) {
      setError('El presupuesto no puede ser mayor a $1.000.000.000')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await onSave(budget)
      onClose()
    } catch (err) {
      console.error('Error saving budget:', err)
      setError('Error al guardar el presupuesto. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && budgetInput && !isLoading) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1D35] border border-white/20 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          {currentBudget > 0 ? 'Editar Presupuesto Mensual' : 'Configurar Presupuesto Mensual'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">
              Presupuesto mensual
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                $
              </span>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="0"
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-8 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#9DFAD7] focus:ring-1 focus:ring-[#9DFAD7]"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {budgetInput && (
              <p className="text-[#9DFAD7] text-sm mt-1">
                {formatCurrency(parseInt(budgetInput) || 0)}
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="text-white/60 text-sm">
            <p>💡 Consejos para tu presupuesto:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Incluye todos tus gastos fijos (arriendo, servicios)</li>
              <li>Reserva un 20% para emergencias</li>
              <li>Puedes ajustarlo en cualquier momento</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!budgetInput || isLoading}
              className="flex-1 bg-[#9DFAD7] text-[#0D1D35] py-3 rounded-lg hover:bg-[#9DFAD7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
