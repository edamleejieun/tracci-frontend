import type {
  ItineraryExportAssetsResponse,
  ItineraryExportDay,
  ItineraryExportNode
} from '@/types/itineraryExport'
import { requestAlbumPermission, saveImageToAlbum } from '@/utils/exportCanvasDraw'

export const ITINERARY_EXPORT_CANVAS_ID = 'tracci-itinerary-export-canvas'

export interface ItineraryExportRenderOptions {
  creatorName?: string
}

const CANVAS_WIDTH = 750
const PADDING_X = 56
const CONTENT_WIDTH = CANVAS_WIDTH - PADDING_X * 2
const TIME_COLUMN_WIDTH = 120
const BRAND_WATERMARK_IMAGE = '/static/brand/generated/brand-watermark-grey-256.png'

const COLORS = {
  white: '#FFFFFF',
  bgCream: '#FBFAF8',
  bgWarm: '#F5F2EC',
  gradientTop: '#DDF3FA',
  gradientMid: '#F6FBFC',
  brand: '#4F7DFF',
  textPrimary: '#2F2A25',
  textSecondary: '#6D6760',
  textMuted: '#9B958C',
  textLight: '#AAA49E',
  dot: '#6F6A63',
  divider: '#E2DDD6'
} as const

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const LAYOUT = {
  headerTop: 40,
  titleSize: 42,
  titleLineHeight: 54,
  metaSize: 22,
  dateBlockSize: 42,
  weekdaySize: 22,
  nodeNameSize: 28,
  nodeTimeSize: 24,
  footerSize: 20,
  footerSloganSize: 18,
  dayHeaderGap: 20,
  nodeRowHeight: 48,
  dayBlockPaddingTop: 26,
  dayBlockPaddingBottom: 28,
  dayBlockGap: 28,
  sectionGap: 44,
  footerHeight: 126
} as const

// ── 工具函数 ──

function shortDateLabel(date: string): string {
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
  return `${shortDateLabel(startDate)} — ${shortDateLabel(endDate)}`
}

function formatNightCount(totalDays: number): string {
  if (totalDays <= 1) return ''
  return `${totalDays - 1}晚`
}

function buildTripMetaLine(
  trip: ItineraryExportAssetsResponse['trip'],
  creatorName?: string
): string {
  const name = creatorName?.trim() || '旅人'
  const range = formatSubtitleDateRange(trip.startDate, trip.endDate)
  const nights = formatNightCount(trip.totalDays)
  const dayPart = nights ? `${trip.totalDays}天${nights}` : `${trip.totalDays}天`
  return `${name} · ${range} · ${dayPart}`
}

function getNodeDisplayName(node: ItineraryExportNode): string {
  return node.locationName?.trim() || node.title
}

function getNodeTimeLabel(node: ItineraryExportNode): string | null {
  return node.startTime?.trim() || null
}

export function getItineraryExportActiveDays(days: ItineraryExportAssetsResponse['days']) {
  return days.filter(day => day.nodes.length > 0)
}

function estimateTitleLineCount(title: string): number {
  const normalizedLength = Array.from(title.trim()).reduce((sum, char) => {
    return sum + (/[\u4e00-\u9fff]/.test(char) ? 1 : 0.56)
  }, 0)
  return normalizedLength > 15 ? 2 : 1
}

export function estimateItineraryCanvasHeight(assets: ItineraryExportAssetsResponse): number {
  const activeDays = getItineraryExportActiveDays(assets.days)
  const titleLineCount = estimateTitleLineCount(assets.trip.title)
  let height = LAYOUT.headerTop + 14 + 70
  height += titleLineCount * LAYOUT.titleLineHeight
  height += 46 + LAYOUT.sectionGap

  for (const day of activeDays) {
    height += LAYOUT.dayBlockPaddingTop + 54 + LAYOUT.dayHeaderGap
    height += day.nodes.length * LAYOUT.nodeRowHeight
    height += LAYOUT.dayBlockPaddingBottom
    height += LAYOUT.dayBlockGap
  }
  if (activeDays.length > 0) {
    height -= LAYOUT.dayBlockGap
  }
  height += LAYOUT.footerHeight
  return Math.max(Math.ceil(height + 24), 800)
}

