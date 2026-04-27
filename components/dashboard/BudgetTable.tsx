'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { useCategoryBudget } from '@/hooks/useCategoryBudget'
import { useCategories } from '@/hooks/useCategories'
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface BudgetTableProps {
  userId?: string
}

export const BudgetTable = ({ userId }: BudgetTableProps) => {
  const { totalSpent, totalIncome, user } = useTransactionsUnified()
  const { budgetSummary, saveCategoryBudget, deleteCategoryBudget } = useCategoryBudget(userId || user?.id || '')
  const { gastoCategories } = useCategories()
  
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string>('')
  const [editingAmount, setEditingAmount] = useState('')

  const totalBudgeted = budgetSummary.reduce((sum, item) => sum + item.presupuestado, 0)
  const balanceReal = totalIncome - totalSpent

  const handleEditBudget = (categoryId: string, currentAmount: number) => {
    setEditingCategoryId(categoryId)
    setEditingAmount(currentAmount.toString())
    setIsBudgetModalOpen(true)
  }

  const handleSaveBudget = async () => {
    if (editingCategoryId && editingAmount) {
      const amount = parseFloat(editingAmount)
      if (amount > 0) {
        await saveCategoryBudget(editingCategoryId, amount)
      } else {
        await deleteCategoryBudget(editingCategoryId)
      }
      setIsBudgetModalOpen(false)
      setEditingCategoryId('')
      setEditingAmount('')
    }
  }

  return (
    <Card className="w-full bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white">Presupuesto Mensual</CardTitle>
            <CardDescription className="text-white/70">
              Seguimiento de ingresos vs gastos totales
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-2 bg-[#9DFAD7] text-[#0D1D35] border-[#9DFAD7] hover:bg-[#9DFAD7]/90"
          >
            <Calculator className="h-4 w-4" />
            Presupuesto
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-[#9DFAD7]/20 to-[#A78BFA]/20 rounded-lg border border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[#9DFAD7]" />
              <p className="text-sm text-white/70">Total Ingresos</p>
            </div>
            <p className="text-3xl font-bold text-[#9DFAD7]">{formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <p className="text-sm text-white/70">Total Gastos</p>
            </div>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(totalSpent)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-white" />
              <p className="text-sm text-white/70">Balance Real</p>
            </div>
            <p className={`text-3xl font-bold ${balanceReal >= 0 ? 'text-[#9DFAD7]' : 'text-red-400'}`}>
              {formatCurrency(balanceReal)}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {balanceReal >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </div>
        </div>

        {totalBudgeted > 0 && (
          <div className="p-4 rounded-lg border border-white/20 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              📊 Comparación con Presupuesto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-sm text-white/70 mb-2">Presupuesto Total Planeado</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalBudgeted)}</p>
                <p className="text-xs text-white/50">Para gastos mensuales</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-white/70 mb-2">vs Gasto Real</p>
                <p className={`text-2xl font-bold ${totalSpent <= totalBudgeted ? 'text-[#9DFAD7]' : 'text-red-400'}`}>
                  {formatCurrency(totalSpent)}
                </p>
                <div className="mt-2">
                  {totalSpent <= totalBudgeted ? (
                    <p className="text-[#9DFAD7] text-sm">
                      ✅ Dentro del presupuesto
                    </p>
                  ) : (
                    <p className="text-red-400 text-sm">
                      ⚠️ Excedido por {formatCurrency(totalSpent - totalBudgeted)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Progreso del Presupuesto</span>
                <span>{totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    totalSpent <= totalBudgeted * 0.8 ? 'bg-[#9DFAD7]' :
                    totalSpent <= totalBudgeted ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
        <DialogContent className="bg-[#0D1D35] border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCategoryId ? 'Editar Presupuesto' : 'Configurar Presupuestos por Categoría'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editingCategoryId 
                ? 'Establece el monto mensual que planeas gastar en esta categoría.'
                : 'Configura cuánto planeas gastar cada mes en cada categoría de gastos.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingCategoryId ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-white">Monto Mensual</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editingAmount}
                  onChange={(e) => setEditingAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsBudgetModalOpen(false)
                    setEditingCategoryId('')
                    setEditingAmount('')
                  }}
                  className="bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveBudget}
                  className="bg-[#9DFAD7] text-[#0D1D35] hover:bg-[#9DFAD7]/90"
                >
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {gastoCategories.map((category) => {
                  const currentBudget = budgetSummary.find(b => b.categoryId === category.id)?.presupuestado || 0
                  return (
                    <div
                      key={category.id}
                      className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">{category.nombre}</span>
                        <DollarSign className="h-4 w-4 text-[#9DFAD7]" />
                      </div>
                      <div className="text-xs text-white/60 mb-3">
                        Presupuesto actual: {currentBudget > 0 ? formatCurrency(currentBudget) : 'No configurado'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(category.id, currentBudget)}
                        className="w-full text-[#9DFAD7] hover:text-[#9DFAD7]/80 hover:bg-white/10 border border-[#9DFAD7]/30"
                      >
                        {currentBudget > 0 ? 'Editar' : 'Configurar'}
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsBudgetModalOpen(false)} 
                  className="bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
