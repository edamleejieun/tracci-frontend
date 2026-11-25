import { roundRect } from '@/export/primitives/canvasPath'
import { measureTextWidth, truncateTextByWidth } from '@/export/text/canvasText'

export interface ExpenseBarSegment {
  width: number
  color: string
}

export interface ExpenseLegendItem {
  name: string
  color: string
}

export interface PlacedLegendItem {
  name: string
  color: string
  width: number
}

export interface ExpenseLegendRow {
  items: PlacedLegendItem[]
  rowWidth: number
}

export interface ExpenseLegendLayout {
  rows: ExpenseLegendRow[]
  totalHeight: number
}

/**
 * 按 0-100 占比分配条宽。
 * 合计不足 100 时保留剩余 track；合计超过 100 时压缩到整条宽度。
 */
export function layoutExpenseSegmentWidths(
  barWidth: number,
  percentages: number[]
): number[] {
  if (barWidth <= 0 || percentages.length === 0) return []

  const weights = percentages.map(p => Math.min(Math.max(p, 0), 100))
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return weights.map(() => 0)

  const basis = total > 100 ? total : 100
  const targetWidth = Math.min(barWidth, Math.round((barWidth * total) / basis))
  const raw = weights.map(w => (barWidth * w) / basis)
  const floors = raw.map(w => Math.floor(w))
  const widths = [...floors]
  let remainder = targetWidth - floors.reduce((sum, w) => sum + w, 0)

  const order = raw
    .map((w, index) => ({ index, frac: w - floors[index] }))
    .sort((a, b) => b.frac - a.frac)

  let cursor = 0
  while (remainder > 0 && order.length > 0) {
    widths[order[cursor % order.length].index] += 1
    remainder -= 1
    cursor += 1
  }

  // 非零占比至少 1px（在目标填充宽度允许时）
  weights.forEach((weight, index) => {
    if (weight > 0 && widths[index] === 0 && targetWidth >= percentages.length) {
      const donor = widths.findIndex(w => w > 1)
      if (donor >= 0) {
        widths[donor] -= 1
        widths[index] = 1
      }
    }
  })

  return widths
}

/**
 * 圆角开支条：外轮廓 clip 后分段填充，保证两端圆角完整
 */
export function drawSegmentedBar(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  trackColor: string,
  segments: ExpenseBarSegment[]
) {
  const radius = height / 2

  ctx.setFillStyle(trackColor)
  roundRect(ctx, x, y, width, height, radius)
  ctx.fill()

  const visible = segments.filter(seg => seg.width > 0)
  if (!visible.length) return

  ctx.save()
  roundRect(ctx, x, y, width, height, radius)
  ctx.clip()

  let offsetX = x
  for (const seg of visible) {
    ctx.setFillStyle(seg.color)
    ctx.fillRect(offsetX, y, seg.width, height)
    offsetX += seg.width
  }

  ctx.restore()
}

/**
 * 图例流式布局：超宽换行，每行居中，单行名称过长时按宽截断
 */
export function layoutExpenseLegend(
  ctx: UniApp.CanvasContext,
  items: ExpenseLegendItem[],
  maxWidth: number,
  fontSize: number,
  options?: {
    itemGap?: number
    dotSize?: number
    rowGap?: number
    maxLines?: number
  }
): ExpenseLegendLayout {
  const itemGap = options?.itemGap ?? 16
  const dotSize = options?.dotSize ?? 6
  const rowGap = options?.rowGap ?? 10
  const maxLines = options?.maxLines ?? 2
  const labelGap = 4
  const rowHeight = fontSize + 6

  const rows: ExpenseLegendRow[] = []
  let current: PlacedLegendItem[] = []
  let currentWidth = 0

  const flushRow = () => {
    if (!current.length) return
    rows.push({ items: current, rowWidth: currentWidth })
    current = []
    currentWidth = 0
  }

  for (const item of items) {
    const gapBefore = current.length > 0 ? itemGap : 0

    if (current.length > 0 && rows.length < maxLines) {
      const remainingOnRow = maxWidth - currentWidth - gapBefore
      const probeName = truncateTextByWidth(
        ctx,
        item.name,
        Math.max(remainingOnRow - dotSize - labelGap, fontSize),
        fontSize
      )
      const probeWidth =
        dotSize + labelGap + measureTextWidth(ctx, probeName, fontSize)
      if (currentWidth + gapBefore + probeWidth > maxWidth) {
        flushRow()
      }
    }

    if (rows.length >= maxLines) break

    const remainingOnRow = maxWidth - currentWidth - (current.length > 0 ? itemGap : 0)
    const maxNameWidth = Math.max(remainingOnRow - dotSize - labelGap, fontSize)
    const name = truncateTextByWidth(ctx, item.name, maxNameWidth, fontSize)
    const itemWidth = dotSize + labelGap + measureTextWidth(ctx, name, fontSize)

    if (current.length > 0) currentWidth += itemGap
    current.push({ name, color: item.color, width: itemWidth })
    currentWidth += itemWidth
  }

  if (current.length && rows.length < maxLines) {
    flushRow()
  }

  const totalHeight =
    rows.length === 0 ? 0 : rows.length * rowHeight + (rows.length - 1) * rowGap

  return { rows, totalHeight }
}

export function drawExpenseLegend(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  maxWidth: number,
  layout: ExpenseLegendLayout,
  fontSize: number,
  textColor: string,
  options?: { itemGap?: number; dotSize?: number; rowGap?: number }
) {
  const itemGap = options?.itemGap ?? 16
  const dotSize = options?.dotSize ?? 6
  const rowGap = options?.rowGap ?? 10
  const labelGap = 4
  const rowHeight = fontSize + 6

  layout.rows.forEach((row, rowIndex) => {
    const rowY = y + rowIndex * (rowHeight + rowGap)
    let cursorX = x + (maxWidth - row.rowWidth) / 2

    row.items.forEach((item, itemIndex) => {
      if (itemIndex > 0) cursorX += itemGap

      ctx.setFillStyle(item.color)
      ctx.beginPath()
      ctx.arc(cursorX + dotSize / 2, rowY + dotSize / 2, dotSize / 2, 0, 2 * Math.PI)
      ctx.fill()

      cursorX += dotSize + labelGap
      ctx.setFillStyle(textColor)
      ctx.setFontSize(fontSize)
      ctx.fillText(item.name, cursorX, rowY + fontSize)

      cursorX += measureTextWidth(ctx, item.name, fontSize)
    })
  })
}
