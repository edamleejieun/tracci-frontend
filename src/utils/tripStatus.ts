import type { TripStatus } from '@/types/trip'

/** 格式化为 YYYY-MM-DD（本地时区） */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 根据旅行起止日期计算展示用状态（与后端 MVP 规则一致）
 * - now < startDate → planning
 * - startDate <= now <= endDate → ongoing
 * - now > endDate → completed
 */
export function computeTripStatusFromDates(
  startDate: string,
  endDate: string
): TripStatus | null {
  if (!startDate || !endDate) return null

  const today = formatLocalDate(new Date())
  if (today < startDate) return 'planning'
  if (today > endDate) return 'completed'
  return 'ongoing'
}
