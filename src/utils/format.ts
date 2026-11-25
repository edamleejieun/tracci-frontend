/** 金额展示（API 金额为 string，本地计算可能为 number） */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'CNY'
): string {
  const num = Number(amount)
  if (Number.isNaN(num)) return currency === 'CNY' ? '¥0.00' : `0.00 ${currency}`
  const fixed = num.toFixed(2)
  if (currency === 'CNY') return `¥${fixed}`
  return `${fixed} ${currency}`
}

/** 日期范围：yyyy-MM-dd ~ yyyy-MM-dd */
export function formatDateRange(start: string, end: string): string {
  if (!start && !end) return ''
  if (!end || start === end) return start || end
  return `${start} ~ ${end}`
}

/** 导出卡片日期展示（与预览一致：2026.05.01 - 05.05） */
export function formatDateRangeShort(start: string, end: string): string {
  if (!start && !end) return ''
  const fmt = (d: string) => d?.replace(/-/g, '.') || ''
  return `${fmt(start)} - ${fmt(end)}`
}

/** 百分比展示（0-100） */
export function formatPercent(value: number | string | null | undefined): string {
  const num = Number(value)
  if (Number.isNaN(num)) return '0%'
  return `${Math.round(num)}%`
}

/** 解析金额为数字 */
export function parseAmount(amount: number | string | null | undefined): number {
  const num = Number(amount)
  return Number.isNaN(num) ? 0 : num
}

/** 是否有有效开支数据 */
export function hasExpenseData(
  totalAmount: number | string | null | undefined,
  categories?: { amount?: number | string }[]
): boolean {
  if (parseAmount(totalAmount) > 0) return true
  if (!categories?.length) return false
  return categories.some(c => parseAmount(c.amount) > 0)
}
