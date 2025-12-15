'use client'

import { useState } from 'react'
import { Trash2, Edit3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// ✅ Ya no necesitamos acceso directo a Supabase - se maneja en los hooks
import { UnifiedTransaction } from '@/hooks/useTransactionsUnified'

interface TransactionsTableProps {
  transactions: UnifiedTransaction[]
  onTransactionDeleted: () => void
  onDeleteTransaction?: (transactionId: string) => Promise<boolean>
  loading?: boolean
}

export const TransactionsTable = ({ 
  transactions, 
  onTransactionDeleted, 
  onDeleteTransaction,
  loading = false 
}: TransactionsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<UnifiedTransaction | null>(null)

  // ✅ Ya no necesitamos cliente Supabase directo

  const handleDeleteClick = (transaction: UnifiedTransaction) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setDeletingId(transactionToDelete.id)
    
    try {
      let success = false
      
      if (onDeleteTransaction) {
        // Usar la función del hook si está disponible
        success = await onDeleteTransaction(transactionToDelete.id)
      } else {
        // Fallback a eliminación directa
        const { error } = await supabase
          .from('transacciones')
          .delete()
          .eq('id', transactionToDelete.id)

        if (error) {
          console.error('Error eliminando transacción:', error)
          alert('Error al eliminar la transacción. Inténtalo de nuevo.')
          return
        }
        success = true
      }

      if (success) {
        // Éxito
        setShowDeleteModal(false)
        setTransactionToDelete(null)
        onTransactionDeleted()
        
        // Feedback visual
        alert('Transacción eliminada exitosamente')
      } else {
        alert('Error al eliminar la transacción. Inténtalo de nuevo.')
      }

    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado al eliminar la transacción')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (tipo: string | null) => {
    if (tipo === 'ingreso') {
      return <TrendingUp className="h-4 w-4 text-green-400" />
    }
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const getTransactionColor = (tipo: string | null) => {
    if (tipo === 'ingreso') {
      return 'text-green-400'
    }
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5ce1e6]"></div>
          <span className="ml-3 text-white/70">Cargando transacciones...</span>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-white/50" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No hay transacciones</h3>
          <p className="text-white/70 text-sm">
            Registra tu primera transacción para verla aquí
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] rounded-xl flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-[#0D1D35]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mis Transacciones</h2>
            <p className="text-white/70 text-sm">{transactions.length} transacciones registradas</p>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.tipo)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${getTransactionColor(transaction.tipo)}`}>
                        {formatCurrency(transaction.valor)}
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                        {transaction.categoria || 'Sin categoría'}
                      </span>
                    </div>
                    
                    {transaction.descripcion && (
                      <p className="text-white/70 text-sm truncate">
                        {transaction.descripcion}
                      </p>
                    )}
                    
                    <p className="text-white/50 text-xs">
                      {formatDate(transaction.creado_en)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(transaction)}
                    disabled={deletingId === transaction.id}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#0D1D35] border-white/20 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center text-red-400">
              ¿Eliminar Transacción?
            </DialogTitle>
          </DialogHeader>

          {transactionToDelete && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/80 mb-2">
                  ¿Estás seguro de que quieres eliminar esta transacción?
                </p>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getTransactionIcon(transactionToDelete.tipo)}
                    <span className={`font-bold text-lg ${getTransactionColor(transactionToDelete.tipo)}`}>
                      {formatCurrency(transactionToDelete.valor)}
                    </span>
                  </div>
                  
                  <p className="text-white/70 text-sm">
                    {transactionToDelete.categoria || 'Sin categoría'}
                  </p>
                  
                  {transactionToDelete.descripcion && (
                    <p className="text-white/60 text-xs mt-1">
                      {transactionToDelete.descripcion}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
