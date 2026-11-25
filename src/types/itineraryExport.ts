export interface ItineraryExportTripInfo {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  totalDays: number
}

export interface ItineraryExportNode {
  id: string
  title: string
  type: string
  typeName: string
  startTime?: string | null
  endTime?: string | null
  locationName?: string | null
  locationAddress?: string | null
  note?: string | null
  sortOrder?: number | null
}

export interface ItineraryExportDay {
  id: string
  dayIndex: number
  date: string
  nodeCount: number
  nodes: ItineraryExportNode[]
}

export interface ItineraryExportMeta {
  totalDayCount: number
  totalNodeCount: number
  selectedDayCount: number
  selectedNodeCount: number
}

export interface ItineraryExportWatermark {
  enabled: boolean
  text: string
}

export interface ItineraryExportAssetsResponse {
  trip: ItineraryExportTripInfo
  days: ItineraryExportDay[]
  meta: ItineraryExportMeta
  watermark: ItineraryExportWatermark
}

export function getItineraryNodeTimeText(node: ItineraryExportNode): string | null {
  const { startTime, endTime } = node
  if (startTime && endTime) return `${startTime} - ${endTime}`
  if (startTime) return startTime
  if (endTime) return endTime
  return null
}

export function getItineraryNodeLocationText(node: ItineraryExportNode): string | null {
  if (node.locationAddress) return node.locationAddress
  if (node.locationName) return node.locationName
  return null
}
