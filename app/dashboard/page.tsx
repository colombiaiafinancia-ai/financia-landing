'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { logOut } from '@/actions/auth'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BalanceMetric } from '@/components/dashboard/BalanceMetric'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'
import { AddTransactionForm } from '@/components/dashboard/AddTransactionForm'
import WhatsAppChatButton from '@/components/dashboard/WhatsAppChatButton'
import { BudgetByCategory } from '@/components/dashboard/BudgetByCategory'
import { TransactionsTableImproved } from '@/components/dashboard/TransactionsTableImproved'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OnboardingWelcomeModal } from '@/components/dashboard/OnboardingWelcomeModal'
import { FeedbackForm } from '@/components/dashboard/FeedbackForm'
import type { OnboardingStep } from '@/components/dashboard/OnboardingVignette'
import { getOnboardingLocalKeys, readStoredStep } from '@/utils/onboardingLocalStorage'
import { smoothScrollToElement } from '@/utils/scroll'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const {
    loading: onboardingLoading,
    shouldShowTour,
    markCompleted,
  } = useOnboardingStatus(user)

  /** Usuario ya pulsó Siguiente en la bienvenida (persistido por usuario en localStorage) */
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [onboardingStep, setOnboardingStepState] = useState<OnboardingStep>(null)
  const [transactionSuccessMessage, setTransactionSuccessMessage] = useState('')

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    totalSpent,
    totalIncome,
    expensesByCategory,
    weeklyTrend,
    dailyTrend,
    monthlyTrend,
    loadingTrend,
    fetchDailyTrend,
    fetchMonthlyTrend,
    refetch: refetchTransactions,
    createTransaction,
    deleteTransaction,
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
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  /**
   * Restaurar paso / bienvenida desde localStorage solo si el tour está activo (onboarding = verificado en BD).
   */
  useEffect(() => {
    if (!user?.id || onboardingLoading) return

    if (!shouldShowTour) {
      setWelcomeDone(true)
      setOnboardingStepState(null)
      return
    }

    const k = getOnboardingLocalKeys(user.id)
    // Al tener tour activo desde BD, siempre iniciamos por bienvenida.
    localStorage.removeItem(k.completed)
    localStorage.removeItem(k.welcome)
    localStorage.removeItem(k.step)
    setWelcomeDone(false)
    setOnboardingStepState(null)
  }, [user?.id, onboardingLoading, shouldShowTour])

  const showTour = shouldShowTour && !onboardingLoading

  /**
   * Scroll al paso activo de onboarding.
   */
  useEffect(() => {
    if (!showTour || !welcomeDone || !onboardingStep || isLoading || !user) {
      return
    }
    const timer = window.setTimeout(() => {
      const el = document.querySelector(
        `[data-onboarding-section="${onboardingStep}"]`
      )
      if (el instanceof HTMLElement) {
        smoothScrollToElement(el, 1400, 96)
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [onboardingStep, welcomeDone, showTour, isLoading, user])

  const setOnboardingStepAndPersist = useCallback(
    (step: OnboardingStep) => {
      const uid = user?.id
      if (!uid) return
      setOnboardingStepState(step)
      const k = getOnboardingLocalKeys(uid)
      if (step) {
        localStorage.setItem(k.step, step)
      } else {
        localStorage.removeItem(k.step)
      }
    },
    [user?.id]
  )

  const completeOnboarding = useCallback(async () => {
    if (!user?.id) return
    const { error } = await markCompleted()
    if (error) {
      alert('No se pudo guardar el estado del onboarding. Inténtalo de nuevo.')
      return
    }
    const k = getOnboardingLocalKeys(user.id)
    localStorage.setItem(k.completed, 'true')
    localStorage.removeItem(k.step)
    setWelcomeDone(true)
    setOnboardingStepState(null)
  }, [user?.id, markCompleted])

  const handleWelcomeNext = useCallback(() => {
    if (!user?.id) return
    const k = getOnboardingLocalKeys(user.id)
    localStorage.setItem(k.welcome, 'true')
    setWelcomeDone(true)
    setOnboardingStepAndPersist('budgets')
  }, [user?.id, setOnboardingStepAndPersist])

  const handleWelcomeSkip = useCallback(async () => {
    await completeOnboarding()
  }, [completeOnboarding])

  const handleBudgetCreatedForTour = useCallback(() => {
    if (onboardingStep === 'budgets') {
      setOnboardingStepAndPersist('add-transaction')
    }
  }, [onboardingStep, setOnboardingStepAndPersist])

  const handleFirstTransactionCreated = useCallback(() => {
    if (onboardingStep === 'add-transaction') {
      setOnboardingStepAndPersist('whatsapp')
    }
  }, [onboardingStep, setOnboardingStepAndPersist])

  /**
   * Tras agregar transacción: mensaje + scroll a la lista (fuera del tour).
   * Con onboarding activo se omite para no chocar con el scroll al paso siguiente.
   */
  const handleTransactionAdded = useCallback(() => {
    if (showTour) return

    setTransactionSuccessMessage('Tu transacción se guardó con éxito.')
    window.setTimeout(() => setTransactionSuccessMessage(''), 4000)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector(
          '[data-dashboard-section="transactions-list"]'
        )
        if (el instanceof HTMLElement) {
          smoothScrollToElement(el, 600, 96)
        }
      })
    })
  }, [showTour])

  const handleWhatsAppOpenedForTour = useCallback(async () => {
    if (onboardingStep === 'whatsapp') {
      await completeOnboarding()
    }
  }, [onboardingStep, completeOnboarding])

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

  if (isLoading || !user || onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground sm:text-base">
            Cargando tu dashboard...
          </p>
        </div>
      </div>
    )
  }

  const welcomeModalOpen = showTour && !welcomeDone

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OnboardingWelcomeModal
        open={welcomeModalOpen}
        onNext={handleWelcomeNext}
        onSkip={handleWelcomeSkip}
      />

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-foreground transition-colors hover:text-primary sm:text-2xl"
              >
                Finanzas Consulting - FinancIA
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <div className="text-xs text-muted-foreground sm:text-sm">
                ¡Hola, {user.user_metadata?.full_name || 'Usuario'}!
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/25 dark:text-red-400 sm:px-4 sm:text-base"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>

          {transactionsError && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {String(transactionsError)}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <BalanceMetric totalIncome={totalIncome} spentAmount={totalSpent} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:gap-8 xl:grid-cols-2">
          <div className="order-1">
            <div className="relative mx-auto lg:h-[464px]">
              <CategoryChart
                expensesByCategory={expensesByCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>

          <div className="order-2">
            <WeeklyTrendChart
              weeklyData={weeklyTrend}
              dailyData={dailyTrend}
              monthlyData={monthlyTrend}
              loadingTrend={loadingTrend}
              onFetchDaily={fetchDailyTrend}
              onFetchMonthly={fetchMonthlyTrend}
              onWeekClick={handleWeekClick}
              onDayClick={(date) => console.log('Día seleccionado:', date)}
              onMonthClick={(month) => console.log('Mes seleccionado:', month)}
            />
          </div>
        </div>

        <div
          data-onboarding-section="budgets"
          className={cn(
            'mb-6 rounded-2xl transition-shadow sm:mb-8',
            onboardingStep === 'budgets' &&
              showTour &&
              'ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-background'
          )}
        >
          <BudgetByCategory
            userId={user.id}
            onboardingStep={showTour ? onboardingStep : null}
            onSkipOnboarding={completeOnboarding}
            onFirstBudgetCreated={handleBudgetCreatedForTour}
          />
        </div>

        <div
          data-dashboard-section="transactions-list"
          className="mb-6 scroll-mt-24 sm:mb-8 sm:scroll-mt-28"
        >
          {transactionSuccessMessage && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300 sm:text-sm">
              {transactionSuccessMessage}
            </div>
          )}
          <TransactionsTableImproved
            transactions={transactions}
            onTransactionDeleted={refetchTransactions}
            onDeleteTransaction={deleteTransaction}
            loading={transactionsLoading}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:mb-6 lg:grid-cols-3">
          <div
            data-onboarding-section="add-transaction"
            className={cn(
              'lg:col-span-1 lg:h-[100%]',
              onboardingStep === 'add-transaction' &&
                showTour &&
                'rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-background'
            )}
          >
            <AddTransactionForm
              createTransaction={createTransaction}
              onTransactionAdded={handleTransactionAdded}
              onboardingStep={showTour ? onboardingStep : null}
              onSkipOnboarding={completeOnboarding}
              onFirstTransactionCreated={handleFirstTransactionCreated}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground dark:bg-transparent dark:bg-gradient-to-br dark:from-white/5 dark:to-white/2 dark:text-white dark:backdrop-blur-sm dark:border-white/10 sm:p-6">
              <div className="py-8 text-center sm:py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 dark:bg-[#5ce1e6]/20 sm:h-20 sm:w-20">
                  <span className="text-2xl sm:text-3xl">📊</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  ¡Más funciones próximamente!
                </h3>
                <p className="mx-auto max-w-md text-sm text-muted-foreground dark:text-white/70 sm:text-base">
                  Estamos trabajando en nuevas métricas y análisis avanzados para ayudarte
                  a tomar mejores decisiones financieras.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          data-onboarding-section="whatsapp"
          className={cn(
            'mb-6 sm:mb-8',
            onboardingStep === 'whatsapp' &&
              showTour &&
              'rounded-2xl p-1 ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-background'
          )}
        >
          <WhatsAppChatButton
            onboardingStep={showTour ? onboardingStep : null}
            onSkipOnboarding={completeOnboarding}
            onWhatsAppOpened={handleWhatsAppOpenedForTour}
          />
        </div>

        <div className="mb-10 sm:mb-12">
          <FeedbackForm
            userId={user?.id}
            userEmail={user?.email}
            userName={user?.user_metadata?.full_name}
          />
        </div>
      </main>
    </div>
  )
}
