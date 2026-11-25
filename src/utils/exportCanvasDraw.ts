import { getCategoryConfig } from '@/constants/expense'
import { getExportTheme, EXPORT_CANVAS_SIZE } from '@/constants/exportTheme'
import { DEFAULT_EXPORT_CONTENT_OPTIONS, normalizeExportContentOptions } from '@/constants/exportOptions'
import {
  formatCurrency,
  formatDateRangeShort,
  hasExpenseData,
  parseAmount
} from '@/utils/format'
import {
  ExportContentOptions,
  ExportExpenseCategoryStat,
  ExportFormatType,
  ExportPhotoItem,
  ExportTemplateType,
  PreparedCanvasImage,
  TripExportAssetsResponse
} from '@/types/export'
import { EXPORT_DESIGN_LAYOUT } from '@/export/layout/designTokens'
import { getScale, s } from '@/export/layout/scale'
import {
  drawTextInBox,
  measureTextWidth,
  truncateTextByWidth
} from '@/export/text/canvasText'
import { roundRect } from '@/export/primitives/canvasPath'
import {
  layoutExpenseSegmentWidths,
  drawSegmentedBar,
  layoutExpenseLegend,
  drawExpenseLegend,
  type ExpenseBarSegment,
  type ExpenseLegendItem
} from '@/export/primitives/expenseBar'

export const EXPORT_CANVAS_ID = 'tracci-export-canvas'

export type { PreparedCanvasImage } from '@/types/export'

const MAX_CANVAS_PHOTOS = 3

function withTimeoutReject<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then(value => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export { downloadCanvasImage } from '@/export/assets/imageLoader'
export type { PrepareExportImagesResult } from '@/export/assets/imageLoader'
export { prepareExportCanvasImages } from '@/export/assets/imageLoader'

function drawPlaceholder(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  ctx.setFillStyle(fill)
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
}

function drawImageCover(
  ctx: UniApp.CanvasContext,
  image: PreparedCanvasImage,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  ctx.setFillStyle(fill)
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
  if (!image.path) return
  ctx.save()
  roundRect(ctx, x, y, w, h, r)
  ctx.clip()
  if (image.width > 0 && image.height > 0) {
    const scale = Math.max(w / image.width, h / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const drawX = x + (w - drawW) / 2
    const drawY = y + (h - drawH) / 2
    ctx.drawImage(image.path, drawX, drawY, drawW, drawH)
  } else {
    ctx.drawImage(image.path, x, y, w, h)
  }
  ctx.restore()
}

function strokePhotoBorder(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  borderColor?: string
) {
  if (!borderColor) return
  ctx.setStrokeStyle(borderColor)
  ctx.setLineWidth(EXPORT_DESIGN_LAYOUT.photo.borderWidth)
  roundRect(ctx, x, y, w, h, radius)
  ctx.stroke()
}

function drawPhotoCell(
  ctx: UniApp.CanvasContext,
  image: PreparedCanvasImage | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  placeholder: string,
  borderColor?: string
) {
  if (image?.path) {
    drawImageCover(ctx, image, x, y, w, h, radius, placeholder)
  } else {
    drawPlaceholder(ctx, x, y, w, h, radius, placeholder)
  }
  strokePhotoBorder(ctx, x, y, w, h, radius, borderColor)
}

function drawVerticalFade(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  w: number,
  h: number,
  from: string,
  to: string
) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h)
  gradient.addColorStop(0, from)
  gradient.addColorStop(1, to)
  ctx.setFillStyle(gradient)
  ctx.fillRect(x, y, w, h)
}

function drawBrandLockup(
  ctx: UniApp.CanvasContext,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
  align: 'left' | 'right' | 'center' = 'left'
) {
  const iconSize = s(24, scale)
  const gap = s(8, scale)
  const fontSize = s(20, scale)
  const label = text || 'Tracci'
  const labelW = measureTextWidth(ctx, label, fontSize)
  const totalW = iconSize + gap + labelW
  let startX = x
  if (align === 'right') startX = x - totalW
  if (align === 'center') startX = x - totalW / 2

  ctx.setFillStyle('rgba(79, 125, 255, 0.86)')
  roundRect(ctx, startX, y - iconSize + s(2, scale), iconSize, iconSize, s(6, scale))
  ctx.fill()
  ctx.setFillStyle('#FFFFFF')
  ctx.beginPath()
  ctx.arc(startX + iconSize / 2, y - iconSize / 2 + s(2, scale), s(4, scale), 0, Math.PI * 2)
  ctx.fill()
  ctx.setFillStyle(color)
  ctx.setFontSize(fontSize)
  ctx.fillText(label, startX + iconSize + gap, y)
}

