export type StatsScopeType = 'ALL' | 'TRIP'

export interface StatsScope {
  type: StatsScopeType
  tripId?: string
  tripTitle?: string
}

export interface StatsOverview {
  tripCount: number
  totalTravelDays: number
  itineraryCount: number
  journalCount: number
  photoCount: number
  destinationCount: number
  expenseCount: number
  totalExpenseAmount: string
  averageDailyExpense: string
  currency: string
}

export interface StatsExpenseCategory {
  category: string
  categoryName?: string
  amount: string
  percentage: string
  count?: number
}

export interface StatsExpenseStats {
  totalAmount: string
  currency: string
  categoryStats: StatsExpenseCategory[]
}

export interface StatsRecentTrip {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
  totalDays: number
  totalExpenseAmount: string
}

export interface StatsMonthlyTrendItem {
  /** 月份，格式 YYYY-MM，如 "2026-01" */
  yearMonth: string
  /** 当月旅行次数 */
  count: number
  /** 当月开支金额 */
  amount: string
}

export interface StatsDailyTrendItem {
  date: string
  dayIndex: number
  expenseAmount: string
  itineraryCount: number
  journalCount: number
  photoCount: number
  /** 当日亮点文案，后端后续补充 */
  highlight?: string
}

export interface StatsOverviewResponse {
  scope: StatsScope
  overview: StatsOverview
  expenseStats: StatsExpenseStats
  recentTrips?: StatsRecentTrip[]
  monthlyTrend?: StatsMonthlyTrendItem[]
  dailyTrend?: StatsDailyTrendItem[]
}
