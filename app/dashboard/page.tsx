'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { MyCategoriesSection } from '@/components/dashboard/MyCategoriesSection'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OnboardingWelcomeModal } from '@/components/dashboard/OnboardingWelcomeModal'
import { FeedbackForm } from '@/components/dashboard/FeedbackForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreditCard, LogOut, Menu, UserCircle, X } from 'lucide-react'
import type { OnboardingStep } from '@/components/dashboard/OnboardingVignette'
import { getOnboardingLocalKeys, readStoredStep } from '@/utils/onboardingLocalStorage'
import { smoothScrollToElement } from '@/utils/scroll'
import { CATEGORIES_UPDATED_EVENT } from '@/utils/categorySyncEvents'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [isCancellingPlan, setIsCancellingPlan] = useState(false)
  const [planMessage, setPlanMessage] = useState('')
  const [profilePlan, setProfilePlan] = useState<{
    subscription_status: string
    current_plan: string
    mp_preapproval_id: string | null
  }>({
    subscription_status: 'free',
    current_plan: 'free',
    mp_preapproval_id: null,
  })
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
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)

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
    updateTransaction,
  } = useTransactionsUnified()

  /** Tras renombrar/editar categoría: nombres en transacciones y presupuestos vienen de `categories`; refrescamos vista. */
  useEffect(() => {
    const onCategoriesUpdated = () => {
      void refetchTransactions()
      setBudgetRefreshKey((k) => k + 1)
    }
    window.addEventListener(CATEGORIES_UPDATED_EVENT, onCategoriesUpdated)
    return () => window.removeEventListener(CATEGORIES_UPDATED_EVENT, onCategoriesUpdated)
  }, [refetchTransactions])

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

  const fetchProfilePlan = useCallback(async (userId: string) => {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_status,current_plan,mp_preapproval_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      setProfilePlan({
        subscription_status: 'free',
        current_plan: 'free',
        mp_preapproval_id: null,
      })
      return
    }

    setProfilePlan({
      subscription_status: data.subscription_status || 'free',
      current_plan: data.current_plan || 'free',
      mp_preapproval_id: data.mp_preapproval_id || null,
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return
    void fetchProfilePlan(user.id)
  }, [fetchProfilePlan, user?.id])

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

  const handleSkipCurrentOnboardingStep = useCallback(async () => {
    if (!onboardingStep) return

    if (onboardingStep === 'budgets') {
      setOnboardingStepAndPersist('add-transaction')
      return
    }

    if (onboardingStep === 'add-transaction') {
      setOnboardingStepAndPersist('whatsapp')
      return
    }

    await completeOnboarding()
  }, [onboardingStep, setOnboardingStepAndPersist, completeOnboarding])

  const handleLogout = async () => {
    try {
      await logOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleCancelPlan = async () => {
    if (!user?.id || isCancellingPlan) return

    const confirmed = window.confirm(
      'Vas a cancelar tu plan. Seguiras con acceso gratuito y se detendran los cobros futuros. ¿Deseas continuar?'
    )

    if (!confirmed) return

    try {
      setIsCancellingPlan(true)
      setPlanMessage('')

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        setPlanMessage(data.error || 'No se pudo cancelar el plan.')
        return
      }

      setProfilePlan({
        subscription_status: 'cancelled',
        current_plan: 'free',
        mp_preapproval_id: null,
      })
      setPlanMessage('Tu plan fue cancelado correctamente.')
      void fetchProfilePlan(user.id)
    } catch (error: any) {
      console.error('Error cancelando plan:', error)
      setPlanMessage(error?.message || 'No se pudo cancelar el plan.')
    } finally {
      setIsCancellingPlan(false)
    }
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategoryName(category)
  }

  const handleWeekClick = (week: string) => {
    console.log('Semana seleccionada:', week)
  }

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategoryName) return []
    return transactions
      .filter((tx) => tx.type === 'gasto' && tx.category === selectedCategoryName)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
  }, [selectedCategoryName, transactions])

  const selectedCategoryTotal = useMemo(
    () => selectedCategoryTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [selectedCategoryTransactions]
  )

  const createTransactionWithBudgetRefresh = useCallback(
    async (data: {
      amount: number
      category: string
      type: 'gasto' | 'ingreso'
      description?: string
    }) => {
      await createTransaction(data)
      setBudgetRefreshKey((prev) => prev + 1)
    },
    [createTransaction]
  )

  const deleteTransactionWithBudgetRefresh = useCallback(
    async (transactionId: string) => {
      const success = await deleteTransaction(transactionId)
      if (success) {
        setBudgetRefreshKey((prev) => prev + 1)
      }
      return success
    },
    [deleteTransaction]
  )

  const updateTransactionWithBudgetRefresh = useCallback(
    async (
      transactionId: string,
      data: {
        amount: number
        categoryId: string
        direction: 'gasto' | 'ingreso'
        description: string | null
      }
    ) => {
      const success = await updateTransaction(transactionId, data)
      if (success) {
        setBudgetRefreshKey((prev) => prev + 1)
      }
      return success
    },
    [updateTransaction]
  )

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
  const planStatus = profilePlan.subscription_status || 'free'
  const currentPlan = profilePlan.current_plan || 'free'
  const hasPaidPlan =
    currentPlan !== 'free' && (planStatus === 'active' || planStatus === 'pending')
  const planLabel =
    currentPlan === 'free'
      ? 'Plan gratis'
      : currentPlan === 'financia_pro_monthly'
        ? 'Financia Pro mensual'
        : currentPlan
  const statusLabel: Record<string, string> = {
    free: 'Gratis',
    pending: 'Pendiente',
    active: 'Activo',
    paused: 'Pausado',
    cancelled: 'Cancelado',
    unknown: 'Por revisar',
  }

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

            <div className="relative flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-label="Abrir menu de usuario"
                aria-expanded={accountMenuOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              >
                {accountMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl dark:border-white/15 dark:bg-[#0D1D35] dark:text-white">
                  <div className="border-b border-border px-4 py-3 dark:border-white/10">
                    <Link
                      href="/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-start gap-3 rounded-md p-1 transition-colors hover:bg-accent dark:hover:bg-white/10"
                    >
                      <UserCircle className="mt-0.5 h-5 w-5 text-muted-foreground dark:text-white/70" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.user_metadata?.full_name || 'Usuario'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground dark:text-white/60">
                          {user.email}
                        </p>
                        <p className="mt-1 text-xs font-medium text-primary dark:text-[#5ce1e6]">
                          Editar usuario
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="space-y-3 px-4 py-3">
                    <div className="rounded-md border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-5 w-5 text-primary dark:text-[#5ce1e6]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Mi plan</p>
                          <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">
                            {planLabel}
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]">
                            {statusLabel[planStatus] || planStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {planMessage && (
                      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground dark:bg-white/5 dark:text-white/70">
                        {planMessage}
                      </p>
                    )}

                    {hasPaidPlan ? (
                      <button
                        type="button"
                        onClick={handleCancelPlan}
                        disabled={isCancellingPlan}
                        className="w-full rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                      >
                        {isCancellingPlan ? 'Cancelando plan...' : 'Cancelar plan'}
                      </button>
                    ) : (
                      <Link
                        href="/subscribe"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block w-full rounded-md bg-[#0D1D35] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#0D1D35]/90 dark:bg-[#5ce1e6] dark:text-[#0D1D35]"
                      >
                        Suscribirme a Pro
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border p-2 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              )}
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
            refreshKey={budgetRefreshKey}
            onboardingStep={showTour ? onboardingStep : null}
            onSkipOnboarding={handleSkipCurrentOnboardingStep}
            onFirstBudgetCreated={handleBudgetCreatedForTour}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 lg:grid-cols-2 lg:gap-6">
          <div
            data-dashboard-section="transactions-list"
            className="min-w-0 scroll-mt-24 sm:scroll-mt-28"
          >
            {transactionSuccessMessage && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300 sm:text-sm">
                {transactionSuccessMessage}
              </div>
            )}
            <TransactionsTableImproved
              transactions={transactions}
              onTransactionDeleted={refetchTransactions}
              onDeleteTransaction={deleteTransactionWithBudgetRefresh}
              onUpdateTransaction={updateTransactionWithBudgetRefresh}
              loading={transactionsLoading}
            />
          </div>
          <div className="min-w-0">
            <MyCategoriesSection />
          </div>
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
              createTransaction={createTransactionWithBudgetRefresh}
              onTransactionAdded={handleTransactionAdded}
              onboardingStep={showTour ? onboardingStep : null}
              onSkipOnboarding={handleSkipCurrentOnboardingStep}
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
            onSkipOnboarding={handleSkipCurrentOnboardingStep}
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

      <Dialog
        open={selectedCategoryName !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCategoryName(null)
        }}
      >
        <DialogContent className="max-w-lg border border-border bg-card text-card-foreground dark:border-white/20 dark:bg-[#0D1D35] dark:text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryName ? `Detalle: ${selectedCategoryName}` : 'Detalle de categoría'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              Total del mes: ${selectedCategoryTotal.toLocaleString('es-CO')}
            </div>
            {selectedCategoryTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-white/70">
                No hay transacciones para esta categoría en el mes actual.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {selectedCategoryTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-lg border border-border bg-muted px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="font-medium text-foreground dark:text-white">
                      {tx.formattedAmount}
                    </p>
                    <p className="text-muted-foreground dark:text-white/70">
                      {tx.description || 'Sin descripción'}
                    </p>
                    <p className="text-xs text-muted-foreground/80 dark:text-white/50">
                      {tx.formattedDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