/** 与 ExportPreviewCard 一致的照片拼贴布局 */
function drawPhotoGrid(
  ctx: UniApp.CanvasContext,
  images: PreparedCanvasImage[],
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  placeholder: string,
  borderColor?: string
) {
  const count = Math.min(images.length, MAX_CANVAS_PHOTOS)
  const gap = EXPORT_DESIGN_LAYOUT.photo.gap

  if (count === 0) {
    drawPlaceholder(ctx, x, y, width, height, radius, placeholder)
    return
  }

  if (count === 1) {
    drawPhotoCell(ctx, images[0], x, y, width, height, radius, placeholder, borderColor)
    return
  }

  if (count === 2) {
    const cellW = (width - gap) / 2
    images.slice(0, 2).forEach((img, i) => {
      const px = x + i * (cellW + gap)
      drawPhotoCell(ctx, img, px, y, cellW, height, radius, placeholder, borderColor)
    })
    return
  }

  const leftW = Math.round((width - gap) * EXPORT_DESIGN_LAYOUT.photo.collageLeftRatio)
  const rightW = width - gap - leftW
  const topH = Math.round((height - gap) * EXPORT_DESIGN_LAYOUT.photo.collageTopRatio)
  const bottomH = height - gap - topH

  drawPhotoCell(ctx, images[0], x, y, leftW, height, radius, placeholder, borderColor)

  const rightX = x + leftW + gap
  drawPhotoCell(ctx, images[1], rightX, y, rightW, topH, radius, placeholder, borderColor)
  drawPhotoCell(ctx, images[2], rightX, y + topH + gap, rightW, bottomH, radius, placeholder, borderColor)
}

export interface DrawExportCardParams {
  template: ExportTemplateType
  format: ExportFormatType
  assets: TripExportAssetsResponse
  selectedPhotos: ExportPhotoItem[]
  contentOptions?: ExportContentOptions
  preparedImages: PreparedCanvasImage[]
}

function drawCenteredText(
  ctx: UniApp.CanvasContext,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
  maxWidth?: number
) {
  ctx.setFontSize(fontSize)
  const displayText =
    maxWidth != null ? truncateTextByWidth(ctx, text, maxWidth, fontSize) : text
  const textW = measureTextWidth(ctx, displayText, fontSize)
  ctx.fillText(displayText, centerX - textW / 2, y)
}

function getFittedFontSize(
  ctx: UniApp.CanvasContext,
  text: string,
  maxWidth: number,
  preferredFontSize: number,
  minFontSize: number
): number {
  let fontSize = preferredFontSize
  while (fontSize > minFontSize && measureTextWidth(ctx, text, fontSize) > maxWidth) {
    fontSize -= 1
  }
  return fontSize
}

function getExportDateText(assets: TripExportAssetsResponse, options: ExportContentOptions) {
  if (!options.showDate) return ''
  return formatDateRangeShort(assets.trip.startDate, assets.trip.endDate)
}

function getVisitedPlaces(assets: TripExportAssetsResponse) {
  return (assets.visitedPlaces || []).filter(Boolean)
}

function getExportCopyText(assets: TripExportAssetsResponse, options: ExportContentOptions) {
  if (options.copyStyle === 'none') return ''
  if (options.copyStyle === 'concise') {
    const days = assets.trip.totalDays || 0
    const places = getVisitedPlaces(assets).length
    if (places > 0) return `${days} 天旅程 · 走过 ${places} 个地方`
    return `${days} 天旅程 · ${assets.stats.journalCount || 0} 篇日志`
  }
  return '把这几天，慢慢留在路上'
}

function getSummaryParts(assets: TripExportAssetsResponse, options: ExportContentOptions) {
  const parts: string[] = []
  const stats = assets.stats
  const categories = assets.expenseCategoryStats || []
  const expenseAvailable = hasExpenseData(stats.totalExpenseAmount, categories)
  if (options.showDays) parts.push(`${assets.trip.totalDays || 0} 天`)
  if (options.showItineraryCount) parts.push(`${stats.itineraryCount || 0} 段行程`)
  if (options.showJournalCount) parts.push(`${stats.journalCount || 0} 篇日志`)
  if (options.showExpense && expenseAvailable) {
    parts.push(formatCurrency(stats.totalExpenseAmount, stats.currency))
  }
  return parts
}

