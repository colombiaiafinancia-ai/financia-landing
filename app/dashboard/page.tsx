'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { logOut } from '@/actions/auth'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { BalanceMetric } from '@/components/dashboard/BalanceMetric'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'
import { AddTransactionForm } from '@/components/dashboard/AddTransactionForm'
import WhatsAppChatButton from '@/components/dashboard/WhatsAppChatButton'
import { BudgetByCategory } from '@/components/dashboard/BudgetByCategory'
import { TransactionsTableImproved } from '@/components/dashboard/TransactionsTableImproved'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    totalSpent,
    totalIncome,
    expensesByCategory,
    weeklyTrend,
    refetch: refetchTransactions,
    deleteTransaction
  } = useTransactionsUnified()

  useEffect(() => {
    const supabase = createSupabaseClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setIsLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await logOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleCategoryClick = (category: string) => {
    console.log('Categoría seleccionada:', category)
  }

  const handleWeekClick = (week: string) => {
    console.log('Semana seleccionada:', week)
  }

  if (isLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Cargando tu dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation - Responsivo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl sm:text-2xl font-bold text-foreground hover:text-primary transition-colors"
              >
                FinancIA
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />

              <div className="text-muted-foreground text-xs sm:text-sm">
                ¡Hola, {user?.user_metadata?.full_name || 'Usuario'}!
              </div>

              <button
                onClick={handleLogout}
                className="
                  px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base
                  bg-red-500/15 hover:bg-red-500/25
                  text-red-600 dark:text-red-400
                "
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>

          {transactionsError ? (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {String(transactionsError)}
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Balance Mensual Principal - Ingresos vs Gastos */}
        <div className="mb-6 sm:mb-8">
          <BalanceMetric totalIncome={totalIncome} spentAmount={totalSpent} />
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Gastos por categoría */}
          <div className="order-1">
            <div className="lg:h-[464px] mx-auto relative">
              <CategoryChart
                expensesByCategory={expensesByCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>

          {/* Tendencia semanal */}
          <div className="order-2">
            <div className="lg:h-[464px] mx-auto relative">
              <WeeklyTrendChart weeklyData={weeklyTrend} onWeekClick={handleWeekClick} />
            </div>
          </div>
        </div>

        {/* Presupuesto por Categorías */}
        <div className="mb-6 sm:mb-8">
          <BudgetByCategory
            userId={user?.id || ''}
            onBudgetUpdate={() => window.location.reload()}
          />
        </div>

        {/* Tabla de Transacciones Mejorada */}
        <div className="mb-6 sm:mb-8">
          <TransactionsTableImproved
            transactions={transactions}
            onTransactionDeleted={refetchTransactions}
            onDeleteTransaction={deleteTransaction}
            loading={transactionsLoading}
          />
        </div>

        {/* Formulario + placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 lg:mb-6">
          <div className="lg:col-span-1 lg:h-[100%]">
            <AddTransactionForm onTransactionAdded={refetchTransactions} />
          </div>

            <div className="lg:col-span-2">
              <div
                className="
                  rounded-2xl p-4 sm:p-6 border
                  bg-card text-card-foreground border-border

                  /* DARK*/
                  dark:bg-transparent
                  dark:bg-gradient-to-br dark:from-white/5 dark:to-white/2
                  dark:backdrop-blur-sm
                  dark:border-white/10
                  dark:text-white
                "
              >
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 dark:bg-[#5ce1e6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl sm:text-3xl">📊</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                    ¡Más funciones próximamente!
                  </h3>

                  <p className="text-muted-foreground dark:text-white/70 text-sm sm:text-base max-w-md mx-auto">
                    Estamos trabajando en nuevas métricas y análisis avanzados para ayudarte a tomar mejores decisiones financieras.
                  </p>
                </div>
              </div>
            </div>
        </div>

        {/* WhatsApp Chat Button */}
        <div className="mb-6 sm:mb-8">
          <WhatsAppChatButton />
        </div>
      </main>
    </div>
  )
}