function truncateText(ctx: UniApp.CanvasContext, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let result = text
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}…`
}

function wrapTextLines(
  ctx: UniApp.CanvasContext,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const chars = Array.from(text.trim())
  const lines: string[] = []
  let current = ''

  for (const char of chars) {
    const next = `${current}${char}`
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      continue
    }

    if (current) lines.push(current)
    current = char

    if (lines.length === maxLines - 1) {
      break
    }
  }

  if (lines.length < maxLines && current) {
    const consumedLength = lines.join('').length + current.length
    const hasRemaining = chars.length > consumedLength
    lines.push(hasRemaining ? truncateText(ctx, text.slice(lines.join('').length), maxWidth) : current)
  }

  if (!lines.length) lines.push('')
  return lines.slice(0, maxLines)
}

// ── 绘制原语 ──

function drawBrandWatermarkImage(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  size: number,
  alpha = 1
) {
  ctx.save()
  ctx.setGlobalAlpha(alpha)
  ctx.drawImage(BRAND_WATERMARK_IMAGE, x, y, size, size)
  ctx.restore()
}

function drawDottedLine(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  width: number,
  color = COLORS.dot
) {
  ctx.setFillStyle(color)
  const dot = 3
  const gap = 6
  for (let cursor = x; cursor < x + width; cursor += dot + gap) {
    ctx.beginPath()
    ctx.arc(cursor, y, dot / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawDoubleDottedLine(ctx: UniApp.CanvasContext, y: number, color = COLORS.dot) {
  drawDottedLine(ctx, PADDING_X, y, CONTENT_WIDTH, color)
  drawDottedLine(ctx, PADDING_X, y + 7, CONTENT_WIDTH, color)
}

// ── 分区绘制 ──

/** 顶部渐变背景（全画布高度） */
function drawBackground(ctx: UniApp.CanvasContext, height: number) {
  ctx.setFillStyle(COLORS.bgCream)
  ctx.fillRect(0, 0, CANVAS_WIDTH, height)

  const gradient = ctx.createLinearGradient(0, 0, 0, 410)
  gradient.addColorStop(0, COLORS.gradientTop)
  gradient.addColorStop(0.72, COLORS.gradientMid)
  gradient.addColorStop(1, COLORS.bgCream)
  ctx.setFillStyle(gradient)
  ctx.fillRect(0, 0, CANVAS_WIDTH, 410)

  drawBrandWatermarkImage(ctx, CANVAS_WIDTH - PADDING_X - 190, 126, 190, 0.16)

  ctx.setStrokeStyle('rgba(79, 125, 255, 0.07)')
  ctx.setLineWidth(4)
  ctx.beginPath()
  ctx.moveTo(PADDING_X - 20, 326)
  ctx.bezierCurveTo(170, 296, 250, 352, 356, 318)
  ctx.bezierCurveTo(458, 286, 544, 300, CANVAS_WIDTH - PADDING_X + 18, 322)
  ctx.stroke()

  ctx.setStrokeStyle('rgba(255, 255, 255, 0.52)')
  ctx.setLineWidth(2)
  ctx.beginPath()
  ctx.moveTo(PADDING_X + 20, 354)
  ctx.bezierCurveTo(190, 330, 276, 374, 362, 346)
  ctx.bezierCurveTo(452, 318, 532, 328, CANVAS_WIDTH - PADDING_X - 10, 350)
  ctx.stroke()

  const bottomGradient = ctx.createLinearGradient(0, height - 200, 0, height)
  bottomGradient.addColorStop(0, COLORS.bgCream)
  bottomGradient.addColorStop(1, COLORS.bgWarm)
  ctx.setFillStyle(bottomGradient)
  ctx.fillRect(0, height - 200, CANVAS_WIDTH, 200)
}

/** 顶部品牌标签 */
function drawCornerLabels(ctx: UniApp.CanvasContext, y: number) {
  ctx.setFillStyle(COLORS.textSecondary)
  ctx.setFontSize(18)
  ctx.setTextAlign('left')
  ctx.fillText('趣溪 Tracci', PADDING_X, y)

  const tagText = '行程单'
  ctx.setTextAlign('right')
  ctx.setFillStyle(COLORS.brand)
  ctx.fillText(tagText, CANVAS_WIDTH - PADDING_X, y)
  ctx.setTextAlign('left')
}

/** 标题区块：左对齐大字标题 */
function drawTitleBlock(
  ctx: UniApp.CanvasContext,
  title: string,
  topY: number
): number {
  const maxTitleWidth = CONTENT_WIDTH - 40

  ctx.setFillStyle(COLORS.textPrimary)
  ctx.setFontSize(LAYOUT.titleSize)
  ctx.setTextAlign('left')

  let currentY = topY

  const titleLines = wrapTextLines(ctx, title, maxTitleWidth, 2)
  titleLines.forEach(line => {
    ctx.setFillStyle(COLORS.textPrimary)
    ctx.setFontSize(LAYOUT.titleSize)
    ctx.fillText(line, PADDING_X, currentY)
    currentY += LAYOUT.titleLineHeight
  })

  ctx.setTextAlign('left')
  return currentY
}

/** 副标题元信息 */
function drawCreatorMeta(
  ctx: UniApp.CanvasContext,
  metaText: string,
  topY: number
): number {
  ctx.setFillStyle(COLORS.textSecondary)
  ctx.setFontSize(LAYOUT.metaSize)
  ctx.setTextAlign('left')
  const displayText = truncateText(ctx, metaText, CONTENT_WIDTH - 40)
  const iconX = PADDING_X + 14
  const iconY = topY - 10
  ctx.setFillStyle('rgba(255, 255, 255, 0.72)')
  ctx.beginPath()
  ctx.arc(iconX, iconY, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.setStrokeStyle('#FFFFFF')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.arc(iconX, iconY - 3, 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(iconX, iconY + 9, 8, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()
  ctx.setFillStyle(COLORS.textSecondary)
  ctx.fillText(displayText, PADDING_X + 40, topY)
  ctx.setTextAlign('left')
  return topY + 46
}

/** 日期块标题：大号日期 + 星期 */
function drawDayHeader(
  ctx: UniApp.CanvasContext,
  day: ItineraryExportDay,
  y: number
): number {
  const dateText = shortDateLabel(day.date)
  const weekday = weekdayLabel(day.date)

  ctx.setFillStyle('#090909')
  ctx.setFontSize(LAYOUT.dateBlockSize)
  ctx.setTextAlign('left')
  ctx.fillText(dateText, PADDING_X, y + 42)

  const dateWidth = ctx.measureText(dateText).width
  ctx.setFontSize(LAYOUT.weekdaySize)
  ctx.fillText(`/ ${weekday}`, PADDING_X + dateWidth + 8, y + 39)

  return y + 54 + LAYOUT.dayHeaderGap
}

/** 单个行程节点行：地点 + 时间 */
function drawNodeRow(
  ctx: UniApp.CanvasContext,
  node: ItineraryExportNode,
  y: number
): number {
  const name = getNodeDisplayName(node)
  const time = getNodeTimeLabel(node)

  const nameX = PADDING_X
  const nameBaselineY = y + 30

  ctx.setFillStyle('#141414')
  ctx.setFontSize(LAYOUT.nodeNameSize)
  ctx.setTextAlign('left')
  const maxNameWidth = time
    ? CONTENT_WIDTH - TIME_COLUMN_WIDTH - 24
    : CANVAS_WIDTH - PADDING_X - nameX
  ctx.fillText(truncateText(ctx, name, maxNameWidth), nameX, nameBaselineY)

  if (time) {
    ctx.setFillStyle(COLORS.textLight)
    ctx.setFontSize(LAYOUT.nodeTimeSize)
    ctx.setTextAlign('right')
    ctx.fillText(time, CANVAS_WIDTH - PADDING_X, nameBaselineY)
    ctx.setTextAlign('left')
  }

  return y + LAYOUT.nodeRowHeight
}

/** Footer：品牌信息 + 水印 */
function drawFooter(
  ctx: UniApp.CanvasContext,
  y: number,
  height: number
) {
  drawDoubleDottedLine(ctx, y, COLORS.divider)

  const footerY = height - 64
  ctx.setFillStyle(COLORS.textMuted)
  ctx.setFontSize(LAYOUT.footerSize)
  ctx.setTextAlign('left')
  ctx.fillText('趣溪 Tracci', PADDING_X, footerY)
  ctx.setFontSize(LAYOUT.footerSloganSize)
  ctx.fillText('规划 · 记录 · 分享', PADDING_X, footerY + 28)

  ctx.setFillStyle(COLORS.textMuted)
  ctx.setFontSize(LAYOUT.footerSloganSize)
  ctx.setTextAlign('right')
  ctx.setTextAlign('left')
}

// ── 总绘制 ──

function drawItineraryCanvas(
  ctx: UniApp.CanvasContext,
  assets: ItineraryExportAssetsResponse,
  height: number,
  options?: ItineraryExportRenderOptions
) {
  const { trip } = assets
  const activeDays = getItineraryExportActiveDays(assets.days)
  const metaLine = buildTripMetaLine(trip, options?.creatorName)

  // 1. 背景
  drawBackground(ctx, height)

  // 2. Header
  let y = LAYOUT.headerTop + 14
  drawCornerLabels(ctx, y)
  y += 64

  y = drawTitleBlock(ctx, trip.title, y)
  y = drawCreatorMeta(ctx, metaLine, y)
  y += 18

  drawDoubleDottedLine(ctx, y)
  y += LAYOUT.sectionGap

  // 3. Day blocks
  activeDays.forEach((day, index) => {
    // 日期块标题
    y += LAYOUT.dayBlockPaddingTop
    y = drawDayHeader(ctx, day, y)

    // 节点行
    day.nodes.forEach(node => {
      y = drawNodeRow(ctx, node, y)
    })

    y += LAYOUT.dayBlockPaddingBottom

    // 天之间分隔线（最后一天不用）
    if (index < activeDays.length - 1) {
      drawDoubleDottedLine(ctx, y)
      y += LAYOUT.dayBlockGap
    }
  })

  // 4. Footer
  drawFooter(ctx, height - LAYOUT.footerHeight, height)
}

// ── 导出接口 ──

export async function renderItineraryExportImage(
  assets: ItineraryExportAssetsResponse,
  componentInstance?: WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Page.TrivialInstance,
  options?: ItineraryExportRenderOptions
): Promise<string> {
  const height = estimateItineraryCanvasHeight(assets)
  const ctx = componentInstance
    ? uni.createCanvasContext(ITINERARY_EXPORT_CANVAS_ID, componentInstance as WechatMiniprogram.IAnyObject)
    : uni.createCanvasContext(ITINERARY_EXPORT_CANVAS_ID)

  drawItineraryCanvas(ctx, assets, height, options)

  return new Promise<string>((resolve, reject) => {
    ctx.draw(false, () => {
      setTimeout(() => {
        const exportOptions: UniApp.CanvasToTempFilePathOptions = {
          canvasId: ITINERARY_EXPORT_CANVAS_ID,
          width: CANVAS_WIDTH,
          height,
          destWidth: CANVAS_WIDTH * 2, // 2x 输出更清晰
          destHeight: height * 2,
          fileType: 'png',
          success: res => resolve(res.tempFilePath),
          fail: err => reject(err)
        }
        if (componentInstance) {
          uni.canvasToTempFilePath(exportOptions, componentInstance as WechatMiniprogram.IAnyObject)
        } else {
          uni.canvasToTempFilePath(exportOptions)
        }
      }, 300)
    })
  })
}

export async function saveItineraryExportImageToAlbum(
  assets: ItineraryExportAssetsResponse,
  componentInstance?: WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Page.TrivialInstance,
  options?: ItineraryExportRenderOptions
): Promise<void> {
  const granted = await requestAlbumPermission()
  if (!granted) {
    throw new Error('未获得相册权限')
  }
  const filePath = await renderItineraryExportImage(assets, componentInstance, options)
  await saveImageToAlbum(filePath)
}