function drawWatermarkIfNeeded(
  ctx: UniApp.CanvasContext,
  assets: TripExportAssetsResponse,
  color: string,
  centerX: number,
  y: number,
  fontSize: number,
  maxWidth: number
) {
  if (assets.watermark?.enabled === false) return
  const text = assets.watermark?.text || 'by 趣溪 Tracci'
  ctx.setFillStyle(color)
  drawCenteredText(ctx, text, centerX, y, fontSize, maxWidth)
}

function drawTravelCoverCard(
  ctx: UniApp.CanvasContext,
  params: DrawExportCardParams,
  options: ExportContentOptions
) {
  const { format, assets, preparedImages } = params
  const theme = getExportTheme('travel-cover')
  const { width, height } = EXPORT_CANVAS_SIZE[format]
  const scale = getScale(width)
  const pad = s(58, scale)
  const photoH = Math.round(height * (format === 'portrait' ? 0.65 : 0.7))
  const contentTop = Math.round(height * (format === 'portrait' ? 0.62 : 0.66))
  const titleFont = s(format === 'portrait' ? 58 : 64, scale)
  const bodyFont = s(28, scale)
  const smallFont = s(24, scale)

  ctx.setFillStyle(theme.bg)
  ctx.fillRect(0, 0, width, height)
  drawPhotoCell(ctx, preparedImages[0], 0, 0, width, photoH, 0, theme.pillBg)
  drawVerticalFade(
    ctx,
    0,
    Math.max(0, contentTop - s(170, scale)),
    width,
    s(170, scale),
    'rgba(248,247,244,0)',
    theme.bg
  )
  ctx.setFillStyle(theme.bg)
  ctx.fillRect(0, contentTop, width, height - contentTop)

  let y = contentTop + s(74, scale)
  const titleBlock = drawTextInBox(ctx, {
    x: pad,
    y: y - titleFont,
    width: width - pad * 2,
    text: assets.trip.title || '未命名旅程',
    fontSize: titleFont,
    lineHeight: s(72, scale),
    color: theme.textPrimary,
    maxLines: 2
  })
  y = y - titleFont + titleBlock.height + s(30, scale)

  const date = getExportDateText(assets, options)
  if (date) {
    ctx.setFillStyle(theme.textSecondary)
    ctx.setFontSize(bodyFont)
    ctx.fillText(truncateTextByWidth(ctx, date, width - pad * 2, bodyFont), pad, y)
    y += s(48, scale)
  }

  const summary = getSummaryParts(assets, options).join(' · ')
  if (summary) {
    ctx.setFillStyle(theme.muted)
    ctx.setFontSize(smallFont)
    ctx.fillText(truncateTextByWidth(ctx, summary, width - pad * 2, smallFont), pad, y)
    y += s(42, scale)
  }

  const copy = getExportCopyText(assets, options)
  if (copy) {
    ctx.setFillStyle(theme.muted)
    ctx.setFontSize(smallFont)
    ctx.fillText(truncateTextByWidth(ctx, copy, width - pad * 2, smallFont), pad, y)
  }

  if (assets.watermark?.enabled !== false) {
    drawBrandLockup(
      ctx,
      assets.watermark?.text || 'Tracci',
      width - pad,
      height - s(42, scale),
      scale,
      theme.textSecondary,
      'right'
    )
  }
}

function drawFilmPhotoFrame(
  ctx: UniApp.CanvasContext,
  image: PreparedCanvasImage | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  placeholder: string,
  rotateDeg = 0
) {
  const cx = x + w / 2
  const cy = y + h / 2
  ctx.setFillStyle('#FFFFFF')
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((rotateDeg * Math.PI) / 180)
  ctx.setShadow(0, 10, 24, 'rgba(47, 42, 37, 0.14)')
  roundRect(ctx, -w / 2, -h / 2, w, h, 10)
  ctx.fill()
  ctx.setShadow(0, 0, 0, 'rgba(0, 0, 0, 0)')
  drawPhotoCell(ctx, image, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 6, placeholder)
  ctx.restore()
}

