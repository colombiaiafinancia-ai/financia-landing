'use client'

import { useState } from 'react'
import { Plus, Edit3, DollarSign, TrendingUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategories } from '@/hooks/useCategories'
import { useCategoryBudget } from '@/hooks/useCategoryBudget'

interface BudgetByCategoryProps {
  userId: string
  onBudgetUpdate: () => void
}

/**
 * Componente refactorizado para presupuestos por categoría
 * 
 * ✅ Usa hooks refactorizados
 * ✅ No accede directamente a Supabase
 * ✅ Manejo de errores estandarizado
 */
export const BudgetByCategory = ({ userId, onBudgetUpdate }: BudgetByCategoryProps) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<{id: string, categorias: string, valor: number} | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [budgetValue, setBudgetValue] = useState('')
  const [saving, setSaving] = useState(false)

  // ✅ Usar hooks refactorizados
  const { gastoCategories, loading: categoriesLoading } = useCategories()
  const { 
    budgetSummary, 
    loading: budgetsLoading, 
    error, 
    saveCategoryBudget, 
    deleteCategoryBudget 
  } = useCategoryBudget(userId)

  const loading = categoriesLoading || budgetsLoading

  // Guardar presupuesto
  const handleSave = async () => {
    if (!selectedCategory || !budgetValue || !userId) {
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
      
      console.log('💰 COMPONENT - Saving category budget:', { 
        categoria: selectedCategory, 
        valor: valorNumerico 
      })

      // ✅ Usar hook refactorizado
      await saveCategoryBudget(selectedCategory, valorNumerico)
      
      console.log('✅ COMPONENT - Category budget saved successfully')
      
      // Limpiar formulario y cerrar modal
      setSelectedCategory('')
      setBudgetValue('')
      setShowAddModal(false)
      setEditingBudget(null)
      
      // Notificar al componente padre
      onBudgetUpdate()
      
    } catch (error) {
      console.error('❌ COMPONENT - Error saving category budget:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el presupuesto'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Eliminar presupuesto
  const handleDelete = async (categoria: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el presupuesto de ${categoria}?`)) {
      return
    }

    try {
      console.log('🗑️ COMPONENT - Deleting category budget:', categoria)

      // ✅ Usar hook refactorizado
      await deleteCategoryBudget(categoria)
      
      console.log('✅ COMPONENT - Category budget deleted successfully')
      
      // Notificar al componente padre
      onBudgetUpdate()
      
    } catch (error) {
      console.error('❌ COMPONENT - Error deleting category budget:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el presupuesto'
      alert(errorMessage)
    }
  }

  // Iniciar edición
  const handleEdit = (budget: {categoria: string, presupuestado: number}) => {
    setEditingBudget({
      id: budget.categoria, // Usar categoría como ID temporal
      categorias: budget.categoria,
      valor: budget.presupuestado
    })
    setSelectedCategory(budget.categoria)
    setBudgetValue(budget.presupuestado.toString())
    setShowAddModal(true)
  }

  // Cancelar edición
  const handleCancel = () => {
    setSelectedCategory('')
    setBudgetValue('')
    setShowAddModal(false)
    setEditingBudget(null)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Presupuesto por Categorías
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Presupuesto por Categorías
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <DollarSign className="mr-2 h-5 w-5" />
          Presupuesto por Categorías
        </h3>
        
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Editar Presupuesto' : 'Agregar Presupuesto por Categoría'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={!!editingBudget}
                >
                  <option value="">Seleccionar categoría</option>
                  {gastoCategories.map((cat) => (
                    <option key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="budget">Presupuesto</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  placeholder="Ej: 500000"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving || !selectedCategory || !budgetValue}
                >
                  {saving ? 'Guardando...' : (editingBudget ? 'Actualizar' : 'Guardar')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgetSummary.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No tienes presupuestos configurados por categoría</p>
          <p className="text-sm text-gray-500">
            Agrega presupuestos específicos para cada categoría de gasto
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetSummary.map((budget) => (
            <div
              key={budget.categoria}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{budget.categoria}</span>
                  <span className="text-lg font-bold text-green-600">
                    ${budget.presupuestado.toLocaleString('es-CO')}
                  </span>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Gastado: ${budget.actual.toLocaleString('es-CO')}</span>
                    <span className={budget.excedente >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {budget.excedente >= 0 ? 'Disponible' : 'Excedido'}: ${Math.abs(budget.excedente).toLocaleString('es-CO')}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budget.porcentajeUsado >= 100 
                          ? 'bg-red-500' 
                          : budget.porcentajeUsado >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.porcentajeUsado, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {budget.porcentajeUsado.toFixed(1)}% utilizado
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(budget)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(budget.categoria)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}