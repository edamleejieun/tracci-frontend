export type ExportTemplateType = 'travel-cover' | 'film-collage' | 'minimal-summary'

export type ExportFormatType = 'square' | 'portrait'

export type ExportCopyStyle = 'none' | 'concise' | 'mood'

export interface ExportContentOptions {
  showDate: boolean
  showDays: boolean
  showItineraryCount: boolean
  showJournalCount: boolean
  showExpense: boolean
  showVisitedPlaces: boolean
  showExpenseDistribution: boolean
  showWatermark: boolean
  copyStyle: ExportCopyStyle
}

export interface ExportAssetsQuery {
  template?: ExportTemplateType
  format?: ExportFormatType
}

export interface ExportTripInfo {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  totalDays: number
  coverPhoto?: string | null
}

export interface ExportStats {
  itineraryCount: number
  journalCount: number
  photoCount: number
  expenseCount: number
  totalExpenseAmount: number
  averageDailyExpense: number
  currency: string
}

export interface ExportPhotoItem {
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

/** Canvas 导出前已下载的本地图片 */
export interface PreparedCanvasImage {
  fileId: string
  path: string | null
  width: number
  height: number
}

export interface ExportExpenseCategoryStat {
  category: string
  categoryName?: string
  amount: number
  percentage: number
  count?: number
}

export interface ExportWatermark {
  enabled: boolean
  text: string
}

export interface ExportOptions {
  template: ExportTemplateType
  format: ExportFormatType
  contentOptions?: Partial<ExportContentOptions>
}

export interface TripExportAssetsResponse {
  trip: ExportTripInfo
  stats: ExportStats
  photos: ExportPhotoItem[]
  visitedPlaces?: string[]
  expenseCategoryStats: ExportExpenseCategoryStat[]
  watermark: ExportWatermark
  exportOptions: ExportOptions
}