function drawFilmCollageCard(
  ctx: UniApp.CanvasContext,
  params: DrawExportCardParams,
  options: ExportContentOptions
) {
  const { format, assets, preparedImages } = params
  const theme = getExportTheme('film-collage')
  const { width, height } = EXPORT_CANVAS_SIZE[format]
  const scale = getScale(width)
  const pad = s(58, scale)

  ctx.setFillStyle(theme.bg)
  ctx.fillRect(0, 0, width, height)

  ctx.setFillStyle(theme.trackBg)
  for (let i = 0; i < 6; i += 1) {
    const holeW = s(28, scale)
    const gap = s(82, scale)
    const x = width / 2 - (holeW * 6 + gap * 5) / 2 + i * (holeW + gap)
    roundRect(ctx, x, s(32, scale), holeW, holeW, s(5, scale))
    ctx.fill()
    roundRect(ctx, x, height - s(60, scale), holeW, holeW, s(5, scale))
    ctx.fill()
  }

  const areaTop = format === 'portrait' ? s(170, scale) : s(150, scale)
  const mainW = format === 'portrait' ? s(470, scale) : s(500, scale)
  const mainH = format === 'portrait' ? s(370, scale) : s(390, scale)
  drawFilmPhotoFrame(
    ctx,
    preparedImages[0],
    pad,
    areaTop + s(42, scale),
    mainW,
    mainH,
    theme.pillBg,
    -2.2
  )
  drawFilmPhotoFrame(
    ctx,
    preparedImages[1],
    width - pad - s(360, scale),
    areaTop,
    s(360, scale),
    s(300, scale),
    theme.pillBg,
    2.4
  )
  drawFilmPhotoFrame(
    ctx,
    preparedImages[2],
    width - pad - s(330, scale),
    areaTop + s(320, scale),
    s(330, scale),
    s(260, scale),
    theme.pillBg,
    -1.2
  )

  let y = format === 'portrait' ? height - s(520, scale) : height - s(260, scale)
  const titleFont = s(format === 'portrait' ? 48 : 54, scale)
  ctx.setFillStyle(theme.textPrimary)
  drawCenteredText(
    ctx,
    assets.trip.title || '未命名旅程',
    width / 2,
    y,
    titleFont,
    width - pad * 2
  )
  y += s(48, scale)

  const date = getExportDateText(assets, options)
  if (date) {
    ctx.setFillStyle(theme.textSecondary)
    drawCenteredText(ctx, date, width / 2, y, s(26, scale), width - pad * 2)
    y += s(42, scale)
  }

  const places = options.showVisitedPlaces ? getVisitedPlaces(assets).slice(0, 3).join(' · ') : ''
  if (places) {
    ctx.setFillStyle(theme.muted)
    drawCenteredText(ctx, places, width / 2, y, s(24, scale), width - pad * 2)
    y += s(40, scale)
  }

  const copy = getExportCopyText(assets, options)
  if (copy) {
    ctx.setFillStyle(theme.muted)
    drawCenteredText(ctx, copy, width / 2, y, s(24, scale), width - pad * 2)
  }

  drawWatermarkIfNeeded(
    ctx,
    assets,
    theme.watermark,
    width / 2,
    height - s(34, scale),
    s(20, scale),
    width * 0.72
  )
}

function drawExpenseDistribution(
  ctx: UniApp.CanvasContext,
  categories: ExportExpenseCategoryStat[],
  x: number,
  y: number,
  w: number,
  scale: number,
  theme: ReturnType<typeof getExportTheme>
) {
  const visible = categories.slice(0, 5)
  if (visible.length === 0) return 0
  const font = s(22, scale)
  const dotSize = s(6, scale)
  const itemGap = s(16, scale)
  const rowGap = s(10, scale)
  const segmentWidths = layoutExpenseSegmentWidths(
    w,
    visible.map(cat => parseAmount(cat.percentage))
  )
  const segments: ExpenseBarSegment[] = []
  visible.forEach((cat, idx) => {
    const segW = segmentWidths[idx] ?? 0
    if (segW <= 0) return
    const cfg = getCategoryConfig(cat.category?.toLowerCase() || 'other')
    segments.push({ width: segW, color: cfg.color })
  })
  drawSegmentedBar(ctx, x, y, w, s(14, scale), theme.trackBg, segments)

  const legendItems: ExpenseLegendItem[] = visible.map(cat => {
    const cfg = getCategoryConfig(cat.category?.toLowerCase() || 'other')
    const percent = Math.round(parseAmount(cat.percentage))
    return {
      name: `${cat.categoryName || cfg.name} ${percent}%`,
      color: cfg.color
    }
  })
  const legendY = y + s(34, scale)
  const legendLayout = layoutExpenseLegend(ctx, legendItems, w, font, {
    itemGap,
    dotSize,
    rowGap,
    maxLines: 2
  })
  drawExpenseLegend(ctx, x, legendY, w, legendLayout, font, theme.muted, {
    itemGap,
    dotSize,
    rowGap
  })

  return s(34, scale) + legendLayout.totalHeight + s(18, scale)
}

