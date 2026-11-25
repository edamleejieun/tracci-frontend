import type { TripStatus, CoverPhoto } from './trip'
import type { ItineraryNode } from './itinerary'

export interface SummaryTripInfo {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  dayCount: number
  status: TripStatus
  coverPhoto?: CoverPhoto
}

export interface SummaryStats {
  dayCount: number
  itineraryCount: number
  journalCount: number
  photoCount: number
  expenseCount: number
  highlightCount: number
  totalExpenseAmount: string
  currency: string
}

export interface SummaryExpenseCategoryStat {
  category: string
  categoryName?: string
  amount: string
  percentage: string
  count?: number
}

export interface SummaryExpense {
  totalAmount: string
  currency: string
  categoryStats: SummaryExpenseCategoryStat[]
}

export interface SummaryPhotoItem {
  fileId: string
  journalId: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  width?: number
  height?: number
  sortOrder: number
}

export interface SummaryLogItem {
  id: string
  content: string
  locationName?: string
  logTime: string
  photos: SummaryPhotoItem[]
}

export interface SummaryDailyTimelineItem {
  date: string
  dayIndex: number
  itineraries: ItineraryNode[]
  logs: SummaryLogItem[]
}

export interface TripSummaryResponse {
  trip: SummaryTripInfo
  stats: SummaryStats
  expenseSummary: SummaryExpense
  highlightLogs: SummaryLogItem[]
  featuredPhotos: SummaryPhotoItem[]
  dailyTimeline: SummaryDailyTimelineItem[]
}
