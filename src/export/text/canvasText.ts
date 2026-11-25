export interface DrawTextInBoxOptions {
  x: number
  /** 文本框顶部 y（非 baseline） */
  y: number
  width: number
  text: string
  fontSize: number
  lineHeight: number
  color: string
  maxLines?: number
  align?: 'left' | 'center'
  ellipsis?: string
}

export interface DrawTextInBoxResult {
  height: number
  lineCount: number
}

type CanvasContextWithMeasure = UniApp.CanvasContext & {
  measureText?: (text: string) => { width: number }
}

function estimateCharWidth(char: string, fontSize: number): number {
  if (!char) return 0
  const code = char.codePointAt(0) ?? 0
  if (code > 0xffff) return fontSize
  if (code >= 0x1f300 && code <= 0x1faff) return fontSize
  if (code < 128) return fontSize * 0.55
  return fontSize * 0.95
}

/** 测量文本宽度；优先使用 Canvas measureText，否则按字符估算 */
export function measureTextWidth(
  ctx: UniApp.CanvasContext,
  text: string,
  fontSize: number
): number {
  if (!text) return 0
  ctx.setFontSize(fontSize)
  const ctxWithMeasure = ctx as CanvasContextWithMeasure
  if (typeof ctxWithMeasure.measureText === 'function') {
    try {
      return ctxWithMeasure.measureText(text).width
    } catch {
      // fall through
    }
  }
  return Array.from(text).reduce((sum, ch) => sum + estimateCharWidth(ch, fontSize), 0)
}

/** 按最大宽度截断单行文本 */
export function truncateTextByWidth(
  ctx: UniApp.CanvasContext,
  text: string,
  maxWidth: number,
  fontSize: number,
  suffix = '…'
): string {
  if (!text) return ''
  if (maxWidth <= 0) return ''
  if (measureTextWidth(ctx, text, fontSize) <= maxWidth) return text
  if (measureTextWidth(ctx, suffix, fontSize) > maxWidth) return ''

  const chars = Array.from(text)
  let low = 0
  let high = chars.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = chars.slice(0, mid).join('') + suffix
    if (measureTextWidth(ctx, candidate, fontSize) <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  if (low <= 0) return suffix
  return chars.slice(0, low).join('') + suffix
}

function wrapTextLines(
  ctx: UniApp.CanvasContext,
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
  ellipsis: string
): string[] {
  let remaining = text
  const lines: string[] = []

  while (remaining && lines.length < maxLines) {
    if (lines.length === maxLines - 1) {
      lines.push(truncateTextByWidth(ctx, remaining, maxWidth, fontSize, ellipsis))
      return lines
    }

    const chars = Array.from(remaining)
    let fit = ''
    for (const char of chars) {
      const test = fit + char
      if (measureTextWidth(ctx, test, fontSize) <= maxWidth) {
        fit = test
      } else {
        break
      }
    }

    if (!fit) {
      lines.push(truncateTextByWidth(ctx, remaining, maxWidth, fontSize, ellipsis))
      return lines
    }

    lines.push(fit)
    remaining = chars.slice(Array.from(fit).length).join('')
  }

  return lines
}

export type DrawMultilineTextOptions = DrawTextInBoxOptions

/** 在矩形区域内绘制多行文本（顶对齐） */
export function drawMultilineText(
  ctx: UniApp.CanvasContext,
  options: DrawMultilineTextOptions
): DrawTextInBoxResult {
  return drawTextInBox(ctx, options)
}

/**
 * 在矩形区域内绘制文本（顶对齐，支持多行与末行省略）
 * fillText 使用 baseline；首行 baseline = y + fontSize
 */
export function drawTextInBox(
  ctx: UniApp.CanvasContext,
  options: DrawTextInBoxOptions
): DrawTextInBoxResult {
  const {
    x,
    y,
    width,
    text,
    fontSize,
    lineHeight,
    color,
    maxLines = 1,
    align = 'left',
    ellipsis = '…'
  } = options

  if (!text) {
    return { height: 0, lineCount: 0 }
  }

  ctx.setFillStyle(color)
  ctx.setFontSize(fontSize)

  const lines =
    maxLines <= 1
      ? [truncateTextByWidth(ctx, text, width, fontSize, ellipsis)]
      : wrapTextLines(ctx, text, width, fontSize, maxLines, ellipsis)

  lines.forEach((line, index) => {
    const baselineY = y + fontSize + index * lineHeight
    let drawX = x
    if (align === 'center') {
      const lineWidth = measureTextWidth(ctx, line, fontSize)
      drawX = x + (width - lineWidth) / 2
    }
    ctx.fillText(line, drawX, baselineY)
  })

  const lineCount = lines.length
  const height = lineCount <= 0 ? 0 : fontSize + (lineCount - 1) * lineHeight

  return { height, lineCount }
}