function drawMinimalSummaryCard(
  ctx: UniApp.CanvasContext,
  params: DrawExportCardParams,
  options: ExportContentOptions
) {
  const { format, assets, preparedImages } = params
  const theme = getExportTheme('minimal-summary')
  const { width, height } = EXPORT_CANVAS_SIZE[format]
  const scale = getScale(width)
  const pad = s(64, scale)
  const innerW = width - pad * 2

  ctx.setFillStyle(theme.bg)
  ctx.fillRect(0, 0, width, height)

  let y = pad
  if (format === 'portrait') {
    drawPhotoCell(ctx, preparedImages[0], pad, y, innerW, s(420, scale), s(36, scale), theme.pillBg)
    y += s(500, scale)
  } else {
    drawPhotoCell(ctx, preparedImages[0], pad, y, s(230, scale), s(230, scale), s(36, scale), theme.pillBg)
    const titleX = pad + s(270, scale)
    drawTextInBox(ctx, {
      x: titleX,
      y: y + s(18, scale),
      width: width - titleX - pad,
      text: assets.trip.title || '未命名旅程',
      fontSize: s(46, scale),
      lineHeight: s(58, scale),
      color: theme.textPrimary,
      maxLines: 2
    })
    const date = getExportDateText(assets, options)
    if (date) {
      ctx.setFillStyle(theme.textSecondary)
      ctx.setFontSize(s(24, scale))
      ctx.fillText(truncateTextByWidth(ctx, date, width - titleX - pad, s(24, scale)), titleX, y + s(150, scale))
    }
    y += s(300, scale)
  }

  if (format === 'portrait') {
    drawTextInBox(ctx, {
      x: pad,
      y,
      width: innerW,
      text: assets.trip.title || '未命名旅程',
      fontSize: s(50, scale),
      lineHeight: s(62, scale),
      color: theme.textPrimary,
      maxLines: 2
    })
    y += s(120, scale)
    const date = getExportDateText(assets, options)
    if (date) {
      ctx.setFillStyle(theme.textSecondary)
      ctx.setFontSize(s(24, scale))
      ctx.fillText(truncateTextByWidth(ctx, date, innerW, s(24, scale)), pad, y)
      y += s(58, scale)
    }
  }

  const rows = [
    options.showDays ? ['旅行天数', `${assets.trip.totalDays || 0} 天`] : null,
    options.showItineraryCount ? ['行程安排', `${assets.stats.itineraryCount || 0} 段`] : null,
    options.showJournalCount ? ['旅行日志', `${assets.stats.journalCount || 0} 篇`] : null,
    options.showExpense && hasExpenseData(assets.stats.totalExpenseAmount, assets.expenseCategoryStats)
      ? ['总花费', formatCurrency(assets.stats.totalExpenseAmount, assets.stats.currency)]
      : null
  ].filter(Boolean) as string[][]

  rows.forEach(row => {
    ctx.setStrokeStyle(theme.trackBg)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(pad, y + s(20, scale))
    ctx.lineTo(width - pad, y + s(20, scale))
    ctx.stroke()
    ctx.setFillStyle(theme.textSecondary)
    ctx.setFontSize(s(28, scale))
    ctx.fillText(row[0], pad, y)
    ctx.setFillStyle(theme.textPrimary)
    const value = truncateTextByWidth(ctx, row[1], innerW * 0.52, s(28, scale))
    const valueW = measureTextWidth(ctx, value, s(28, scale))
    ctx.fillText(value, width - pad - valueW, y)
    y += s(78, scale)
  })

  if (options.showVisitedPlaces) {
    const places = getVisitedPlaces(assets).slice(0, 4)
    let tagX = pad
    places.forEach(place => {
      const font = s(22, scale)
      const textW = measureTextWidth(ctx, place, font)
      const tagW = textW + s(34, scale)
      if (tagX + tagW > width - pad) return
      ctx.setFillStyle(theme.pillBg)
      roundRect(ctx, tagX, y, tagW, s(42, scale), s(21, scale))
      ctx.fill()
      ctx.setFillStyle(theme.textSecondary)
      ctx.setFontSize(font)
      ctx.fillText(place, tagX + s(17, scale), y + s(28, scale))
      tagX += tagW + s(12, scale)
    })
    if (places.length > 0) y += s(70, scale)
  }

  if (
    options.showExpenseDistribution &&
    hasExpenseData(assets.stats.totalExpenseAmount, assets.expenseCategoryStats)
  ) {
    y += drawExpenseDistribution(ctx, assets.expenseCategoryStats, pad, y, innerW, scale, theme)
  }

  const copy = getExportCopyText(assets, options)
  if (copy) {
    ctx.setFillStyle(theme.muted)
    ctx.setFontSize(s(24, scale))
    ctx.fillText(truncateTextByWidth(ctx, copy, innerW, s(24, scale)), pad, height - s(82, scale))
  }

  drawWatermarkIfNeeded(
    ctx,
    assets,
    theme.watermark,
    width / 2,
    height - pad,
    s(20, scale),
    width * 0.72
  )
}

