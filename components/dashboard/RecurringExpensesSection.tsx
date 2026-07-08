'use client'

import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Pause,
  Pencil,
  Play,
  Plus,
  Receipt,
  Trash2,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategorySelectWithIcons } from '@/components/dashboard/CategorySelectWithIcons'
import { useCategories } from '@/hooks/useCategories'
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses'
import type { RecurringExpenseDTO } from '@/features/recurring-expenses/dto/recurringExpenseDTO'
import type { RecurringFrequency, RecurringExpenseStatus } from '@/lib/recurring-expenses'
import { cn } from '@/lib/utils'

interface RecurringExpensesSectionProps {
  onTransactionCreated?: () => Promise<void> | void
  monthlyIncome?: number
}

type FilterStatus = 'all' | RecurringExpenseStatus

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const statusLabels: Record<RecurringExpenseStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  ended: 'Terminada',
}

const statusClasses: Record<RecurringExpenseStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  paused: 'bg-amber-500/10 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
  ended: 'bg-slate-500/10 text-slate-600 dark:bg-white/10 dark:text-white/60',
}

const getDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

const getTodayKey = () => getDateKey()

const getTomorrowKey = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getDateKey(tomorrow)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const parseAmount = (value: string) => Number(value.replace(/[^\d]/g, ''))

