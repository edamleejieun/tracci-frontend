import type { TripDay } from '@/types/itinerary'
import type { TripStatus } from '@/types/trip'

export type ItineraryNodeStatus = 'completed' | 'current' | 'upcoming' | 'pending'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** YYYY-MM-DD → MM.DD */
export function formatItineraryDayDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 3) return `${parts[1]}.${parts[2]}`
  return dateStr.replace(/-/g, '.')
}

export function formatItineraryWeekday(dateStr: string): string {
  if (!dateStr) return ''
  const normalized = dateStr.replace(/-/g, '/')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return ''
  return WEEKDAY_LABELS[d.getDay()]
}

function startOfDay(dateStr: string): Date {
  const normalized = dateStr.replace(/-/g, '/')
  const d = new Date(normalized)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseNodeDateTime(dayDate: string, time?: string): Date | null {
  if (!time) return null
  const normalized = dayDate.replace(/-/g, '/')
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const d = new Date(normalized)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * 根据日期与开始时间推算节点展示状态（纯 UI，不写回后端）
 * @param options.ignoreWallClock 示例/只读橱窗：不跟真实「今天」比，仅按 tripStatus 给静态态
 */
export function computeNodeStatuses(
  day: TripDay,
  tripStatus?: TripStatus,
  options?: { ignoreWallClock?: boolean }
): Record<string, ItineraryNodeStatus> {
  const result: Record<string, ItineraryNodeStatus> = {}
  const nodes = [...(day.nodes || [])].sort((a, b) => a.sortOrder - b.sortOrder)

  if (nodes.length === 0) return result

  // 示例展示：日期是 Bundle 固定剧本，不与墙钟对齐（对齐 iOS）
  if (options?.ignoreWallClock) {
    const staticStatus: ItineraryNodeStatus =
      tripStatus === 'completed' ? 'completed' : tripStatus === 'ongoing' ? 'upcoming' : 'pending'
    nodes.forEach(n => {
      result[n.id] = staticStatus
    })
    return result
  }

  const now = new Date()
  const dayStart = startOfDay(day.date)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  if (tripStatus === 'completed' || dayStart < todayStart) {
    nodes.forEach(n => {
      result[n.id] = 'completed'
    })
    return result
  }

  if (tripStatus === 'planning' || dayStart > todayStart) {
    nodes.forEach(n => {
      result[n.id] = 'pending'
    })
    return result
  }

  // 当天或进行中旅行的当日
  let currentAssigned = false
  nodes.forEach(node => {
    const nodeTime = parseNodeDateTime(day.date, node.startTime)
    if (nodeTime && nodeTime.getTime() <= now.getTime()) {
      result[node.id] = 'completed'
      return
    }
    if (!currentAssigned) {
      result[node.id] = 'current'
      currentAssigned = true
      return
    }
    result[node.id] = 'upcoming'
  })

  return result
}

export const NODE_STATUS_LABELS: Record<ItineraryNodeStatus, string> = {
  completed: '已完成',
  current: '进行中',
  upcoming: '未开始',
  pending: '未开始'
}
