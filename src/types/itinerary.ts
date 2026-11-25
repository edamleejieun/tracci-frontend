import type { PlaceInfo } from '@/types/location'

export type ItineraryNodeType =
  | 'attraction'
  | 'restaurant'
  | 'transport'
  | 'hotel'
  | 'shopping'
  | 'other'

/** Phase 1 交通工具枚举（与后端契约一致） */
export type TransportMode = 'flight' | 'train' | 'hsr' | 'bus' | 'driving' | 'other'

/** 节点类型扩展字段；空时响应可省略 */
export interface ItineraryNodeDetails {
  kind?: 'transport' | 'hotel'
  mode?: TransportMode | string
  flightNo?: string
  airline?: string
  trainNo?: string
  busNo?: string
  departureName?: string
  arrivalName?: string
  seatInfo?: string
  confirmationCode?: string
  checkInTime?: string
  checkOutTime?: string
  /** Phase 2 hotel stay（服务端托管；客户端只读） */
  stayGroupId?: string
  stayRole?: 'check_in' | 'stay' | string
  checkInDate?: string
  checkOutDate?: string
  nightIndex?: number
  totalNights?: number
}

/** 行程节点结构化地点（与后端 location 对象一致） */
export type NodeLocation = PlaceInfo

export interface ItineraryNode {
  id: string
  tripDayId: string
  title: string
  type: ItineraryNodeType
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  address?: string
  location?: NodeLocation
  note?: string
  details?: ItineraryNodeDetails
  sortOrder: number
  createdAt?: string
}

export interface TripDay {
  id: string
  dayIndex: number
  date: string // YYYY-MM-DD
  nodes: ItineraryNode[]
}

export interface ItineraryResponse {
  tripId: string
  days: TripDay[]
}

export interface CreateItineraryNodeRequest {
  title?: string
  type: ItineraryNodeType
  startTime?: string
  endTime?: string
  address?: string
  location: NodeLocation
  note?: string
  details?: ItineraryNodeDetails
}

export interface UpdateItineraryNodeRequest {
  title?: string
  type?: ItineraryNodeType
  startTime?: string
  endTime?: string
  address?: string
  /** 传空对象 `{}` 可清空结构化地点 */
  location?: NodeLocation | Record<string, never>
  note?: string
  /** null/缺省=不修改；`{}` 或对象=整体替换 */
  details?: ItineraryNodeDetails | Record<string, never>
}

export interface ReorderItineraryNodesRequest {
  nodeIds: string[]
}

export const TRANSPORT_MODE_OPTIONS: Array<{
  value: TransportMode
  label: string
  icon: string
}> = [
  { value: 'flight', label: '飞机', icon: 'i-carbon-airport-01' },
  { value: 'train', label: '火车', icon: 'i-carbon-train' },
  { value: 'hsr', label: '高铁', icon: 'i-carbon-train' },
  { value: 'bus', label: '大巴', icon: 'i-carbon-bus' },
  { value: 'driving', label: '自驾', icon: 'i-carbon-car' },
  { value: 'other', label: '其他', icon: 'i-carbon-arrows-horizontal' }
]

export function formatNodeDetailsSummary(node: ItineraryNode): string | null {
  const d = node.details
  if (!d) return null

  if (node.type === 'transport' || d.kind === 'transport') {
    const parts: string[] = []
    const mode = d.mode
    if (mode === 'flight' && d.flightNo) {
      parts.push(d.flightNo)
      if (d.airline) parts.push(d.airline)
    } else if ((mode === 'train' || mode === 'hsr') && d.trainNo) {
      parts.push(d.trainNo)
    } else if (mode === 'bus' && d.busNo) {
      parts.push(d.busNo)
    }
    if (d.departureName && d.arrivalName) {
      parts.push(`${d.departureName} → ${d.arrivalName}`)
    } else if (d.departureName) {
      parts.push(`出发：${d.departureName}`)
    } else if (d.arrivalName) {
      parts.push(`到达：${d.arrivalName}`)
    }
    if (d.seatInfo) parts.push(d.seatInfo)
    return parts.length ? parts.join(' · ') : null
  }

  if (node.type === 'hotel' || d.kind === 'hotel') {
    const parts: string[] = []
    if (d.totalNights && d.totalNights > 0) {
      if (d.nightIndex && d.totalNights > 1) {
        parts.push(`第 ${d.nightIndex}/${d.totalNights} 晚`)
      } else if (d.totalNights > 1) {
        parts.push(`住 ${d.totalNights} 晚`)
      } else {
        parts.push('住 1 晚')
      }
    }
    if (d.checkOutDate) {
      const segs = d.checkOutDate.split('-')
      if (segs.length === 3) {
        parts.push(`离店 ${Number(segs[1])}月${Number(segs[2])}日`)
      } else {
        parts.push(`离店 ${d.checkOutDate}`)
      }
    }
    if (d.confirmationCode) parts.push(`确认号 ${d.confirmationCode}`)
    if (d.checkOutTime) parts.push(`退房 ${d.checkOutTime}`)
    return parts.length ? parts.join(' · ') : null
  }

  return null
}

export function isHotelStayProjection(node: ItineraryNode): boolean {
  return node.type === 'hotel' && node.details?.stayRole === 'stay'
}

export function isHotelStayPrimary(node: ItineraryNode): boolean {
  return (
    node.type === 'hotel' &&
    !!node.details?.stayGroupId &&
    node.details?.stayRole !== 'stay'
  )
}

export function transportModeLabel(mode?: string): string | null {
  if (!mode) return null
  return TRANSPORT_MODE_OPTIONS.find(item => item.value === mode)?.label ?? null
}
