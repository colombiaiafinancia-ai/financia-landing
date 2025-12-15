'use client'

import { useState } from 'react'
import { Trash2, Edit3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// ✅ Usar DTO oficial en lugar de tipos legacy de hooks
import { TransactionDTO } from '@/features/transactions'

interface TransactionsTableProps {
  transactions: TransactionDTO[]
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
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDTO | null>(null)

  // ✅ Ya no necesitamos cliente Supabase directo

  const handleDeleteClick = (transaction: TransactionDTO) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setDeletingId(transactionToDelete.id)
    
    try {
      let success = false
      
      if (onDeleteTransaction) {
        // ✅ Usar la función del hook refactorizado
        success = await onDeleteTransaction(transactionToDelete.id)
      } else {
        // ❌ No hay fallback directo - siempre debe usar hooks
        console.error('No delete function provided')
        alert('Error: No se puede eliminar la transacción sin función de eliminación.')
        return
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

  // ✅ Ya no necesitamos formatters - el DTO incluye valores pre-formateados

  const getTransactionIcon = (type: string | null) => {
    if (type === 'ingreso') {
      return <TrendingUp className="h-4 w-4 text-green-400" />
    }
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const getTransactionColor = (type: string | null) => {
    if (type === 'ingreso') {
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
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.formattedAmount}
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                        {transaction.category || 'Sin categoría'}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-white/70 text-sm truncate">
                        {transaction.description}
                      </p>
                    )}
                    
                    <p className="text-white/50 text-xs">
                      {transaction.formattedDate}
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
                    {getTransactionIcon(transactionToDelete.type)}
                    <span className={`font-bold text-lg ${getTransactionColor(transactionToDelete.type)}`}>
                      {transactionToDelete.formattedAmount}
                    </span>
                  </div>
                  
                  <p className="text-white/70 text-sm">
                    {transactionToDelete.category || 'Sin categoría'}
                  </p>
                  
                  {transactionToDelete.description && (
                    <p className="text-white/60 text-xs mt-1">
                      {transactionToDelete.description}
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
