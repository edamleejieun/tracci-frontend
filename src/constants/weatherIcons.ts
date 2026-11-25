import type { TripWeatherIcon } from '@/types/weather'
import { formatItineraryWeekday } from '@/utils/itineraryStatus'

/** Weather condition label in Chinese. Used for accessible text / tooltip. */
export const weatherLabelMap: Record<TripWeatherIcon, string> = {
  sunny: '晴',
  cloudy: '多云',
  overcast: '阴',
  light_rain: '小雨',
  moderate_rain: '中雨',
  heavy_rain: '大雨',
  snow: '雪',
  fog: '雾',
  unknown: '未知'
}

export function getWeatherLabel(icon?: string): string {
  if (icon && icon in weatherLabelMap) {
    return weatherLabelMap[icon as TripWeatherIcon]
  }
  return '未知'
}

/** 后端/部分 Provider 可能返回 MONDAY / Monday 等英文星期 */
const WEEKDAY_EN_TO_ZH: Record<string, string> = {
  MONDAY: '周一',
  TUESDAY: '周二',
  WEDNESDAY: '周三',
  THURSDAY: '周四',
  FRIDAY: '周五',
  SATURDAY: '周六',
  SUNDAY: '周日',
  MON: '周一',
  TUE: '周二',
  WED: '周三',
  THU: '周四',
  FRI: '周五',
  SAT: '周六',
  SUN: '周日'
}

/**
 * 规范化天气日期字段。
 * 正常为 `yyyy-MM-dd`；部分序列化可能给出 `[y, m, d]` 数组。
 */
export function normalizeWeatherDate(date?: string | number[] | null): string {
  if (!date) return ''
  if (typeof date === 'string') return date
  if (Array.isArray(date) && date.length >= 3) {
    const [y, m, d] = date
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return ''
}

/**
 * 天气星期展示统一为中文（周一…周日）。
 * 优先映射 weekday 字段；否则由 date 推导。
 */
export function formatWeatherWeekdayLabel(
  weekday?: string | null,
  date?: string | number[] | null
): string {
  const raw = (weekday || '').trim()
  if (raw) {
    if (/^周[一二三四五六日天]$/.test(raw)) {
      return raw === '周天' ? '周日' : raw
    }
    const mapped = WEEKDAY_EN_TO_ZH[raw.toUpperCase()]
    if (mapped) return mapped
  }
  const dateStr = normalizeWeatherDate(date)
  if (dateStr) return formatItineraryWeekday(dateStr)
  return raw
}

/**
 * Color mapping for weather icons matching Tracci's warm palette.
 * Sunny → warm amber, rain → soft blue, snow → icy blue, fog → muted brown.
 */
export const weatherColorMap: Record<string, string> = {
  sunny: '#F59E0B',
  cloudy: '#94A3B8',
  overcast: '#8E8E93',
  light_rain: '#60A5FA',
  moderate_rain: '#4B8FD3',
  heavy_rain: '#3B6FB5',
  snow: '#A5C8E8',
  fog: '#B7B1AA',
  unknown: '#94A3B8'
}

export const weatherBgMap: Record<string, string> = {
  sunny: 'rgba(245, 158, 11, 0.12)',
  cloudy: 'rgba(148, 163, 184, 0.12)',
  overcast: 'rgba(142, 142, 147, 0.12)',
  light_rain: 'rgba(96, 165, 250, 0.12)',
  moderate_rain: 'rgba(75, 143, 211, 0.12)',
  heavy_rain: 'rgba(59, 111, 181, 0.12)',
  snow: 'rgba(165, 200, 232, 0.18)',
  fog: 'rgba(183, 177, 170, 0.12)',
  unknown: 'rgba(148, 163, 184, 0.1)'
}

export const weatherGlyphMap: Record<TripWeatherIcon, string> = {
  sunny: '晴',
  cloudy: '云',
  overcast: '阴',
  light_rain: '雨',
  moderate_rain: '雨',
  heavy_rain: '雨',
  snow: '雪',
  fog: '雾',
  unknown: '云'
}

export function getWeatherColor(icon?: string): string {
  if (icon && icon in weatherColorMap) return weatherColorMap[icon]
  return weatherColorMap.unknown
}

export function getWeatherBg(icon?: string): string {
  if (icon && icon in weatherBgMap) return weatherBgMap[icon]
  return weatherBgMap.unknown
}

export function getWeatherGlyph(icon?: string): string {
  if (icon && icon in weatherGlyphMap) return weatherGlyphMap[icon as TripWeatherIcon]
  return weatherGlyphMap.unknown
}
