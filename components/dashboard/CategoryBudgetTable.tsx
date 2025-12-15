'use client'

import { useState } from 'react'
import { useCategoryBudget } from '@/hooks/useCategoryBudget'
import { Edit3, Check, X, Plus, Trash2 } from 'lucide-react'

interface CategoryBudgetTableProps {
  userId: string
}

export const CategoryBudgetTable = ({ userId }: CategoryBudgetTableProps) => {
  const { budgetSummary, stats, loading, error, saveCategoryBudget, deleteCategoryBudget } = useCategoryBudget(userId)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState<string>('')
  const [newAmount, setNewAmount] = useState<string>('')

  // Categorías disponibles para agregar (solo gastos)
  const expenseCategories = [
    'Alimentación', 'Vivienda', 'Transporte', 'Educación', 
    'Entretenimiento y Ocio', 'Deudas', 'Compras personales', 
    'Salud', 'Otros'
  ]

  // Filtrar categorías ya usadas
  const availableCategories = expenseCategories.filter(
    cat => !budgetSummary.some(item => item.categoria === cat)
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const startEdit = (categoria: string, currentAmount: number) => {
    setEditingCategory(categoria)
    setEditValue(currentAmount.toString())
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setEditValue('')
  }

  const saveEdit = async () => {
    if (!editingCategory) return

    const amount = parseFloat(editValue)
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    try {
      await saveCategoryBudget(editingCategory, amount)
      setEditingCategory(null)
      setEditValue('')
    } catch (error) {
      alert('Error al guardar el presupuesto')
    }
  }

  const handleDelete = async (categoria: string) => {
    if (confirm(`¿Estás seguro de eliminar el presupuesto para ${categoria}?`)) {
      try {
        await deleteCategoryBudget(categoria)
      } catch (error) {
        alert('Error al eliminar el presupuesto')
      }
    }
  }

  const handleAddNew = async () => {
    if (!newCategory || !newAmount) {
      alert('Por favor completa todos los campos')
      return
    }

    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    try {
      await saveCategoryBudget(newCategory, amount)
      setShowAddForm(false)
      setNewCategory('')
      setNewAmount('')
    } catch (error) {
      alert('Error al agregar el presupuesto')
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Presupuesto por Categorías</h3>
          <div className="text-center text-yellow-400 mb-4">
            <p>⚠️ Funcionalidad en desarrollo</p>
            <p className="text-sm text-white/60 mt-2">
              Pronto podrás gestionar presupuestos por categoría
            </p>
          </div>
          <p className="text-sm text-white/40">
            Por ahora puedes usar el presupuesto general y ver tus gastos por categoría en los gráficos
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Resumen de Presupuesto Mensual</h3>
          <p className="text-sm text-white/70 mt-1">
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Agregar Categoría
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <p className="text-blue-200 text-sm">Total Presupuestado</p>
          <p className="text-white font-semibold text-lg">{formatCurrency(stats.totalPresupuestado)}</p>
        </div>
        <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
          <p className="text-orange-200 text-sm">Total Gastado</p>
          <p className="text-white font-semibold text-lg">{formatCurrency(stats.totalGastado)}</p>
        </div>
        <div className={`rounded-lg p-4 border ${
          stats.totalExcedente >= 0 
            ? 'bg-green-500/20 border-green-500/30' 
            : 'bg-red-500/20 border-red-500/30'
        }`}>
          <p className={`text-sm ${stats.totalExcedente >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {stats.totalExcedente >= 0 ? 'Excedente Total' : 'Déficit Total'}
          </p>
          <p className="text-white font-semibold text-lg">{formatCurrency(Math.abs(stats.totalExcedente))}</p>
        </div>
      </div>

      {/* Add New Category Form */}
      {showAddForm && (
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <h4 className="text-white font-medium mb-3">Agregar Nueva Categoría</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-[#0D1D35] text-white">Seleccionar categoría</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat} className="bg-[#0D1D35] text-white">{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Monto presupuestado"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNew}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewCategory('')
                  setNewAmount('')
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {budgetSummary.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <p>No hay presupuestos definidos por categoría</p>
          <p className="text-sm mt-1">Haz clic en "Agregar Categoría" para crear tu primer presupuesto</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-white font-semibold py-3 px-2">Categoría</th>
                <th className="text-right text-white font-semibold py-3 px-2">Actual</th>
                <th className="text-right text-white font-semibold py-3 px-2">Presupuestado</th>
                <th className="text-right text-white font-semibold py-3 px-2">Excedente</th>
                <th className="text-center text-white font-semibold py-3 px-2">%</th>
                <th className="text-center text-white font-semibold py-3 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {budgetSummary.map((item) => (
                <tr key={item.categoria} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2">
                    <span className="text-white font-medium">{item.categoria}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(item.actual)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {editingCategory === item.categoria ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 bg-white/10 border border-white/20 text-white rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="text-green-400 hover:text-green-300 p-1"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-blue-400 font-medium">
                        {formatCurrency(item.presupuestado)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`font-medium ${
                      item.excedente >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(item.excedente)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center">
                      <div className={`text-sm font-medium px-2 py-1 rounded ${
                        item.porcentajeUsado <= 80 
                          ? 'bg-green-500/20 text-green-400' 
                          : item.porcentajeUsado <= 100
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.presupuestado > 0 ? `${item.porcentajeUsado.toFixed(0)}%` : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => startEdit(item.categoria, item.presupuestado)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Editar presupuesto"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.categoria)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      {budgetSummary.length > 0 && (
        <div className="mt-4 text-sm text-white/60 space-y-1">
          <p>• {stats.categoriasConPresupuesto} categorías con presupuesto definido</p>
          <p>• {stats.categoriasSobrepasadas} categorías han sobrepasado el presupuesto</p>
          <p>• {stats.categoriasBajoPresupuesto} categorías están bajo presupuesto</p>
        </div>
      )}
    </div>
  )
} 