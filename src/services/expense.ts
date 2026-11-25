import { http } from '@/utils/http'
import type {
  ExpenseItem,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseSummary,
  ExpenseListResponse
} from '@/types/expense'
import type { SettlementResponse } from '@/types/collaboration'

export class ExpenseService {
  /**
   * 创建开支记录
   */
  static createExpense(tripId: string, data: CreateExpenseRequest): Promise<ExpenseItem> {
    return http<ExpenseItem>({
      url: `/trips/${tripId}/expenses`,
      method: 'POST',
      data
    })
  }

  /**
   * 获取开支列表
   */
  static getExpenses(
    tripId: string,
    params?: { page?: number; pageSize?: number; category?: string }
  ): Promise<ExpenseListResponse> {
    return http<ExpenseListResponse>({
      url: `/trips/${tripId}/expenses`,
      method: 'GET',
      data: params
    })
  }

  /**
   * 更新开支记录
   */
  static updateExpense(
    tripId: string,
    expenseId: string,
    data: UpdateExpenseRequest
  ): Promise<ExpenseItem> {
    return http<ExpenseItem>({
      url: `/trips/${tripId}/expenses/${expenseId}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除开支记录
   */
  static deleteExpense(tripId: string, expenseId: string): Promise<null> {
    return http<null>({
      url: `/trips/${tripId}/expenses/${expenseId}`,
      method: 'DELETE'
    })
  }

  /**
   * 获取开支统计汇总
   */
  static getExpenseSummary(tripId: string): Promise<ExpenseSummary> {
    return http<ExpenseSummary>({
      url: `/trips/${tripId}/expenses/summary`,
      method: 'GET'
    })
  }

  /**
   * 获取 AA 结算汇总
   * 需要登录；当前用户必须是该旅行成员
   */
  static getSettlement(tripId: string): Promise<SettlementResponse> {
    return http<SettlementResponse>({
      url: `/trips/${tripId}/expenses/settlement`,
      method: 'GET'
    })
  }
}