/** 与 ExportPreviewCard 布局一致的导出绘制 */
export function drawExportCard(ctx: UniApp.CanvasContext, params: DrawExportCardParams): void {
  const { template, format, assets, preparedImages } = params
  const contentOptions = normalizeExportContentOptions(
    params.contentOptions || DEFAULT_EXPORT_CONTENT_OPTIONS
  )
  if (template === 'travel-cover') {
    drawTravelCoverCard(ctx, params, contentOptions)
    return
  }
  if (template === 'film-collage') {
    drawFilmCollageCard(ctx, params, contentOptions)
    return
  }
  if (template === 'minimal-summary') {
    drawMinimalSummaryCard(ctx, params, contentOptions)
    return
  }
  const theme = getExportTheme(template)
  const { width, height } = EXPORT_CANVAS_SIZE[format]
  const scale = getScale(width)
  const header = EXPORT_DESIGN_LAYOUT.header
  const pad = s(EXPORT_DESIGN_LAYOUT.padding, scale)
  const innerW = width - pad * 2
  const stats = assets.stats

  ctx.setFillStyle(theme.bg)
  ctx.fillRect(0, 0, width, height)

  // 品牌行 y 仍为 fillText baseline（与改版前一致）
  let y = pad + s(header.topInset[format], scale)

  const brandFontSize = s(header.brandFontSize, scale)
  const dateFontSize = s(header.dateFontSize, scale)
  ctx.setFillStyle(theme.muted)
  ctx.setFontSize(brandFontSize)
  ctx.fillText('Tracci', pad, y)

  const dateStr = formatDateRangeShort(assets.trip.startDate, assets.trip.endDate)
  if (dateStr) {
    ctx.setFontSize(dateFontSize)
    const brandW = measureTextWidth(ctx, 'Tracci', brandFontSize)
    const dateMaxW = Math.max(0, innerW - brandW - s(24, scale))
    const safeDateStr = truncateTextByWidth(ctx, dateStr, dateMaxW, dateFontSize)
    const dateW = measureTextWidth(ctx, safeDateStr, dateFontSize)
    ctx.fillText(safeDateStr, width - pad - dateW, y)
  }
  y += s(header.brandRowHeight[format], scale)

  // 目的地标签（baseline 与改版前一致）
  const destFontSize = s(header.destinationLabelFontSize, scale)
  ctx.setFillStyle(theme.textSecondary)
  ctx.setFontSize(destFontSize)
  ctx.fillText('目的地', pad, y)

  // 标题顶对齐：从目的地 baseline 向下留白，避免与「目的地」重叠
  const titleTop = y + s(header.destinationToTitleGap, scale)
  const titleFontSize = s(header.titleFontSize, scale)
  const titleLineHeight = s(header.titleLineHeight, scale)
  const titleBlock = drawTextInBox(ctx, {
    x: pad,
    y: titleTop,
    width: innerW,
    text: assets.trip.title || '未命名旅程',
    fontSize: titleFontSize,
    lineHeight: titleLineHeight,
    color: theme.textPrimary,
    maxLines: header.titleMaxLines
  })
  y = titleTop + titleBlock.height + s(header.titleBottomGap[format], scale)

  // 照片拼贴
  const photoTokens = EXPORT_DESIGN_LAYOUT.photo
  const photoH =
    format === 'portrait'
      ? Math.round(height * photoTokens.portraitHeightRatio)
      : Math.round(height * photoTokens.squareHeightRatio)
  drawPhotoGrid(
    ctx,
    preparedImages,
    pad,
    y,
    innerW,
    photoH,
    theme.photoRadius,
    theme.pillBg,
    theme.photoBorder
  )
  y +=
    photoH +
    s(format === 'portrait' ? photoTokens.portraitBottomGap : photoTokens.squareBottomGap, scale)

  // 四列数据胶囊（与预览一致）
  const statItems = [
    { label: '天', value: String(assets.trip.totalDays || 0), highlight: false },
    { label: '行程', value: String(stats.itineraryCount || 0), highlight: false },
    { label: '日志', value: String(stats.journalCount || 0), highlight: false },
    {
      label: '',
      value: formatCurrency(stats.totalExpenseAmount, stats.currency),
      highlight: true
    }
  ]
  const statTokens = EXPORT_DESIGN_LAYOUT.stats
  const statGap = s(statTokens.gap, scale)
  const pillH = s(
    format === 'portrait' ? statTokens.portraitPillHeight : statTokens.squarePillHeight,
    scale
  )
  const cellW = (innerW - statGap * 3) / 4
  statItems.forEach((item, i) => {
    const sx = pad + i * (cellW + statGap)
    ctx.setFillStyle(theme.pillBg)
    roundRect(ctx, sx, y, cellW, pillH, s(statTokens.pillRadius, scale))
    ctx.fill()
    if (item.highlight) {
      ctx.setStrokeStyle(theme.accent)
      ctx.setLineWidth(s(statTokens.borderWidth, scale))
      roundRect(ctx, sx, y, cellW, pillH, s(statTokens.pillRadius, scale))
      ctx.stroke()
    }
    ctx.setFillStyle(item.highlight ? theme.accent : theme.textPrimary)
    const valueMaxW = Math.max(0, cellW - s(20, scale))
    const valueFontSize = getFittedFontSize(
      ctx,
      item.value,
      valueMaxW,
      s(statTokens.valueFontSize, scale),
      s(statTokens.minValueFontSize, scale)
    )
    const valueText = truncateTextByWidth(ctx, item.value, valueMaxW, valueFontSize)
    drawCenteredText(
      ctx,
      valueText,
      sx + cellW / 2,
      y + s(statTokens.valueBaseline, scale),
      valueFontSize
    )
    if (item.label) {
      ctx.setFillStyle(theme.muted)
      drawCenteredText(
        ctx,
        item.label,
        sx + cellW / 2,
        y + s(statTokens.labelBaseline, scale),
        s(statTokens.labelFontSize, scale),
        valueMaxW
      )
    }
  })
  y +=
    pillH +
    s(format === 'portrait' ? statTokens.portraitBottomGap : statTokens.squareBottomGap, scale)

  // 开支分布条
  const categories = (assets.expenseCategoryStats || []).slice(0, 5)
  const showExpense = hasExpenseData(stats.totalExpenseAmount, categories)

  if (showExpense && categories.length > 0) {
    const expenseTokens = EXPORT_DESIGN_LAYOUT.expense
    const barH = s(expenseTokens.barHeight, scale)
    const legendFont = s(expenseTokens.legendFontSize, scale)
    const legendItemGap = s(expenseTokens.legendItemGap, scale)
    const legendDotSize = s(expenseTokens.legendDotSize, scale)
    const legendRowGap = s(expenseTokens.legendRowGap, scale)

    const segmentWidths = layoutExpenseSegmentWidths(
      innerW,
      categories.map(cat => parseAmount(cat.percentage))
    )
    const segments: ExpenseBarSegment[] = []
    categories.forEach((cat, idx) => {
      const segW = segmentWidths[idx] ?? 0
      if (segW <= 0) return
      const cfg = getCategoryConfig(cat.category?.toLowerCase() || 'other')
      segments.push({ width: segW, color: cfg.color })
    })

    drawSegmentedBar(ctx, pad, y, innerW, barH, theme.pillBg, segments)
    y += barH + s(expenseTokens.barToLegendGap, scale)

    const legendItems: ExpenseLegendItem[] = categories.map(cat => {
      const cfg = getCategoryConfig(cat.category?.toLowerCase() || 'other')
      return {
        name: cat.categoryName || cfg.name,
        color: cfg.color
      }
    })

    const legendLayout = layoutExpenseLegend(ctx, legendItems, innerW, legendFont, {
      itemGap: legendItemGap,
      dotSize: legendDotSize,
      rowGap: legendRowGap,
      maxLines: expenseTokens.legendMaxLines
    })

    drawExpenseLegend(ctx, pad, y, innerW, legendLayout, legendFont, theme.muted, {
      itemGap: legendItemGap,
      dotSize: legendDotSize,
      rowGap: legendRowGap
    })

    y +=
      legendLayout.totalHeight > 0
        ? legendLayout.totalHeight + s(expenseTokens.legendBottomGap, scale)
        : s(expenseTokens.legendBottomGap, scale)
  } else {
    ctx.setFillStyle(theme.muted)
    ctx.setFontSize(Math.round(width * 0.02))
    ctx.fillText('暂无开支', pad, y + 4)
    y += 28
  }

  // 水印（居中）
  const watermarkEnabled = assets.watermark?.enabled !== false
  const watermarkText = watermarkEnabled ? assets.watermark?.text || 'by 趣溪 Tracci' : ''
  if (watermarkText) {
    const wmFont = s(EXPORT_DESIGN_LAYOUT.watermarkFontSize, scale)
    const wmMaxWidth = width * EXPORT_DESIGN_LAYOUT.watermarkMaxWidthRatio
    ctx.setFillStyle(theme.watermark)
    drawCenteredText(ctx, watermarkText, width / 2, height - pad, wmFont, wmMaxWidth)
  }

  // 装饰圆点
  ctx.setFillStyle(theme.accent)
  ctx.beginPath()
  ctx.arc(width - pad - 12, pad + 12, 6, 0, 2 * Math.PI)
  ctx.fill()
}

