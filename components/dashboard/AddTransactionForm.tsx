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

  const { createTransaction } = useTransactionsUnified()
  const { gastoCategories, ingresoCategories, loading: categoriesLoading } = useCategories()

  const gastosCategories =
    gastoCategories.length > 0
      ? gastoCategories.map((cat) => cat.nombre)
      : ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Educación', 'Ropa', 'Otros']

  const ingresosCategories =
    ingresoCategories.length > 0
      ? ingresoCategories.map((cat) => cat.nombre)
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
      await createTransaction({
        amount: valorNumerico,
        category: categoria,
        type: tipo,
        description: descripcion || undefined
      })

      resetForm()
      setIsOpen(false)

      onTransactionAdded?.()
      alert(`${tipo === 'gasto' ? 'Gasto' : 'Ingreso'} registrado exitosamente`)
    } catch (error) {
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

  const wrapperClass = `
    w-full h-full rounded-2xl p-4 sm:p-6 border
    bg-card text-card-foreground border-border

    dark:bg-transparent
    dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
    dark:backdrop-blur-lg
    dark:border-white/20
    dark:text-white
  `

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1]">
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground dark:text-[#0D1D35]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Nueva Transacción</h3>
          <p className="text-slate-700 dark:text-white/70 text-xs sm:text-sm">Registra tus gastos e ingresos</p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="
              w-full py-2 sm:py-3 text-sm sm:text-base
              transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]

              bg-primary text-primary-foreground hover:bg-primary/90
              dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1]
              dark:text-[#0D1D35] dark:hover:opacity-90
              shadow-lg dark:shadow-[#5ce1e6]/20
            "
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Agregar Nueva Transacción</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </DialogTrigger>

        <DialogContent
          className="
            max-w-md mx-auto
            bg-card border border-border text-card-foreground
            dark:bg-[#0D1D35] dark:border-white/20 dark:text-white
          "
        >
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-center text-slate-900 dark:text-white">
              Nueva Transacción
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setTipo('gasto')}
                className={`
                  flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border transition-all text-sm sm:text-base
                  ${
                    tipo === 'gasto'
                      ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                      : 'bg-muted border-border text-slate-700 hover:bg-muted/80 dark:bg-white/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10'
                  }
                `}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                <span className="hidden sm:inline">Gasto</span>
                <span className="sm:hidden">💸</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`
                  flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border transition-all text-sm sm:text-base
                  ${
                    tipo === 'ingreso'
                      ? 'bg-green-500/15 border-green-500/40 text-green-600 dark:bg-green-500/20 dark:text-green-300'
                      : 'bg-muted border-border text-slate-700 hover:bg-muted/80 dark:bg-white/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10'
                  }
                `}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Ingreso</span>
                <span className="sm:hidden">💰</span>
              </button>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-slate-900 dark:text-white/80 text-sm sm:text-base">
                Valor *
              </Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-white/40" />
                <Input
                  id="valor"
                  type="text"
                  value={formatCurrency(valor)}
                  onChange={handleValueChange}
                  placeholder="$0"
                  className="
                    pl-10 sm:pl-12 py-2 sm:py-3 text-sm sm:text-base
                    bg-background border-border text-foreground placeholder:text-slate-400
                    dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
                    focus-visible:ring-primary
                  "
                  required
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-slate-900 dark:text-white/80 text-sm sm:text-base">
                Categoría *
              </Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                disabled={categoriesLoading}
                className="
                  w-full rounded-lg px-3 py-2 sm:py-3 text-sm sm:text-base outline-none border
                  bg-background text-foreground border-border
                  focus:ring-2 focus:ring-primary

                  dark:bg-white/10 dark:text-white dark:border-white/20
                "
              >
                <option value="" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">
                  {categoriesLoading ? 'Cargando...' : 'Selecciona una categoría'}
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-slate-900 dark:text-white/80 text-sm sm:text-base">
                Descripción (opcional)
              </Label>
              <Input
                id="descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Almuerzo en restaurante"
                className="
                  py-2 sm:py-3 text-sm sm:text-base
                  bg-background border-border text-foreground placeholder:text-slate-400
                  dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
                  focus-visible:ring-primary
                "
                maxLength={100}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsOpen(false)
                }}
                className="
                  border-border text-foreground hover:bg-muted
                  dark:border-white/20 dark:text-white dark:hover:bg-white/10
                  text-sm sm:text-base py-2 sm:py-3
                "
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !valor || !categoria}
                className="
                  text-sm sm:text-base py-2 sm:py-3
                  bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50
                  dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1]
                  dark:text-[#0D1D35] dark:hover:opacity-90
                "
              >
                {isLoading ? 'Guardando...' : `Guardar ${tipo}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tip */}
      <div
        className="
          mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border
          bg-muted border-border

          dark:bg-white/5 dark:border-white/10
        "
      >
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-primary dark:bg-[#5ce1e6]" />
          <div>
            <p className="text-slate-900 dark:text-white/80 text-xs sm:text-sm font-medium mb-1">
              Tip Financiero
            </p>
            <p className="text-slate-700 dark:text-white/60 text-xs leading-relaxed">
              Registra tus transacciones al momento para no olvidarlas y mantener un control preciso de tus finanzas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
