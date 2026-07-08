import { categoryRepository } from '@/features/categories/infrastructure/categoryRepository'
import { transactionRepository } from '@/features/transactions/infrastructure/transactionRepository'
import {
  buildRecurringTransactionMeta,
  getNextChargeDate,
  getPeriodKey,
  type RecurringExpenseStatus,
} from '@/lib/recurring-expenses'
import {
  recurringExpenseRepository,
  type RecurringExpenseEntity,
} from '../infrastructure/recurringExpenseRepository'
import type {
  CreateRecurringExpenseDTO,
  RecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from '../dto/recurringExpenseDTO'

export class RecurringExpenseUseCases {
  async getAll(userId: string): Promise<RecurringExpenseDTO[]> {
    const rows = await recurringExpenseRepository.findAllByUser(userId)
    return Promise.all(rows.map((row) => this.mapEntityToDTO(row)))
  }

  async create(userId: string, data: CreateRecurringExpenseDTO): Promise<RecurringExpenseDTO> {
    this.validate(data)

    const row = await recurringExpenseRepository.create({
      user_id: userId,
      name: data.name.trim(),
      amount: data.amount,
      category_id: data.categoryId,
      merchant: data.merchant?.trim() || data.name.trim(),
      frequency: data.frequency,
      billing_day: data.billingDay || this.getDayFromDateKey(data.nextChargeDate),
      next_charge_date: data.nextChargeDate,
      starts_at: data.startsAt || data.nextChargeDate,
      auto_create: data.autoCreate ?? true,
      notes: data.notes?.trim() || null,
    })

    return this.mapEntityToDTO(row)
  }

  async update(
    userId: string,
    recurringExpenseId: string,
    data: UpdateRecurringExpenseDTO
  ): Promise<RecurringExpenseDTO> {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('El valor debe ser mayor a 0')
    }
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('El nombre es obligatorio')
    }

    const patch: Partial<RecurringExpenseEntity> = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.categoryId !== undefined ? { category_id: data.categoryId } : {}),
      ...(data.merchant !== undefined ? { merchant: data.merchant?.trim() || null } : {}),
      ...(data.frequency !== undefined ? { frequency: data.frequency } : {}),
      ...(data.billingDay !== undefined ? { billing_day: data.billingDay } : {}),
      ...(data.nextChargeDate !== undefined ? { next_charge_date: data.nextChargeDate } : {}),
      ...(data.startsAt !== undefined ? { starts_at: data.startsAt } : {}),
      ...(data.autoCreate !== undefined ? { auto_create: data.autoCreate } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    }

    if (data.status === 'ended') {
      patch.ended_at = new Date().toISOString()
      patch.ends_at = new Date().toISOString().slice(0, 10)
      patch.auto_create = false
    }

    const row = await recurringExpenseRepository.update(userId, recurringExpenseId, patch)
    return this.mapEntityToDTO(row)
  }

  async pause(userId: string, recurringExpenseId: string): Promise<RecurringExpenseDTO> {
    return this.updateStatus(userId, recurringExpenseId, 'paused')
  }

  async resume(userId: string, recurringExpenseId: string): Promise<RecurringExpenseDTO> {
    return this.updateStatus(userId, recurringExpenseId, 'active')
  }

  async end(userId: string, recurringExpenseId: string): Promise<RecurringExpenseDTO> {
    return this.update(userId, recurringExpenseId, { status: 'ended' })
  }

  async delete(userId: string, recurringExpenseId: string): Promise<void> {
    await recurringExpenseRepository.delete(userId, recurringExpenseId)
  }

  async generateTransactionNow(
    userId: string,
    recurringExpense: RecurringExpenseDTO
  ): Promise<boolean> {
    const chargeDateKey = recurringExpense.nextChargeDate
    const period = getPeriodKey(chargeDateKey, recurringExpense.frequency)
    const existing = await transactionRepository.findAllByUser(userId)
    const alreadyCreated = existing.some((tx) =>
      tx.meta?.type === 'recurring_expense' &&
      tx.meta?.recurring_expense_id === recurringExpense.id &&
      tx.meta?.period === period
    )

    if (alreadyCreated) return false

    await transactionRepository.create({
      user_id: userId,
      direction: 'gasto',
      amount: recurringExpense.amount,
      category_id: recurringExpense.categoryId,
      description: `Gasto fijo: ${recurringExpense.name}`,
      merchant: recurringExpense.merchant || recurringExpense.name,
      occurred_at: `${chargeDateKey}T12:00:00.000Z`,
      meta: buildRecurringTransactionMeta(
        recurringExpense.id,
        period,
        recurringExpense.frequency
      ),
    })

    await recurringExpenseRepository.update(userId, recurringExpense.id, {
      next_charge_date: getNextChargeDate(
        recurringExpense.nextChargeDate,
        recurringExpense.frequency,
        recurringExpense.billingDay
      ),
    })

    return true
  }

  private async updateStatus(
    userId: string,
    recurringExpenseId: string,
    status: RecurringExpenseStatus
  ) {
    const row = await recurringExpenseRepository.update(userId, recurringExpenseId, {
      status,
      ...(status === 'active' ? { ended_at: null, ends_at: null } : {}),
    })
    return this.mapEntityToDTO(row)
  }

  private async mapEntityToDTO(row: RecurringExpenseEntity): Promise<RecurringExpenseDTO> {
    const category = await categoryRepository.findById(row.category_id)
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      amount: Number(row.amount) || 0,
      categoryId: row.category_id,
      categoryName: category?.name || 'Sin categoria',
      merchant: row.merchant,
      frequency: row.frequency,
      billingDay: row.billing_day,
      nextChargeDate: row.next_charge_date,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      autoCreate: row.auto_create,
      notes: row.notes,
      formattedAmount: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(row.amount) || 0),
      formattedNextChargeDate: new Date(`${row.next_charge_date}T12:00:00`).toLocaleDateString(
        'es-CO',
        { year: 'numeric', month: 'short', day: 'numeric' }
      ),
    }
  }

  private validate(data: CreateRecurringExpenseDTO) {
    if (!data.name.trim()) throw new Error('El nombre es obligatorio')
    if (!data.amount || data.amount <= 0) throw new Error('El valor debe ser mayor a 0')
    if (!data.categoryId) throw new Error('Selecciona una categoria')
    if (!data.nextChargeDate) throw new Error('Selecciona la proxima fecha')
  }

  private getDayFromDateKey(dateKey: string): number {
    return Number(dateKey.split('-')[2]) || 1
  }
}

export const recurringExpenseUseCases = new RecurringExpenseUseCases()
