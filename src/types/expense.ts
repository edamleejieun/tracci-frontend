/** 开支范围：个人 / 团队 */
export type ExpenseScope = 'personal' | 'group'

/** 分摊方式（首阶段仅 equal） */
export type SplitMethod = 'equal'

/**
 * 是否团队/AA 开支。
 * 契约与生产接口为 `group`；Demo Fixture 曾序列化为 `GROUP`，比较时忽略大小写。
 */
export function isGroupExpenseScope(scope?: string | null): boolean {
  return (scope || '').toLowerCase() === 'group'
}

export interface ExpenseItem {
  id: string
  tripId: string
  amountInput: string
  currency: string
  amountCny: string
  exchangeRate: string
  category: string
  note?: string
  spentAt: string
  createdAt: string
  /**
   * 团队开支字段（已实现，expenseScope=group 时 payerMemberId / participantMemberIds 必填）
   */
  expenseScope?: ExpenseScope
  payerMemberId?: string
  participantMemberIds?: string[]
  splitMethod?: SplitMethod
  createdByMemberId?: string
}

export interface CreateExpenseRequest {
  amountInput: string
  currency: string
  category: string
  note?: string
  spentAt: string
  /** 团队开支字段（已实现，expenseScope=group 时必填） */
  expenseScope?: ExpenseScope
  payerMemberId?: string
  participantMemberIds?: string[]
  splitMethod?: SplitMethod
}

export interface UpdateExpenseRequest {
  amountInput?: string
  currency?: string
  category?: string
  note?: string
  spentAt?: string
  /** 团队开支字段（已实现） */
  expenseScope?: ExpenseScope
  payerMemberId?: string
  participantMemberIds?: string[]
  splitMethod?: SplitMethod
}

export interface ExpenseCategoryBreakdown {
  category: string
  amountCny: string
  count: number
  ratio: number
}

export interface ExpenseSummary {
  totalCny: string
  perDayCny: string
  expenseCount: number
  breakdown: ExpenseCategoryBreakdown[]
}

export interface ExpenseListResponse {
  list: ExpenseItem[]
  total: number
  page: number
  pageSize: number
}