/** 等待 canvas 绘制完成（draw 回调在部分机型不触发，需超时兜底） */
export function flushCanvasDraw(ctx: UniApp.CanvasContext): Promise<void> {
  return new Promise(resolve => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      setTimeout(resolve, 400)
    }
    try {
      ctx.draw(false, done)
    } catch {
      done()
    }
    setTimeout(() => {
      if (!settled) {
        console.warn('[export:canvas] draw callback timeout, continue with fallback wait')
      }
      done()
    }, 3000)
  })
}

type CanvasComponentInstance = WechatMiniprogram.Component.TrivialInstance | null

/** 解析 uni-app Vue3 在小程序端的组件作用域 */
export function resolveCanvasComponent(
  component?: CanvasComponentInstance | Record<string, unknown> | null
): CanvasComponentInstance | undefined {
  if (component == null) return undefined
  const anyComp = component as Record<string, unknown>
  if (anyComp.$scope) {
    return anyComp.$scope as CanvasComponentInstance
  }
  return component as CanvasComponentInstance
}

export function canvasToTempFile(
  canvasId: string,
  format: ExportFormatType,
  component?: CanvasComponentInstance
): Promise<string> {
  const { width, height } = EXPORT_CANVAS_SIZE[format]
  const options: UniApp.CanvasToTempFilePathOptions = {
    canvasId,
    width,
    height,
    destWidth: width,
    destHeight: height,
    fileType: 'png',
    quality: 1
  }

  const task = new Promise<string>((resolve, reject) => {
    const callbacks = {
      ...options,
      success: (res: UniApp.CanvasToTempFilePathRes) => {
        if (res.tempFilePath) resolve(res.tempFilePath)
        else reject(new Error('导出图片失败'))
      },
      fail: (err: UniApp.GeneralCallbackResult) => reject(err)
    }
    const scope = resolveCanvasComponent(component)
    if (scope != null) {
      uni.canvasToTempFilePath(callbacks, scope as WechatMiniprogram.IAnyObject)
    } else {
      uni.canvasToTempFilePath(callbacks)
    }
  })

  return withTimeoutReject(task, 20000, '导出图片超时')
}

