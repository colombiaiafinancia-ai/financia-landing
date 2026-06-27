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
import { CategoryTrendChart } from '@/components/dashboard/CategoryTrendChart'
import { AddTransactionForm } from '@/components/dashboard/AddTransactionForm'
import WhatsAppChatButton from '@/components/dashboard/WhatsAppChatButton'
import { BudgetByCategory } from '@/components/dashboard/BudgetByCategory'
import { TransactionsTableImproved } from '@/components/dashboard/TransactionsTableImproved'
import { MyCategoriesSection } from '@/components/dashboard/MyCategoriesSection'
import { useTransactionsUnified } from '@/hooks/useTransactionsUnified'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { useOnboardingTourLock } from '@/hooks/useOnboardingTourLock'
import { OnboardingWelcomeModal } from '@/components/dashboard/OnboardingWelcomeModal'
import { FeedbackForm } from '@/components/dashboard/FeedbackForm'
<<<<<<< HEAD
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, BellOff, CreditCard, LogOut, Menu, UserCircle, X } from 'lucide-react'
import { OnboardingVignette, OnboardingActionTarget, onboardingTargetButtonClass, type OnboardingStep } from '@/components/dashboard/OnboardingVignette'
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, BellOff, CreditCard, LogOut, Menu, ShieldCheck, UserCircle, X } from 'lucide-react'
import { OnboardingVignette, OnboardingSpotlightArrow, getOnboardingButtonSpotlightStyle, type OnboardingStep } from '@/components/dashboard/OnboardingVignette'
>>>>>>> c530f46 (feat: códigos promocionales por tiempo limitado, bandeja admin de sugerencias y precios en COP para Mercado Pago)
import {
  OnboardingSpotlightOverlay,
  OnboardingTourHeader,
  onboardingSpotlightSectionProps,
} from '@/components/dashboard/OnboardingSpotlight'
import { getOnboardingLocalKeys } from '@/utils/onboardingLocalStorage'
import { smoothScrollToElement } from '@/utils/scroll'
import { CATEGORIES_UPDATED_EVENT } from '@/utils/categorySyncEvents'
import {
  getEffectiveTrialEndsAt,
  getPromotionalTrialTotalMs,
  PROMOTIONAL_TRIAL_END_LABEL,
} from '@/lib/trial'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [isCancellingPlan, setIsCancellingPlan] = useState(false)
  const [isSavingReminderOptIn, setIsSavingReminderOptIn] = useState(false)
  const [planMessage, setPlanMessage] = useState('')
  const [profilePlan, setProfilePlan] = useState<{
    subscription_status: string
    current_plan: string
    mp_preapproval_id: string | null
    reminder_opt_in: boolean
    trial_ends_at: string | null
    is_super_user: boolean
  }>({
    subscription_status: 'free',
    current_plan: 'free',
    mp_preapproval_id: null,
    reminder_opt_in: false,
    trial_ends_at: null,
    is_super_user: false,
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
  const [selectedCategoryType, setSelectedCategoryType] = useState<'gasto' | 'ingreso'>('gasto')
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false)

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    totalSpent,
    totalIncome,
    expensesByCategory,
    incomeByCategory,
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
      .select('subscription_status,current_plan,mp_preapproval_id,reminder_opt_in,trial_ends_at,is_super_user')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      setProfilePlan({
        subscription_status: 'free',
        current_plan: 'free',
        mp_preapproval_id: null,
        reminder_opt_in: false,
        trial_ends_at: null,
        is_super_user: false,
      })
      return
    }

    setProfilePlan({
      subscription_status: data.subscription_status || 'free',
      current_plan: data.current_plan || 'free',
      mp_preapproval_id: data.mp_preapproval_id || null,
      reminder_opt_in: data.reminder_opt_in === true,
      trial_ends_at: data.trial_ends_at || null,
      is_super_user: data.is_super_user === true,
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
  const tourSpotlightActive = showTour && welcomeDone && !!onboardingStep
  const isNotificationsStep = tourSpotlightActive && onboardingStep === 'notifications'
  const isAccountMenuBlocked =
    (showTour && !welcomeDone) || (tourSpotlightActive && !isNotificationsStep)

  useOnboardingTourLock({
    active: tourSpotlightActive && !isLoading && !!user,
    step: onboardingStep,
    isLoading,
  })

  /**
   * Abrir el menu de usuario cuando el tour llega a recordatorios.
   * En los demás pasos, mantenerlo cerrado para evitar conflictos con el tour.
   */
  useEffect(() => {
    if (isAccountMenuBlocked) {
      setAccountMenuOpen(false)
      return
    }

    if (showTour && onboardingStep === 'notifications') {
      setAccountMenuOpen(true)
    }
  }, [showTour, onboardingStep, isAccountMenuBlocked])

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

  useEffect(() => {
    if (showTour && onboardingStep === 'notifications' && profilePlan.reminder_opt_in) {
      setOnboardingStepAndPersist('whatsapp')
    }
  }, [showTour, onboardingStep, profilePlan.reminder_opt_in, setOnboardingStepAndPersist])

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
      setOnboardingStepAndPersist('notifications')
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
      setOnboardingStepAndPersist('notifications')
      return
    }

    if (onboardingStep === 'notifications') {
      setAccountMenuOpen(false)
      setOnboardingStepAndPersist('whatsapp')
      return
    }

    if (onboardingStep === 'whatsapp') {
      await completeOnboarding()
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

      setProfilePlan((prev) => ({
        ...prev,
        subscription_status: 'cancelled',
        current_plan: 'free',
        mp_preapproval_id: null,
        trial_ends_at: null,
      }))
      setPlanMessage('Tu plan fue cancelado correctamente.')
      void fetchProfilePlan(user.id)
    } catch (error: any) {
      console.error('Error cancelando plan:', error)
      setPlanMessage(error?.message || 'No se pudo cancelar el plan.')
    } finally {
      setIsCancellingPlan(false)
    }
  }

  const handleToggleReminderOptIn = async () => {
    if (!user?.id || isSavingReminderOptIn) return

    const nextValue = !profilePlan.reminder_opt_in
    const previousValue = profilePlan.reminder_opt_in

    try {
      setIsSavingReminderOptIn(true)
      setPlanMessage('')
      setProfilePlan((prev) => ({
        ...prev,
        reminder_opt_in: nextValue,
      }))

      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          reminder_opt_in: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        setProfilePlan((prev) => ({
          ...prev,
          reminder_opt_in: previousValue,
        }))
        setPlanMessage(error.message || 'No se pudo actualizar la preferencia.')
        return
      }

      setPlanMessage(
        nextValue
          ? 'Recordatorios diarios activados.'
          : 'Recordatorios diarios desactivados.'
      )

      if (onboardingStep === 'notifications' && nextValue) {
        setAccountMenuOpen(false)
        setOnboardingStepAndPersist('whatsapp')
      }
    } catch (error: any) {
      setProfilePlan((prev) => ({
        ...prev,
        reminder_opt_in: previousValue,
      }))
      setPlanMessage(error?.message || 'No se pudo actualizar la preferencia.')
    } finally {
      setIsSavingReminderOptIn(false)
    }
  }

  const handleCategoryClick = (category: string, type: 'gasto' | 'ingreso' = 'gasto') => {
    setSelectedCategoryName(category)
    setSelectedCategoryType(type)
    setCategoryDetailOpen(true)
  }

  const handleClearCategorySelection = () => {
    setSelectedCategoryName(null)
    setCategoryDetailOpen(false)
  }

  const handleWeekClick = (week: string) => {
    console.log('Semana seleccionada:', week)
  }

  const currentMonthRange = useMemo(() => {
    const now = new Date()
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(),
    }
  }, [])

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategoryName) return []
    return transactions
      .filter((tx) => {
        if (tx.type !== selectedCategoryType || tx.category !== selectedCategoryName) return false
        if (!tx.createdAt) return false

        const occurredAt = new Date(tx.createdAt).getTime()
        return occurredAt >= currentMonthRange.start && occurredAt < currentMonthRange.end
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
  }, [currentMonthRange, selectedCategoryName, selectedCategoryType, transactions])

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
  const effectiveTrialEndsAt = getEffectiveTrialEndsAt(profilePlan.trial_ends_at)
  const trialEndsAt = effectiveTrialEndsAt ? new Date(effectiveTrialEndsAt) : null
  const trialIsActive = Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now())
  const trialRemainingMs = trialIsActive && trialEndsAt
    ? Math.max(trialEndsAt.getTime() - Date.now(), 0)
    : 0
  const trialDaysRemaining = trialRemainingMs
    ? Math.max(1, Math.ceil(trialRemainingMs / (1000 * 60 * 60 * 24)))
    : 0
  const trialProgress = Math.max(
    0,
    Math.min(100, (trialRemainingMs / getPromotionalTrialTotalMs()) * 100)
  )
  const canCancelPlan =
    !profilePlan.is_super_user &&
    currentPlan !== 'free' &&
    (planStatus === 'active' || planStatus === 'pending' || trialIsActive)
  const planNames: Record<string, string> = {
    free: 'Plan gratis',
    financia_monthly: 'Plan mensual',
    financia_annual: 'Plan anual 30% OFF',
    financia_founder_monthly: 'Founders 100',
    financia_founder_annual: 'Founder anual',
    financia_test_weekly: 'Plan prueba semanal',
  }
  const planLabel = profilePlan.is_super_user
    ? 'Super user'
    : planNames[currentPlan] || currentPlan
  const statusLabel: Record<string, string> = {
    free: 'Gratis',
    pending: 'Pendiente',
    active: 'Activo',
    trial: 'Prueba',
    paused: 'Pausado',
    cancelled: 'Cancelado',
    unknown: 'Por revisar',
  }
  const displayedStatus = profilePlan.is_super_user
    ? 'Acceso total'
    : trialIsActive
      ? 'Prueba activa'
      : statusLabel[planStatus] || planStatus
  const hasPaidPlan =
    currentPlan !== 'free' &&
    (planStatus === 'active' || planStatus === 'pending')
  const showTrialBanner = !profilePlan.is_super_user && !hasPaidPlan
  const showIncomeHeatmap =
    Object.values(incomeByCategory).filter((value) => Number(value) > 0).length >= 2

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OnboardingWelcomeModal
        open={welcomeModalOpen}
        onNext={handleWelcomeNext}
        onSkip={handleWelcomeSkip}
      />

      <OnboardingSpotlightOverlay active={tourSpotlightActive} />

      <header
        className={cn(
          'sticky top-0 border-b border-border bg-background/95 backdrop-blur-sm',
          isNotificationsStep ? 'z-[50]' : 'z-40'
        )}
      >
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-foreground transition-colors hover:text-primary sm:text-2xl"
              >
                FinancIA
              </Link>
            </div>

            <div
              className={cn(
                'relative flex items-center space-x-2 sm:space-x-3',
                isNotificationsStep && 'z-[60] pointer-events-auto'
              )}
            >
              <button
                type="button"
                disabled={isAccountMenuBlocked}
                onClick={() => {
                  if (isAccountMenuBlocked) return
                  setAccountMenuOpen((open) => !open)
                }}
                aria-label="Abrir menu de usuario"
                aria-expanded={accountMenuOpen}
                aria-disabled={isAccountMenuBlocked}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10',
                  isAccountMenuBlocked && 'cursor-not-allowed opacity-40'
                )}
              >
                {accountMenuOpen && !isAccountMenuBlocked ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {accountMenuOpen && !isAccountMenuBlocked && (
                <div
                  data-onboarding-section="notifications"
                  {...(isNotificationsStep ? { 'data-onboarding-active': true as const } : {})}
                  className={cn(
                    'absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl dark:border-white/15 dark:bg-[#0D1D35] dark:text-white',
                    isNotificationsStep &&
                      'z-[60] border-[rgba(34,211,238,0.3)] shadow-[0_0_32px_rgba(34,211,238,0.18)]'
                  )}
                >
                  {isNotificationsStep && (
                    <div className="border-b border-border px-3 pt-3 dark:border-white/10">
                      <OnboardingTourHeader compact />
                    </div>
                  )}
                  <div
                    className={cn(
                      'border-b border-border px-4 py-3 dark:border-white/10',
                      isNotificationsStep && 'pointer-events-none opacity-40'
                    )}
                  >
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
                    <div
                      className={cn(
                        'rounded-md border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5',
                        isNotificationsStep && 'pointer-events-none opacity-40'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-5 w-5 text-primary dark:text-[#5ce1e6]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Mi plan</p>
                          <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">
                            {planLabel}
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]">
                            {displayedStatus}
                          </span>
                          {trialIsActive && trialEndsAt && (
                            <p className="mt-2 text-xs text-muted-foreground dark:text-white/60">
                              Prueba gratis hasta el {PROMOTIONAL_TRIAL_END_LABEL}.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'rounded-md border bg-muted/40 p-3 dark:bg-white/5',
                        isNotificationsStep
                          ? 'relative z-[1] border-[rgba(34,211,238,0.25)] shadow-[0_0_20px_rgba(34,211,238,0.12)] dark:border-[rgba(34,211,238,0.3)]'
                          : 'border-border dark:border-white/10'
                      )}
                    >
                      {onboardingStep === 'notifications' && (
                        <OnboardingVignette
                          stepNumber={3}
                          compact
                          title="Activa recordatorios"
                          icon={Bell}
                          action="Activa las notificaciones para recibir avisos diarios por WhatsApp."
                          onSkip={handleSkipCurrentOnboardingStep}
                        />
                      )}
                      <div className="flex items-start gap-3">
                        {profilePlan.reminder_opt_in ? (
                          <Bell className="mt-0.5 h-5 w-5 text-primary dark:text-[#5ce1e6]" />
                        ) : (
                          <BellOff className="mt-0.5 h-5 w-5 text-muted-foreground dark:text-white/60" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Recordatorios diarios</p>
                          <p className="mt-1 text-xs text-muted-foreground dark:text-white/70">
                            {profilePlan.reminder_opt_in
                              ? 'Te enviaremos WhatsApp si no registras movimientos en el dia.'
                              : 'No recibiras recordatorios hasta que los actives.'}
                          </p>
                          <OnboardingActionTarget
                            active={
                              showTour &&
                              onboardingStep === 'notifications' &&
                              !profilePlan.reminder_opt_in
                            }
                            align="center"
                            className="mt-1 w-full"
                          >
                            <button
                              type="button"
                              data-onboarding-target="toggle-reminders"
                              onClick={handleToggleReminderOptIn}
                              disabled={isSavingReminderOptIn}
                              className={cn(
                                'mt-3 inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                                showTour &&
                                  onboardingStep === 'notifications' &&
                                  !profilePlan.reminder_opt_in &&
                                  onboardingTargetButtonClass('reminders')
                              )}
                            >
                              {isSavingReminderOptIn
                                ? 'Guardando...'
                                : profilePlan.reminder_opt_in
                                  ? 'Desactivar recordatorios'
                                  : 'Activar recordatorios'}
                            </button>
                          </OnboardingActionTarget>
                        </div>
                      </div>
                    </div>

                    {planMessage && (
                      <p
                        className={cn(
                          'rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground dark:bg-white/5 dark:text-white/70',
                          isNotificationsStep && 'pointer-events-none opacity-40'
                        )}
                      >
                        {planMessage}
                      </p>
                    )}

                    {canCancelPlan ? (
                      <button
                        type="button"
                        onClick={handleCancelPlan}
                        disabled={isCancellingPlan}
                        className={cn(
                          'w-full rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300',
                          isNotificationsStep && 'pointer-events-none opacity-40'
                        )}
                      >
                        {isCancellingPlan ? 'Cancelando plan...' : 'Cancelar plan'}
                      </button>
                    ) : profilePlan.is_super_user ? (
                      <div className={cn('space-y-2', isNotificationsStep && 'pointer-events-none opacity-40')}>
                        <p className="rounded-md border border-[#5ce1e6]/20 bg-[#5ce1e6]/10 px-3 py-2 text-center text-xs font-medium text-[#5ce1e6]">
                          Acceso completo habilitado por administrador.
                        </p>
                        <Link
                          href="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          <ShieldCheck className="h-4 w-4 text-[#5ce1e6]" />
                          Administrar codigos
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href="/subscribe"
                        onClick={() => setAccountMenuOpen(false)}
                        className={cn(
                          'block w-full rounded-md bg-[#0D1D35] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#0D1D35]/90 dark:bg-[#5ce1e6] dark:text-[#0D1D35]',
                          isNotificationsStep && 'pointer-events-none opacity-40'
                        )}
                      >
                        Suscribirme a Pro
                      </Link>
                    )}
                  </div>

                  <div
                    className={cn(
                      'border-t border-border p-2 dark:border-white/10',
                      isNotificationsStep && 'pointer-events-none opacity-40'
                    )}
                  >
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

          {showTrialBanner && !showTour && (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 dark:border-[#5ce1e6]/20 dark:bg-[#5ce1e6]/10">
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium text-muted-foreground dark:text-white/70">
                <span>
                  Prueba gratis
                </span>
                <span className={trialIsActive
                  ? "text-primary dark:text-[#5ce1e6]"
                  : "text-red-600 dark:text-red-300"
                }>
                  {trialIsActive
                    ? `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}`
                    : 'Se ha acabado la prueba gratuita'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 dark:bg-[#5ce1e6]"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main
        className={cn(
          'mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8',
          tourSpotlightActive && 'pointer-events-none',
          isNotificationsStep && 'opacity-50'
        )}
      >
        {tourSpotlightActive && !isNotificationsStep && (
          <div className="relative z-[45] mb-4 pointer-events-none">
            <OnboardingTourHeader />
          </div>
        )}
        <div className="mb-6 sm:mb-8">
          <BalanceMetric totalIncome={totalIncome} spentAmount={totalSpent} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:gap-8 xl:grid-cols-2">
          <div className="order-1">
            <div className="relative mx-auto lg:h-[464px]">
              <CategoryChart
                expensesByCategory={expensesByCategory}
                selectedCategory={selectedCategoryType === 'gasto' ? selectedCategoryName : null}
                onCategoryClick={(category) => handleCategoryClick(category, 'gasto')}
              />
            </div>
          </div>

          <div className="order-2 min-h-[420px] lg:h-[464px]">
            {selectedCategoryName ? (
              <CategoryTrendChart
                categoryName={selectedCategoryName}
                transactionType={selectedCategoryType}
                transactions={transactions}
                onClose={handleClearCategorySelection}
              />
            ) : (
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
            )}
          </div>
        </div>

        {showIncomeHeatmap && (
          <div className="mb-6 sm:mb-8">
            <CategoryChart
              expensesByCategory={incomeByCategory}
              variant="ingreso"
              selectedCategory={selectedCategoryType === 'ingreso' ? selectedCategoryName : null}
              onCategoryClick={(category) => handleCategoryClick(category, 'ingreso')}
            />
          </div>
        )}

        <div
          data-onboarding-section="budgets"
          {...onboardingSpotlightSectionProps(
            tourSpotlightActive && onboardingStep === 'budgets',
            'mb-6 transition-shadow sm:mb-8'
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
          <div
            {...onboardingSpotlightSectionProps(
              tourSpotlightActive && onboardingStep === 'budgets',
              'min-w-0 scroll-mt-24 sm:scroll-mt-28'
            )}
          >
            <MyCategoriesSection showOnboardingTip={showTour && onboardingStep === 'budgets'} />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:mb-6 lg:grid-cols-3">
          <div
            data-onboarding-section="add-transaction"
            {...onboardingSpotlightSectionProps(
              tourSpotlightActive && onboardingStep === 'add-transaction',
              'scroll-mt-20 lg:col-span-1 lg:h-[100%] sm:scroll-mt-24'
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
          {...onboardingSpotlightSectionProps(
            tourSpotlightActive && onboardingStep === 'whatsapp',
            'mb-6 sm:mb-8'
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
            isSuperUser={profilePlan.is_super_user}
          />
        </div>
      </main>

      <Dialog
        open={categoryDetailOpen}
        onOpenChange={(open) => {
          setCategoryDetailOpen(open)
        }}
      >
        <DialogContent className="max-w-lg border border-border bg-card text-card-foreground dark:border-white/20 dark:bg-[#0D1D35] dark:text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryName ? `Detalle: ${selectedCategoryName}` : 'Detalle de categoría'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategoryType === 'ingreso'
                ? 'Transacciones de ingreso registradas en esta categoria durante el mes actual.'
                : 'Transacciones de gasto registradas en esta categoria durante el mes actual.'}
            </DialogDescription>
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
