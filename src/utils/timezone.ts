/**
 * UTC ↔ 本地时间转换工具
 *
 * API 约定：所有时间字段（spentAt、occurredAt、createdAt 等）使用 UTC 时间，
 * 格式为 ISO 8601 带 Z 后缀，如 2026-07-01T04:30:00Z。
 * 客户端收到 UTC 时间后需根据用户本地时区进行转换展示。
 */

/**
 * 从 UTC ISO 时间字符串中提取本地日期
 * 例：'2026-07-01T20:00:00Z' 在 UTC+8 时区 → '2026-07-02'
 */
export function utcToLocalDate(utcStr: string): string {
  const d = new Date(utcStr)
  if (Number.isNaN(d.getTime())) return utcStr.split('T')[0] || utcStr
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 从 UTC ISO 时间字符串中提取本地时间
 * 例：'2026-07-01T04:30:00Z' 在 UTC+8 时区 → '12:30'
 */
export function utcToLocalTime(utcStr: string): string {
  const d = new Date(utcStr)
  if (Number.isNaN(d.getTime())) {
    const t = utcStr.split('T')[1]
    return t ? t.substring(0, 5) : ''
  }
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 将本地日期 + 时间字符串转换为 UTC ISO 字符串（带 Z 后缀）
 * 例：('2026-07-02', '04:30') 在 UTC+8 时区 → '2026-07-01T20:30:00.000Z'
 */
export function localToUtcIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const localDate = new Date(y, m - 1, d, hh, mm, 0)
  return localDate.toISOString()
}
