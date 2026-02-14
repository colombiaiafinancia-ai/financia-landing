'use client'

import { useState, useMemo } from 'react'
import { Trash2, Filter, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionDTO } from '@/features/transactions'
import { useCategories } from '@/hooks/useCategories'
import { DeleteErrorHandler } from './DeleteErrorHandler'

interface TransactionsTableImprovedProps {
  transactions: TransactionDTO[]
  onTransactionDeleted: () => void
  onDeleteTransaction?: (transactionId: string) => Promise<boolean>
  loading?: boolean
}

export const TransactionsTableImproved = ({
  transactions,
  onTransactionDeleted,
  onDeleteTransaction,
  loading = false
}: TransactionsTableImprovedProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDTO | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'gasto' | 'ingreso'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const { gastoCategories, ingresoCategories } = useCategories()

  // ✅ Formato COP SIEMPRE (formattedAmount nunca viene)
  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch =
        !searchTerm ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, typeFilter, categoryFilter, sortBy, sortOrder])

  const handleDeleteClick = (transaction: TransactionDTO) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setDeletingId(transactionToDelete.id)
    setDeleteError(null)

    try {
      let success = false
      if (onDeleteTransaction) {
        success = await onDeleteTransaction(transactionToDelete.id)
      }

      if (success) {
        setShowDeleteModal(false)
        setTransactionToDelete(null)
        onTransactionDeleted()
        alert('Transacción eliminada exitosamente')
      } else {
        setDeleteError('No se pudo eliminar la transacción. Verifica tus permisos o intenta nuevamente.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setDeleteError(`Error inesperado: ${message}`)
    } finally {
      setDeletingId(null)
    }
  }

  // ✅ Verde para ingresos, ÁMBAR para gastos (menos “negativo”)
  const getTransactionIcon = (type: string | null) => {
    if (type === 'ingreso') return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    return <TrendingDown className="h-4 w-4 text-amber-700 dark:text-amber-400" />
  }

  const getTransactionColor = (type: string | null) => {
    if (type === 'ingreso') return 'text-green-600 dark:text-green-400'
    return 'text-amber-700 dark:text-amber-400'
  }

  // ✅ IMPORTANTE: evitar mezcla bg-card + gradient en DARK
  const wrapperClass = `
    rounded-2xl p-6 border
    bg-card text-card-foreground border-border

    dark:bg-transparent
    dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5
    dark:backdrop-blur-lg
    dark:border-white/20
    dark:text-white
  `

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-[#5ce1e6]" />
          <span className="ml-3 text-slate-700 dark:text-white/70">Cargando transacciones...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={wrapperClass}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mis Transacciones</h2>
            <p className="text-slate-700 dark:text-white/70 text-sm">
              {filteredTransactions.length} de {transactions.length} transacciones
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="
                border-border text-foreground hover:bg-muted
                dark:border-white/20 dark:text-white dark:hover:bg-white/10
              "
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div
            className="
              rounded-xl p-4 mb-6 border
              bg-muted border-border
              dark:bg-white/5 dark:border-white/10
            "
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="text-slate-900 dark:text-white/80 text-sm">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-white/40" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Descripción o categoría..."
                    className="
                      pl-10
                      bg-background border-border text-foreground placeholder:text-slate-400
                      dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40
                      focus-visible:ring-primary
                    "
                  />
                </div>
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-slate-900 dark:text-white/80 text-sm">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'gasto' | 'ingreso')}
                  className="
                    w-full rounded-lg px-3 py-2 outline-none border
                    bg-background text-foreground border-border
                    focus:ring-2 focus:ring-primary
                    dark:bg-white/10 dark:text-white dark:border-white/20
                  "
                >
                  <option value="all" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Todos</option>
                  <option value="gasto" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Gastos</option>
                  <option value="ingreso" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Ingresos</option>
                </select>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <label className="text-slate-900 dark:text-white/80 text-sm">Categoría</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="
                    w-full rounded-lg px-3 py-2 outline-none border
                    bg-background text-foreground border-border
                    focus:ring-2 focus:ring-primary
                    dark:bg-white/10 dark:text-white dark:border-white/20
                  "
                >
                  <option value="all" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Todas</option>
                  {[...gastoCategories, ...ingresoCategories].map((cat) => (
                    <option
                      key={cat.nombre}
                      value={cat.nombre}
                      className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white"
                    >
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenar */}
              <div className="space-y-2">
                <label className="text-slate-900 dark:text-white/80 text-sm">Ordenar por</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as 'date' | 'amount' | 'category')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="
                    w-full rounded-lg px-3 py-2 outline-none border
                    bg-background text-foreground border-border
                    focus:ring-2 focus:ring-primary
                    dark:bg-white/10 dark:text-white dark:border-white/20
                  "
                >
                  <option value="date-desc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Fecha (más reciente)</option>
                  <option value="date-asc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Fecha (más antigua)</option>
                  <option value="amount-desc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Monto (mayor)</option>
                  <option value="amount-asc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Monto (menor)</option>
                  <option value="category-asc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Categoría (A-Z)</option>
                  <option value="category-desc" className="bg-white text-slate-900 dark:bg-[#0D1D35] dark:text-white">Categoría (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted dark:bg-white/10">
              <Search className="h-8 w-8 text-slate-400 dark:text-white/50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {transactions.length === 0 ? 'No hay transacciones' : 'No se encontraron resultados'}
            </h3>
            <p className="text-slate-700 dark:text-white/70 text-sm">
              {transactions.length === 0
                ? 'Registra tu primera transacción para verla aquí'
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="
                  rounded-xl p-4 border transition-all duration-200 group
                  bg-muted hover:bg-muted/80 border-border
                  dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">{getTransactionIcon(transaction.type)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {formatCOP(transaction.amount)}
                        </span>

                        <span
                          className="
                            text-xs px-2 py-1 rounded-full
                            bg-slate-900/10 text-slate-900
                            dark:bg-white/20 dark:text-white/80
                          "
                        >
                          {transaction.category || 'Sin categoría'}
                        </span>
                      </div>

                      {transaction.description && (
                        <p className="text-slate-700 dark:text-white/70 text-sm truncate">
                          {transaction.description}
                        </p>
                      )}

                      <p className="text-slate-500 dark:text-white/50 text-xs">
                        {transaction.formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* ⚠️ Eliminar sigue siendo rojo (acción destructiva) */}
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(transaction)}
                      disabled={deletingId === transaction.id}
                      className="
                        border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50
                        dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:border-red-500/40
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent
          className="
            max-w-md mx-auto
            bg-card border border-border text-card-foreground
            dark:bg-[#0D1D35] dark:border-white/20 dark:text-white
          "
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center text-red-600 dark:text-red-400">
              ¿Eliminar Transacción?
            </DialogTitle>
          </DialogHeader>

          {transactionToDelete && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-slate-700 dark:text-white/80 mb-2">
                  ¿Estás seguro de que quieres eliminar esta transacción?
                </p>

                <div
                  className="
                    rounded-lg p-4 border
                    bg-muted border-border
                    dark:bg-white/5 dark:border-white/10
                  "
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getTransactionIcon(transactionToDelete.type)}
                    <span className={`font-bold text-lg ${getTransactionColor(transactionToDelete.type)}`}>
                      {formatCOP(transactionToDelete.amount)}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-white/70 text-sm">
                    {transactionToDelete.category || 'Sin categoría'}
                  </p>

                  {transactionToDelete.description && (
                    <p className="text-slate-600 dark:text-white/60 text-xs mt-1">
                      {transactionToDelete.description}
                    </p>
                  )}
                </div>
              </div>

              {deleteError && (
                <DeleteErrorHandler
                  error={deleteError}
                  onRetry={() => {
                    setDeleteError(null)
                    handleDeleteConfirm()
                  }}
                  onClose={() => setDeleteError(null)}
                />
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="
                    flex-1 border-border text-foreground hover:bg-muted
                    dark:border-white/20 dark:text-white dark:hover:bg-white/10
                  "
                  disabled={deletingId === transactionToDelete.id}
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleDeleteConfirm}
                  disabled={deletingId === transactionToDelete.id}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {deletingId === transactionToDelete.id ? (
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
