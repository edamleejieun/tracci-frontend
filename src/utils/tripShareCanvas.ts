import type { CoverPhoto } from '@/types/trip'
import { getImageDisplayUrlCandidates, resolveImageSrcFromCandidates } from '@/utils/image'

export const TRIP_SHARE_CANVAS_ID = 'tracci-trip-share-canvas'

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 400
const PADDING_X = 34
const TITLE_SIZE = 34
const TITLE_LINE_HEIGHT = 44

interface PreparedCoverImage {
  path: string
  width: number
  height: number
}

function getImageInfo(src: string): Promise<PreparedCoverImage | null> {
  if (!src) return Promise.resolve(null)
  return new Promise(resolve => {
    uni.getImageInfo({
      src,
      success: res => {
        resolve({
          path: res.path || src,
          width: res.width || 0,
          height: res.height || 0
        })
      },
      fail: err => {
        console.warn('[tripShareCanvas] getImageInfo failed', err)
        resolve(null)
      }
    })
  })
}

function drawCoverImage(
  ctx: UniApp.CanvasContext,
  image: PreparedCoverImage | null
) {
  ctx.setFillStyle('#D9D3CA')
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (!image?.path) {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#D7E7F8')
    gradient.addColorStop(0.55, '#D8D0C4')
    gradient.addColorStop(1, '#9F9488')
    ctx.setFillStyle(gradient)
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    return
  }

  if (image.width > 0 && image.height > 0) {
    const scale = Math.max(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const drawX = (CANVAS_WIDTH - drawW) / 2
    const drawY = (CANVAS_HEIGHT - drawH) / 2
    ctx.drawImage(image.path, drawX, drawY, drawW, drawH)
  } else {
    ctx.drawImage(image.path, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }
}

function truncateText(ctx: UniApp.CanvasContext, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let result = text
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}…`
}

function wrapTitle(ctx: UniApp.CanvasContext, title: string, maxWidth: number): string[] {
  const chars = Array.from(title.trim() || '我的旅行')
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
    if (lines.length === 1) break
  }

  if (current) lines.push(current)
  if (lines.length > 2) return lines.slice(0, 2)
  if (lines.length === 2) {
    const consumedLength = lines[0].length + lines[1].length
    if (consumedLength < chars.length) {
      lines[1] = truncateText(ctx, title.slice(lines[0].length), maxWidth)
    }
  }
  return lines.slice(0, 2)
}

function drawTitle(ctx: UniApp.CanvasContext, title: string) {
  const overlay = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.35, 0, CANVAS_HEIGHT)
  overlay.addColorStop(0, 'rgba(0, 0, 0, 0)')
  overlay.addColorStop(0.54, 'rgba(0, 0, 0, 0.34)')
  overlay.addColorStop(1, 'rgba(0, 0, 0, 0.68)')
  ctx.setFillStyle(overlay)
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.setFillStyle('#FFFFFF')
  ctx.setFontSize(TITLE_SIZE)
  ctx.setTextAlign('left')
  const lines = wrapTitle(ctx, title, CANVAS_WIDTH - PADDING_X * 2)
  const titleHeight = lines.length * TITLE_LINE_HEIGHT
  let y = CANVAS_HEIGHT - 38 - titleHeight + TITLE_SIZE
  lines.forEach(line => {
    ctx.fillText(line, PADDING_X, y)
    y += TITLE_LINE_HEIGHT
  })
}

export async function renderTripShareCardImage(
  params: {
    title: string
    coverPhoto?: CoverPhoto | null
  },
  componentInstance?: WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Page.TrivialInstance
): Promise<string> {
  const coverSrc = await resolveImageSrcFromCandidates(
    getImageDisplayUrlCandidates(params.coverPhoto)
  )
  const coverImage = await getImageInfo(coverSrc)
  const ctx = componentInstance
    ? uni.createCanvasContext(TRIP_SHARE_CANVAS_ID, componentInstance as WechatMiniprogram.IAnyObject)
    : uni.createCanvasContext(TRIP_SHARE_CANVAS_ID)

  drawCoverImage(ctx, coverImage)
  drawTitle(ctx, params.title)

  return new Promise<string>((resolve, reject) => {
    ctx.draw(false, () => {
      setTimeout(() => {
        const options: UniApp.CanvasToTempFilePathOptions = {
          canvasId: TRIP_SHARE_CANVAS_ID,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          destWidth: CANVAS_WIDTH * 2,
          destHeight: CANVAS_HEIGHT * 2,
          fileType: 'jpg',
          quality: 0.92,
          success: res => resolve(res.tempFilePath),
          fail: err => reject(err)
        }
        if (componentInstance) {
          uni.canvasToTempFilePath(options, componentInstance as WechatMiniprogram.IAnyObject)
        } else {
          uni.canvasToTempFilePath(options)
        }
      }, 160)
    })
  })
}