export const RecurringExpensesSection = ({
  onTransactionCreated,
  monthlyIncome = 0,
}: RecurringExpensesSectionProps) => {
  const {
    items,
    loading,
    error,
    activeMonthlyTotal,
    create,
    update,
    pause,
    resume,
    remove,
    generateNow,
  } = useRecurringExpenses(onTransactionCreated)
  const { gastoCategories, loading: categoriesLoading } = useCategories()

  const [filter, setFilter] = useState<FilterStatus>('active')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RecurringExpenseDTO | null>(null)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [nextChargeDate, setNextChargeDate] = useState(getTodayKey())
  const [autoCreate, setAutoCreate] = useState(true)
  const [notes, setNotes] = useState('')

  const activeItems = items.filter((item) => item.status === 'active')
  const nextCharge = [...activeItems].sort((a, b) =>
    a.nextChargeDate.localeCompare(b.nextChargeDate)
  )[0]
  const tomorrowCharges = activeItems.filter(
    (item) => item.autoCreate && item.nextChargeDate === getTomorrowKey()
  )
  const committedPercentage = monthlyIncome > 0
    ? Math.min(999, Math.round((activeMonthlyTotal / monthlyIncome) * 100))
    : null
  const filteredItems = useMemo(
    () => items.filter((item) => filter === 'all' || item.status === filter),
    [filter, items]
  )

  const resetForm = () => {
    setEditingItem(null)
    setName('')
    setAmount('')
    setCategoryId('')
    setFrequency('monthly')
    setNextChargeDate(getTodayKey())
    setAutoCreate(true)
    setNotes('')
    setFormError(null)
  }

  const openEdit = (item: RecurringExpenseDTO) => {
    setEditingItem(item)
    setName(item.name)
    setAmount(String(Math.round(item.amount)))
    setCategoryId(item.categoryId)
    setFrequency(item.frequency)
    setNextChargeDate(item.nextChargeDate)
    setAutoCreate(item.autoCreate)
    setNotes(item.notes || '')
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const numericAmount = parseAmount(amount)

    if (!name.trim()) {
      setFormError('Escribe el nombre del gasto fijo.')
      return
    }
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Ingresa un valor mayor a 0.')
      return
    }
    if (!categoryId) {
      setFormError('Selecciona una categoria.')
      return
    }
    if (!nextChargeDate) {
      setFormError('Selecciona la proxima fecha.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name,
        amount: numericAmount,
        categoryId,
        merchant: name,
        frequency,
        billingDay: Number(nextChargeDate.slice(8, 10)),
        nextChargeDate,
        startsAt: nextChargeDate,
        autoCreate,
        notes,
      }

      if (editingItem) {
        await update(editingItem.id, payload)
      } else {
        await create(payload)
      }

      resetForm()
      setIsFormOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setWorkingId(id)
    try {
      await action()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo completar la accion.')
    } finally {
      setWorkingId(null)
    }
  }

  const handleGenerateNow = (item: RecurringExpenseDTO) =>
    runAction(item.id, async () => {
      const created = await generateNow(item)
      if (!created) alert('Este gasto fijo ya fue generado para este periodo.')
    })

  const handleDelete = (item: RecurringExpenseDTO) => {
    const confirmed = window.confirm(
      `Vas a eliminar "${item.name}". Las transacciones ya creadas se conservan. ¿Deseas continuar?`
    )
    if (!confirmed) return
    void runAction(item.id, () => remove(item.id))
  }

  return (
    <div
      className="
        h-full rounded-2xl border border-border bg-card p-4 text-card-foreground
        dark:border-white/20 dark:bg-transparent dark:bg-gradient-to-br
        dark:from-white/10 dark:to-white/5 dark:text-white dark:backdrop-blur-lg sm:p-6
      "
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-[#5ce1e6] dark:to-[#4dd0e1] dark:text-[#0D1D35]">
            <WalletCards className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Gastos fijos
            </h3>
            <p className="text-xs text-muted-foreground dark:text-white/70">
              Suscripciones y pagos automaticos
            </p>
          </div>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-md border border-border bg-card text-card-foreground dark:border-white/20 dark:bg-[#0D1D35] dark:text-white"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-center">
                {editingItem ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recurring-name">Nombre *</Label>
                <Input
                  id="recurring-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Netflix, internet, gimnasio..."
                  maxLength={80}
                  className="dark:border-white/20 dark:bg-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-amount">Valor *</Label>
                <Input
                  id="recurring-amount"
                  value={amount ? formatCurrency(parseAmount(amount)) : ''}
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
                  placeholder="$0"
                  className="dark:border-white/20 dark:bg-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-category">Categoria *</Label>
                <CategorySelectWithIcons
                  id="recurring-category"
                  categories={gastoCategories}
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={categoriesLoading}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurring-frequency">Frecuencia</Label>
                  <select
                    id="recurring-frequency"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value as RecurringFrequency)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary dark:border-white/20 dark:bg-white/10 dark:text-white"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring-next-date">Proximo cobro *</Label>
                  <Input
                    id="recurring-next-date"
                    type="date"
                    value={nextChargeDate}
                    onChange={(event) => setNextChargeDate(event.target.value)}
                    className="dark:border-white/20 dark:bg-white/10"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <input
                  type="checkbox"
                  checked={autoCreate}
                  onChange={(event) => setAutoCreate(event.target.checked)}
                  className="h-4 w-4"
                />
                Crear transaccion automaticamente cuando llegue la fecha
              </label>

              <div className="space-y-2">
                <Label htmlFor="recurring-notes">Notas</Label>
                <Input
                  id="recurring-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opcional"
                  maxLength={120}
                  className="dark:border-white/20 dark:bg-white/10"
                />
              </div>

              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsFormOpen(false)
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] text-muted-foreground dark:text-white/60">
            Fijos activos / mes
          </p>
          <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            {formatCurrency(activeMonthlyTotal)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground dark:text-white/60">
            {committedPercentage !== null
              ? `${committedPercentage}% de tus ingresos mensuales`
              : 'Registra ingresos para calcular impacto'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] text-muted-foreground dark:text-white/60">
            Proximo cobro
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
            {nextCharge ? nextCharge.name : 'Sin cobros'}
          </p>
          {nextCharge && (
            <p className="truncate text-[11px] text-muted-foreground dark:text-white/60">
              {nextCharge.formattedAmount} · {nextCharge.formattedNextChargeDate}
            </p>
          )}
        </div>
      </div>

      {tomorrowCharges.length > 0 && (
        <div className="mb-4 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-900 dark:text-cyan-100">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                {tomorrowCharges.length === 1
                  ? `Mañana se registra ${tomorrowCharges[0].name} por ${tomorrowCharges[0].formattedAmount}.`
                  : `Mañana se registran ${tomorrowCharges.length} gastos fijos.`}
              </p>
              {tomorrowCharges.length > 1 && (
                <p className="mt-1 truncate text-xs opacity-80">
                  {tomorrowCharges
                    .map((item) => `${item.name} ${item.formattedAmount}`)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {[
          ['active', 'Activas'],
          ['ended', 'Terminadas'],
          ['all', 'Todas'],
          ['paused', 'Pausadas'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as FilterStatus)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              filter === value
                ? 'border-primary bg-primary text-primary-foreground dark:border-[#5ce1e6] dark:bg-[#5ce1e6] dark:text-[#0D1D35]'
                : 'border-border bg-background text-muted-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-8 text-center dark:border-white/10 dark:bg-white/5">
          <Receipt className="mx-auto mb-3 h-8 w-8 text-muted-foreground dark:text-white/50" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No hay gastos fijos
          </p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-white/60">
            Crea Netflix, internet, arriendo o cualquier pago recurrente.
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border dark:border-white/10">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border-b border-border bg-muted/35 px-3 py-2.5 transition last:border-b-0 hover:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', statusClasses[item.status])}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground dark:text-white/65">
                    {item.categoryName} · {frequencyLabels[item.frequency]}
                    {item.frequency === 'monthly' && item.billingDay ? ` · Dia ${item.billingDay}` : ''}
                  </p>
                </div>
                <div className="hidden min-w-0 items-center gap-1 text-xs text-muted-foreground dark:text-white/60 lg:flex">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Proximo: {item.formattedNextChargeDate}</span>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-amber-700 dark:text-amber-300">
                  {item.formattedAmount}
                </p>

              <div className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1 lg:justify-end">
                <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground dark:text-white/60 lg:hidden">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.formattedNextChargeDate}</span>
                </p>
                <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(item)}
                  disabled={workingId === item.id || item.status === 'ended'}
                  title="Editar"
                  className="h-8 w-8 px-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Editar</span>
                </Button>

                {item.status === 'active' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runAction(item.id, () => pause(item.id))}
                    disabled={workingId === item.id}
                    title="Pausar"
                    className="h-8 w-8 px-0"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span className="sr-only">Pausar</span>
                  </Button>
                ) : item.status === 'paused' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runAction(item.id, () => resume(item.id))}
                    disabled={workingId === item.id}
                    title="Activar"
                    className="h-8 w-8 px-0"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span className="sr-only">Activar</span>
                  </Button>
                ) : null}

                {item.status !== 'ended' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateNow(item)}
                      disabled={workingId === item.id}
                      title="Generar periodo"
                      className="h-8 w-8 px-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Generar periodo</span>
                    </Button>
                    <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={workingId === item.id}
                          title="Eliminar"
                          className="h-8 w-8 border-red-500/30 px-0 text-red-600 hover:bg-red-500/10 dark:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                  </>
                )}

                {item.status === 'ended' && (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground dark:text-white/50" title="Historial">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Historial</span>
                  </span>
                )}
              </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
