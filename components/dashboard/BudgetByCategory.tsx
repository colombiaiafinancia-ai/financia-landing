'use client'

import { useState } from 'react'
import { Plus, Edit3, DollarSign, TrendingUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategories } from '@/hooks/useCategories'
import { useCategoryBudget } from '@/hooks/useCategoryBudget'

interface BudgetByCategoryProps {
  userId: string
  onBudgetUpdate: () => void
}

export const BudgetByCategory = ({
  userId,
  onBudgetUpdate
}: BudgetByCategoryProps) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<{
    categoryId: string
    categoryName: string
    amount: number
  } | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [budgetValue, setBudgetValue] = useState('')
  const [saving, setSaving] = useState(false)

  const { gastoCategories, loading: categoriesLoading } = useCategories()
  const {
    budgetSummary,
    loading: budgetsLoading,
    refreshing,
    error,
    saveCategoryBudget,
    deleteCategoryBudget
  } = useCategoryBudget(userId)

  const loading = categoriesLoading || budgetsLoading

  const handleSave = async () => {
    if (!selectedCategoryId || !budgetValue || !userId) {
      alert('Por favor completa todos los campos')
      return
    }

    const valorNumerico = parseFloat(budgetValue.replace(/[^0-9.-]/g, ''))
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor ingresa un valor válido')
      return
    }

    try {
      setSaving(true)
      await saveCategoryBudget(selectedCategoryId, valorNumerico)
      setSelectedCategoryId('')
      setBudgetValue('')
      setShowAddModal(false)
      setEditingBudget(null)
      onBudgetUpdate()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al guardar el presupuesto'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    const category = budgetSummary.find((b) => b.categoryId === categoryId)
    if (!category) return

    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el presupuesto de ${category.categoryName}?`
      )
    ) {
      return
    }

    try {
      await deleteCategoryBudget(categoryId)
      onBudgetUpdate()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al eliminar el presupuesto'
      alert(errorMessage)
    }
  }

  const handleEdit = (budget: (typeof budgetSummary)[0]) => {
    setEditingBudget({
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      amount: budget.presupuestado
    })
    setSelectedCategoryId(budget.categoryId)
    setBudgetValue(budget.presupuestado.toString())
    setShowAddModal(true)
  }

  const handleCancel = () => {
    setSelectedCategoryId('')
    setBudgetValue('')
    setShowAddModal(false)
    setEditingBudget(null)
  }

  const wrapperClass = `
    rounded-2xl p-4 sm:p-6
    bg-card border border-border text-card-foreground
    dark:bg-transparent dark:bg-gradient-to-br dark:from-white/5 dark:to-white/2
    dark:backdrop-blur-sm dark:border-white/10 dark:text-white
  `

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
            <DollarSign className="mr-2 h-5 w-5" />
            Presupuesto por Categorías
          </h3>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 rounded-xl animate-pulse bg-muted dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div className="h-4 rounded w-24 bg-slate-300/70 dark:bg-white/15" />
              <div className="h-4 rounded w-16 bg-slate-300/70 dark:bg-white/15" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
            <DollarSign className="mr-2 h-5 w-5" />
            Presupuesto por Categorías
          </h3>
        </div>

        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="dark:bg-transparent dark:text-white dark:border-white/15 dark:hover:bg-white/5"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between mb-4 relative">
        <h3 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
          <DollarSign className="mr-2 h-5 w-5" />
          Presupuesto por Categorías
        </h3>

        {refreshing && (
          <div className="absolute right-0 top-0 mt-1 mr-1 z-10">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        )}

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="
                bg-primary hover:bg-primary/90 text-primary-foreground
                dark:bg-[#5ce1e6] dark:hover:bg-[#4dd0e1] dark:text-[#0D1D35]
              "
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>

          <DialogContent
            className="
              bg-card text-card-foreground border border-border shadow-xl
              dark:bg-[#0D1D35] dark:text-white dark:border-white/10
            "
          >
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                {editingBudget
                  ? `Editar Presupuesto - ${editingBudget.categoryName}`
                  : 'Agregar Presupuesto por Categoría'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-slate-900 dark:text-white">
                  Categoría
                </Label>

                {categoriesLoading ? (
                  <div
                    className="
                      mt-1 w-full p-2 rounded-md border text-sm
                      bg-muted text-muted-foreground border-border
                      dark:bg-white/5 dark:text-white/70 dark:border-white/10
                    "
                  >
                    Cargando categorías...
                  </div>
                ) : (
                  <select
                    id="category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={!!editingBudget}
                    className="
                      mt-1 w-full p-2 rounded-md border outline-none
                      bg-background text-foreground border-border
                      dark:bg-white/5 dark:text-white dark:border-white/10
                      dark:[color-scheme:dark]
                      focus:ring-2 focus:ring-primary
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                  >
                    <option value="">Seleccionar categoría</option>
                    {gastoCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="budget" className="text-slate-900 dark:text-white">
                  Presupuesto
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  placeholder="Ej: 500000"
                  className="
                    mt-1
                    bg-background text-foreground border border-border
                    dark:bg-white/5 dark:text-white dark:border-white/10
                    dark:placeholder:text-white/40
                    focus-visible:ring-primary
                  "
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="dark:bg-transparent dark:text-white dark:border-white/15 dark:hover:bg-white/5"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !selectedCategoryId ||
                    !budgetValue ||
                    categoriesLoading
                  }
                  className="
                    bg-primary hover:bg-primary/90 text-primary-foreground
                    dark:bg-[#5ce1e6] dark:hover:bg-[#4dd0e1] dark:text-[#0D1D35]
                  "
                >
                  {saving
                    ? 'Guardando...'
                    : editingBudget
                    ? 'Actualizar'
                    : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgetSummary.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="mx-auto h-12 w-12 text-slate-400 dark:text-white/40 mb-4" />
          <p className="text-slate-700 dark:text-white/70 mb-4">
            No tienes presupuestos configurados por categoría
          </p>
          <p className="text-sm text-slate-600 dark:text-white/50">
            Agrega presupuestos específicos para cada categoría de gasto
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetSummary.map((budget) => {
            const usedPct = Math.min(budget.porcentajeUsado, 100)

            return (
              <div
                key={budget.categoryId}
                className="
                  flex justify-between items-center p-4 rounded-xl transition-colors
                  bg-muted hover:bg-muted/80 border border-border
                  dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:border-white/[0.08]
                "
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {budget.categoryName}
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${budget.presupuestado.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1 text-slate-700 dark:text-white/70">
                      <span>
                        Gastado: ${budget.actual.toLocaleString('es-CO')}
                      </span>
                      <span
                        className={
                          budget.excedente >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {budget.excedente >= 0 ? 'Disponible' : 'Excedido'}: $
                        {Math.abs(budget.excedente).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="w-full rounded-full h-2 bg-slate-200 dark:bg-white/10">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          budget.porcentajeUsado >= 100
                            ? 'bg-red-500'
                            : budget.porcentajeUsado >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>

                    <div className="text-xs mt-1 text-slate-600 dark:text-white/50">
                      {budget.porcentajeUsado.toFixed(1)}% utilizado
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(budget)}
                    className="text-blue-600 hover:text-blue-800 dark:text-[#5ce1e6] dark:hover:text-[#4dd0e1]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(budget.categoryId)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}