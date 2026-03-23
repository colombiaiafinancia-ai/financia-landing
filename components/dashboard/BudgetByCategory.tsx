'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Edit3,
  DollarSign,
  TrendingUp,
  Trash2,
  Wallet,
  ChevronDown,
  Check
} from 'lucide-react'
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
import { OnboardingVignette, type OnboardingStep } from '@/components/dashboard/OnboardingVignette'

interface BudgetByCategoryProps {
  userId: string
  /** Onboarding: paso activo (null si no aplica) */
  onboardingStep?: OnboardingStep | null
  onSkipOnboarding?: () => void
  /** Tras guardar un presupuesto nuevo (no al editar) */
  onFirstBudgetCreated?: () => void
}

export const BudgetByCategory = ({
  userId,
  onboardingStep = null,
  onSkipOnboarding,
  onFirstBudgetCreated,
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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [budgetToDelete, setBudgetToDelete] = useState<{
    categoryId: string
    categoryName: string
    presupuestado: number
  } | null>(null)
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)
  const [deleteBudgetError, setDeleteBudgetError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

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

  const selectedCategory = gastoCategories.find(
    (cat) => cat.id === selectedCategoryId
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return ''
    return `$${new Intl.NumberFormat('es-CO').format(Number(numericValue))}`
  }

  const handleBudgetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    setBudgetValue(rawValue)
  }

  const handleSave = async () => {
    if (!selectedCategoryId || !budgetValue || !userId) {
      alert('Por favor completa todos los campos')
      return
    }

    const valorNumerico = parseFloat(budgetValue)
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor ingresa un valor válido')
      return
    }

    try {
      setSaving(true)
      await saveCategoryBudget(selectedCategoryId, valorNumerico)
      setSelectedCategoryId('')
      setBudgetValue('')
      setShowCategoryDropdown(false)
      setShowAddModal(false)
      const wasEditing = !!editingBudget
      setEditingBudget(null)
      if (!onboardingStep) {
        setSuccessMessage(
          wasEditing
            ? 'Tu presupuesto se actualizó con éxito.'
            : 'Tu presupuesto se guardó con éxito.'
        )
        window.setTimeout(() => setSuccessMessage(''), 3500)
      }
      if (!wasEditing) {
        onFirstBudgetCreated?.()
      }
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

  const handleDeleteClick = (budget: (typeof budgetSummary)[0]) => {
    setDeleteBudgetError(null)
    setBudgetToDelete({
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      presupuestado: budget.presupuestado
    })
  }

  const handleDeleteBudgetConfirm = async () => {
    if (!budgetToDelete) return
    setDeletingBudgetId(budgetToDelete.categoryId)
    setDeleteBudgetError(null)
    try {
      await deleteCategoryBudget(budgetToDelete.categoryId)
      setBudgetToDelete(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al eliminar el presupuesto'
      setDeleteBudgetError(errorMessage)
    } finally {
      setDeletingBudgetId(null)
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
    setShowCategoryDropdown(false)
    setShowAddModal(true)
  }

  const handleCancel = () => {
    setSelectedCategoryId('')
    setBudgetValue('')
    setShowCategoryDropdown(false)
    setShowAddModal(false)
    setEditingBudget(null)
  }

  const wrapperClass = `
    rounded-2xl p-6
    bg-card border border-border text-card-foreground
    dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
    dark:backdrop-blur-lg dark:border-white/20 dark:text-white
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
              className="flex justify-between items-center p-3 rounded-xl animate-pulse bg-muted dark:bg-white/5"
            >
              <div className="h-4 bg-slate-300/70 dark:bg-white/15 rounded w-24" />
              <div className="h-4 bg-slate-300/70 dark:bg-white/15 rounded w-16" />
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
            className="border-border text-foreground hover:bg-muted dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className={wrapperClass}>
      {onboardingStep === 'budgets' && (
        <OnboardingVignette
          stepLabel="Paso 1 de 3"
          title="Configura tu primer presupuesto"
          bullets={[
            'Elige una categoría de gasto y el monto que quieres destinar.',
            'Pulsa «Agregar», completa categoría y valor; luego podrás editar o borrar.',
            'La barra de progreso muestra cuánto llevas gastado frente al límite.',
          ]}
          onSkip={onSkipOnboarding}
        />
      )}
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md bg-card border border-border text-card-foreground dark:bg-[#071224] dark:border-white/15 dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold text-slate-900 dark:text-white">
                {editingBudget
                  ? `Editar Presupuesto - ${editingBudget.categoryName}`
                  : 'Agregar presupuesto'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2" ref={dropdownRef}>
                <Label className="text-slate-900 dark:text-white/80 text-sm">
                  Categoría
                </Label>

                {categoriesLoading ? (
                  <div className="w-full p-2 rounded-md border bg-muted text-muted-foreground text-sm text-center">
                    Cargando categorías...
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      disabled={!!editingBudget}
                      onClick={() =>
                        !editingBudget &&
                        setShowCategoryDropdown((prev) => !prev)
                      }
                      className="
                        w-full rounded-xl px-3 py-2.5 text-sm border
                        bg-background text-foreground border-border
                        flex items-center justify-between
                        hover:bg-muted/60
                        focus:outline-none focus:ring-2 focus:ring-primary
                        disabled:opacity-70 disabled:cursor-not-allowed
                        dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white/15
                      "
                    >
                      <span className={selectedCategory ? '' : 'text-muted-foreground dark:text-white/50'}>
                        {selectedCategory?.nombre || 'Seleccionar categoría'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground dark:text-white/60 transition-transform ${
                          showCategoryDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showCategoryDropdown && !editingBudget && (
                      <div
                        className="
                          absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-xl
                          bg-popover text-popover-foreground border-border
                          dark:bg-[#0b1730] dark:text-white dark:border-white/15
                        "
                      >
                        <div className="max-h-60 overflow-y-auto py-1">
                          {gastoCategories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground dark:text-white/60">
                              No hay categorías
                            </div>
                          ) : (
                            gastoCategories.map((cat) => {
                              const isSelected = selectedCategoryId === cat.id

                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategoryId(cat.id)
                                    setShowCategoryDropdown(false)
                                  }}
                                  className="
                                    w-full px-3 py-2.5 text-left text-sm
                                    flex items-center justify-between
                                    hover:bg-accent hover:text-accent-foreground
                                    dark:hover:bg-white/10 dark:hover:text-white
                                  "
                                >
                                  <span>{cat.nombre}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary dark:text-cyan-400" />
                                  )}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="budget"
                  className="text-slate-900 dark:text-white/80 text-sm"
                >
                  Presupuesto
                </Label>

                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-white/40" />
                  <Input
                    id="budget"
                    type="text"
                    value={formatCurrency(budgetValue)}
                    onChange={handleBudgetValueChange}
                    placeholder="$0"
                    className="
                      pl-10
                      bg-background border-border text-foreground placeholder:text-slate-400
                      dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
                      focus-visible:ring-primary
                    "
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 border-border text-foreground hover:bg-muted dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedCategoryId || !budgetValue}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saving ? 'Guardando...' : editingBudget ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300 sm:text-sm">
          {successMessage}
        </div>
      )}

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
                  dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10
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
                      <span>Gastado: ${budget.actual.toLocaleString('es-CO')}</span>
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
                    className="text-blue-600 hover:text-blue-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(budget)}
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

    <Dialog
      open={budgetToDelete !== null}
      onOpenChange={(open) => {
        if (!open) {
          setBudgetToDelete(null)
          setDeleteBudgetError(null)
        }
      }}
    >
      <DialogContent
        className="
          max-w-md mx-auto
          bg-card border border-border text-card-foreground
          dark:bg-[#0D1D35] dark:border-white/20 dark:text-white
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center text-red-600 dark:text-red-400">
            ¿Eliminar Presupuesto?
          </DialogTitle>
        </DialogHeader>

        {budgetToDelete && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-slate-700 dark:text-white/80 mb-2">
                ¿Estás seguro de que quieres eliminar este presupuesto?
              </p>

              <div
                className="
                  rounded-lg p-4 border
                  bg-muted border-border
                  dark:bg-white/5 dark:border-white/10
                "
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    ${budgetToDelete.presupuestado.toLocaleString('es-CO')}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-white/70 text-sm">
                  {budgetToDelete.categoryName}
                </p>
              </div>
            </div>

            {deleteBudgetError && (
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {deleteBudgetError}
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setBudgetToDelete(null)
                  setDeleteBudgetError(null)
                }}
                className="
                  flex-1 border-border text-foreground hover:bg-muted
                  dark:border-white/20 dark:text-white dark:hover:bg-white/10
                "
                disabled={deletingBudgetId === budgetToDelete.categoryId}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleDeleteBudgetConfirm}
                disabled={deletingBudgetId === budgetToDelete.categoryId}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deletingBudgetId === budgetToDelete.categoryId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}