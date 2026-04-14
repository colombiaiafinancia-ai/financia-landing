import { categoryBudgetRepository } from '../infrastructure/categoryBudgetRepository'
import { transactionRepository } from '@/features/transactions/infrastructure/transactionRepository'
import { categoryRepository } from '@/features/categories/infrastructure/categoryRepository'

export interface CategoryBudgetWithSpent {
  categoryId: string
  categoryName: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
}

export class CategoryBudgetService {
  async getUserBudgetsWithSpent(userId: string, monthDate: string): Promise<CategoryBudgetWithSpent[]> {
    // 1. Obtener todos los presupuestos del usuario
    const budgets = await categoryBudgetRepository.findAllByUser(userId)
    if (budgets.length === 0) return []

    const monthStart = new Date(`${monthDate}T00:00:00`)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

    // 2. Obtener transacciones reales del mes y categorías en paralelo
    const [monthTransactions, allCategories] = await Promise.all([
      transactionRepository.findByUserAndPeriod(
        userId,
        monthStart.toISOString(),
        new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).toISOString()
      ),
      categoryRepository.findAllForUser(userId) // usa el nuevo método
    ])

    // 3. Crear mapas para acceso rápido O(1)
    const expenseMap = monthTransactions.reduce((map, tx) => {
      if (tx.direction !== 'gasto') return map
      const current = map.get(tx.category_id) || 0
      map.set(tx.category_id, current + tx.amount)
      return map
    }, new Map<string, number>())
    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]))

    // 4. Combinar resultados
    return budgets.map(budget => {
      const spent = expenseMap.get(budget.category_id) || 0
      const remaining = budget.amount - spent
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'safe'

      return {
        categoryId: budget.category_id,
        categoryName: categoryNameMap.get(budget.category_id) || 'Desconocida',
        budgeted: budget.amount,
        spent,
        remaining,
        percentage,
        status
      }
    })
  }

  async saveBudget(userId: string, categoryId: string, amount: number): Promise<void> {
    await categoryBudgetRepository.upsert(userId, categoryId, amount)
  }

  async deleteBudget(userId: string, categoryId: string): Promise<void> {
    await categoryBudgetRepository.delete(userId, categoryId)
  }
}

export const categoryBudgetService = new CategoryBudgetService()