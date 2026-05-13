import { categoryBudgetRepository } from '../infrastructure/categoryBudgetRepository'
import { monthSummaryRepository } from '@/features/transactions/infrastructure/monthSummaryRepository'
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
    const budgets = await categoryBudgetRepository.findAllByUser(userId)
    if (budgets.length === 0) return []

    const [monthCategoryExpenses, allCategories] = await Promise.all([
      monthSummaryRepository.getMonthCategoryExpenses(userId, monthDate),
      categoryRepository.findAllForUser(userId)
    ])

    const expenseMap = monthCategoryExpenses.reduce((map, item) => {
      map.set(item.category_id, Number(item.total) || 0)
      return map
    }, new Map<string, number>())
    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]))

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
