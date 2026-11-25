import type { ItineraryExportAssetsResponse, ItineraryExportDay } from '@/types/itineraryExport'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function shortDateLabel(date: string): string {
  if (!date) return ''
  const parts = date.split('-')
  if (parts.length !== 3) return date
  return `${parts[1]}.${parts[2]}`
}

function weekdayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return WEEKDAY_LABELS[parsed.getDay()] ?? ''
}

function formatSubtitleDateRange(startDate: string, endDate: string): string {
  return `${shortDateLabel(startDate)}至${shortDateLabel(endDate)}`
}

function formatDaySection(day: ItineraryExportDay): string[] {
  const lines: string[] = []
  lines.push(`${shortDateLabel(day.date)} / ${weekdayLabel(day.date)}`.trim())

  if (!day.nodes.length) {
    lines.push('  （暂无行程节点）')
    return lines
  }

  for (const node of day.nodes) {
    const name = node.locationName?.trim() || node.title
    const time = node.startTime?.trim()
    lines.push(time ? `  ${name}  ${time}` : `  ${name}`)
  }

  return lines
}

export function buildItineraryPlainText(assets: ItineraryExportAssetsResponse): string {
  const { trip, days } = assets
  const lines: string[] = [
    `${trip.title} 行程单`,
    formatSubtitleDateRange(trip.startDate, trip.endDate),
    ''
  ]

  for (const day of days) {
    if (!day.nodes.length) continue
    lines.push(...formatDaySection(day))
    lines.push('')
  }

  lines.push('— 由趣溪生成')
  return lines.join('\n').trimEnd()
}

export function hasItineraryExportContent(assets: ItineraryExportAssetsResponse): boolean {
  return assets.days.some(day => day.nodes.length > 0)
}
