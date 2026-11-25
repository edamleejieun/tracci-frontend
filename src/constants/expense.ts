import { EXPENSE_CATEGORY_COLORS } from '@/constants/designTokens'

export const EXPENSE_CATEGORIES = [
  { key: 'food', name: '餐饮', emoji: '🍴', color: EXPENSE_CATEGORY_COLORS.food },
  { key: 'transport', name: '交通', emoji: '🚇', color: EXPENSE_CATEGORY_COLORS.transport },
  { key: 'hotel', name: '住宿', emoji: '🏨', color: EXPENSE_CATEGORY_COLORS.hotel },
  { key: 'attraction', name: '景点', emoji: '🎡', color: EXPENSE_CATEGORY_COLORS.attraction },
  { key: 'shopping', name: '购物', emoji: '🛍', color: EXPENSE_CATEGORY_COLORS.shopping },
  { key: 'other', name: '其他', emoji: '📦', color: EXPENSE_CATEGORY_COLORS.other }
]

export const getCategoryConfig = (key: string) => {
  const normalized = key?.toLowerCase() || 'other'
  return EXPENSE_CATEGORIES.find(c => c.key === normalized) || EXPENSE_CATEGORIES[5]
}

/** 多币种展示与前端换算预览（提交时仍由后端计算 amountCny） */
export const EXPENSE_CURRENCIES = [
  { code: 'CNY', symbol: '¥', label: '人民币', rate: 1 },
  { code: 'USD', symbol: '$', label: '美元', rate: 7.24 },
  { code: 'JPY', symbol: '¥', label: '日元', rate: 0.048 },
  { code: 'HKD', symbol: '$', label: '港币', rate: 0.92 },
  { code: 'EUR', symbol: '€', label: '欧元', rate: 7.86 },
  { code: 'KRW', symbol: '₩', label: '韩元', rate: 0.0052 }
] as const

export type ExpenseCurrencyCode = (typeof EXPENSE_CURRENCIES)[number]['code']

/** 当前版本仅支持人民币记账 */
export const EXPENSE_SUPPORTED_CURRENCY: ExpenseCurrencyCode = 'CNY'

export function getCurrencyConfig(code: string) {
  return EXPENSE_CURRENCIES.find(c => c.code === code) ?? EXPENSE_CURRENCIES[0]
}

export function previewCnyAmount(amountInput: string, currency: string): string | null {
  if (currency === 'CNY') return null
  const num = Number(amountInput)
  if (!amountInput || Number.isNaN(num) || num <= 0) return null
  const cfg = getCurrencyConfig(currency)
  return (num * cfg.rate).toFixed(2)
}