export function createExportCanvasContext(
  canvasId: string,
  component?: CanvasComponentInstance | Record<string, unknown> | null
): UniApp.CanvasContext {
  const scope = resolveCanvasComponent(component)
  if (scope != null) {
    return uni.createCanvasContext(canvasId, scope as WechatMiniprogram.IAnyObject)
  }
  return uni.createCanvasContext(canvasId)
}

export function requestAlbumPermission(): Promise<boolean> {
  return new Promise(resolve => {
    uni.getSetting({
      success: settingRes => {
        const granted = settingRes.authSetting['scope.writePhotosAlbum']
        if (granted) {
          resolve(true)
          return
        }
        uni.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => resolve(true),
          fail: () => {
            uni.showModal({
              title: '需要相册权限',
              content: '保存图片需要访问相册，请在设置中开启权限',
              confirmText: '去设置',
              cancelText: '取消',
              success: modalRes => {
                if (modalRes.confirm) {
                  uni.openSetting({
                    success: openRes => {
                      resolve(!!openRes.authSetting['scope.writePhotosAlbum'])
                    },
                    fail: () => resolve(false)
                  })
                } else {
                  resolve(false)
                }
              }
            })
          }
        })
      },
      fail: () => resolve(false)
    })
  })
}

export function saveImageToAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: err => reject(err)
    })
  })
}
