'use client'

import { useState } from 'react'
import { Plus, Wallet, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { useCategories } from '@/hooks/useCategories'

interface AddTransactionFormProps {
  onTransactionAdded?: () => void
}

export const AddTransactionForm = ({ onTransactionAdded }: AddTransactionFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>('gasto')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const { user, createTransaction } = useTransactionsUnified()
  const { gastoCategories, ingresoCategories, loading: categoriesLoading } = useCategories()

  // Fallback para categorías si no se cargan desde la DB
  const gastosCategories = gastoCategories.length > 0 
    ? gastoCategories.map(cat => cat.nombre)
    : ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Educación', 'Ropa', 'Otros']
  
  const ingresosCategories = ingresoCategories.length > 0 
    ? ingresoCategories.map(cat => cat.nombre)
    : ['Salario', 'Freelance', 'Bonos', 'Inversiones', 'Otros']

  const availableCategories = tipo === 'gasto' ? gastosCategories : ingresosCategories

  const resetForm = () => {
    setTipo('gasto')
    setValor('')
    setCategoria('')
    setDescripcion('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valor || !categoria) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const valorNumerico = parseFloat(valor.replace(/[^\d.-]/g, ''))
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor ingresa un valor válido mayor a 0')
      return
    }

    setIsLoading(true)

    try {
      console.log('💰 TRANSACTION - Creando transacción usando hook...')
      
      // Usar el método createTransaction del hook que ya incluye refetch automático
      await createTransaction({
        amount: valorNumerico,
        category: categoria,
        type: tipo,
        description: descripcion || undefined
      })

      console.log('✅ TRANSACTION - Transacción creada exitosamente')

      // Éxito
      resetForm()
      setIsOpen(false)
      
      // Llamar callback adicional si existe (aunque el hook ya hace refetch)
      if (onTransactionAdded) {
        onTransactionAdded()
      }

      // Feedback visual
      alert(`${tipo === 'gasto' ? 'Gasto' : 'Ingreso'} registrado exitosamente`)

    } catch (error) {
      console.error('Error:', error)
      const message = error instanceof Error ? error.message : String(error)
      alert(`Error al guardar la transacción: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return ''
    
    const formattedValue = new Intl.NumberFormat('es-CO').format(Number(numericValue))
    return `$${formattedValue}`
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    setValor(rawValue)
  }

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] rounded-xl flex items-center justify-center flex-shrink-0">
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-[#0D1D35]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white">Nueva Transacción</h3>
          <p className="text-white/70 text-xs sm:text-sm">Registra tus gastos e ingresos</p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] text-[#0D1D35] hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5ce1e6]/20 text-sm sm:text-base py-2 sm:py-3"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Agregar Nueva Transacción</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-[#0D1D35] border-white/20 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-center">
              Nueva Transacción
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Tipo de transacción - Responsivo */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setTipo('gasto')}
                className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border transition-all text-sm sm:text-base ${
                  tipo === 'gasto'
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                <span className="hidden sm:inline">Gasto</span>
                <span className="sm:hidden">💸</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border transition-all text-sm sm:text-base ${
                  tipo === 'ingreso'
                    ? 'bg-green-500/20 border-green-500/40 text-green-300'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Ingreso</span>
                <span className="sm:hidden">💰</span>
              </button>
            </div>

            {/* Valor - Responsivo */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-white/80 text-sm sm:text-base">
                Valor *
              </Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
                <Input
                  id="valor"
                  type="text"
                  value={formatCurrency(valor)}
                  onChange={handleValueChange}
                  placeholder="$0"
                  className="bg-white/10 border-white/20 text-white placeholder-white/40 pl-10 sm:pl-12 text-sm sm:text-base py-2 sm:py-3"
                  required
                />
              </div>
            </div>

            {/* Categoría - Responsivo */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-white/80 text-sm sm:text-base">
                Categoría *
              </Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-[#5ce1e6] focus:ring-1 focus:ring-[#5ce1e6]"
                required
                disabled={categoriesLoading}
              >
                <option value="" className="bg-[#0D1D35]">
                  {categoriesLoading ? 'Cargando...' : 'Selecciona una categoría'}
                </option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0D1D35]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción - Responsivo */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-white/80 text-sm sm:text-base">
                Descripción (opcional)
              </Label>
              <Input
                id="descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Almuerzo en restaurante"
                className="bg-white/10 border-white/20 text-white placeholder-white/40 text-sm sm:text-base py-2 sm:py-3"
                maxLength={100}
              />
            </div>

            {/* Botones - Responsivo */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsOpen(false)
                }}
                className="border-white/20 text-white hover:bg-white/10 text-sm sm:text-base py-2 sm:py-3"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || !valor || !categoria}
                className="bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] text-[#0D1D35] hover:opacity-90 disabled:opacity-50 text-sm sm:text-base py-2 sm:py-3"
              >
                {isLoading ? 'Guardando...' : `Guardar ${tipo}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Información adicional - Responsivo */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-[#5ce1e6] rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">
              Tip Financiero
            </p>
            <p className="text-white/60 text-xs leading-relaxed">
              Registra tus transacciones al momento para no olvidarlas y mantener un control preciso de tus finanzas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 