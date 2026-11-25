import type { ExportPhotoItem, PreparedCanvasImage } from '@/types/export'

/** 导出图照片短边最低像素（低于此值记录 warning，仍尝试绘制） */
export const EXPORT_MIN_IMAGE_SHORT_EDGE = 800

const DOWNLOAD_TIMEOUT_MS = 15000
const MAX_EXPORT_PHOTOS = 3

export type ExportImageUrlSource = 'exportUrl' | 'previewUrl' | 'url' | 'none'

export type ExportImageWarningCode =
  | 'missing_export_url'
  | 'fallback_original_url'
  | 'fallback_after_download_failed'
  | 'download_failed'
  | 'low_resolution'
  | 'no_url'

export interface ExportImageWarning {
  code: ExportImageWarningCode
  fileId: string
  message: string
}

export interface PrepareExportImagesResult {
  images: PreparedCanvasImage[]
  warnings: ExportImageWarning[]
}

type DownloadedCanvasImage = Omit<PreparedCanvasImage, 'fileId'>

interface ExportImageCandidate {
  url: string
  source: Exclude<ExportImageUrlSource, 'none'>
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise
      .then(value => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(fallback)
      })
  })
}

/**
 * 解析导出用图片 URL。
 * 禁止降级到 thumbnailUrl，避免导出图误用列表缩略图。
 */
export function resolveExportImageUrl(photo: ExportPhotoItem): {
  url: string
  source: ExportImageUrlSource
} {
  if (photo.exportUrl) {
    return { url: photo.exportUrl, source: 'exportUrl' }
  }
  if (photo.previewUrl) {
    return { url: photo.previewUrl, source: 'previewUrl' }
  }
  if (photo.url) {
    return { url: photo.url, source: 'url' }
  }
  return { url: '', source: 'none' }
}

function getExportImageCandidates(photo: ExportPhotoItem): ExportImageCandidate[] {
  const candidates: ExportImageCandidate[] = []
  if (photo.exportUrl) candidates.push({ url: photo.exportUrl, source: 'exportUrl' })
  if (photo.previewUrl) candidates.push({ url: photo.previewUrl, source: 'previewUrl' })
  if (photo.url) candidates.push({ url: photo.url, source: 'url' })
  return candidates
}

function pushWarning(
  warnings: ExportImageWarning[],
  code: ExportImageWarningCode,
  fileId: string,
  message: string
) {
  warnings.push({ code, fileId, message })
  console.warn(`[export:image] ${fileId} — ${message}`)
}

export function downloadCanvasImage(url: string): Promise<DownloadedCanvasImage> {
  if (!url) return Promise.resolve({ path: null, width: 0, height: 0 })
  const task = new Promise<DownloadedCanvasImage>(resolve => {
    uni.downloadFile({
      url,
      success: res => {
        if (res.statusCode === 200 && res.tempFilePath) {
          uni.getImageInfo({
            src: res.tempFilePath,
            success: info => {
              resolve({
                path: res.tempFilePath,
                width: info.width || 0,
                height: info.height || 0
              })
            },
            fail: () => resolve({ path: null, width: 0, height: 0 })
          })
        } else {
          resolve({ path: null, width: 0, height: 0 })
        }
      },
      fail: () => resolve({ path: null, width: 0, height: 0 })
    })
  })
  return withTimeout(task, DOWNLOAD_TIMEOUT_MS, { path: null, width: 0, height: 0 })
}

function validateDownloadedImage(
  photo: ExportPhotoItem,
  image: DownloadedCanvasImage,
  warnings: ExportImageWarning[]
) {
  if (!image.path) {
    return
  }

  const shortEdge = Math.min(image.width, image.height)
  if (shortEdge > 0 && shortEdge < EXPORT_MIN_IMAGE_SHORT_EDGE) {
    pushWarning(
      warnings,
      'low_resolution',
      photo.fileId,
      `图片分辨率偏低（短边 ${shortEdge}px < ${EXPORT_MIN_IMAGE_SHORT_EDGE}px）`
    )
  }
}

async function downloadBestAvailableImage(
  photo: ExportPhotoItem,
  warnings: ExportImageWarning[]
): Promise<DownloadedCanvasImage> {
  const candidates = getExportImageCandidates(photo)

  if (candidates.length === 0) {
    pushWarning(
      warnings,
      'no_url',
      photo.fileId,
      '缺少 exportUrl / previewUrl / url，无法加载高清图'
    )
    return { path: null, width: 0, height: 0 }
  }

  const primary = candidates[0]
  if (primary.source === 'previewUrl') {
    pushWarning(
      warnings,
      'missing_export_url',
      photo.fileId,
      '缺少 exportUrl，已降级使用 previewUrl'
    )
  } else if (primary.source === 'url') {
    pushWarning(
      warnings,
      'fallback_original_url',
      photo.fileId,
      '缺少 exportUrl / previewUrl，已使用原图 url'
    )
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]
    const downloaded = await downloadCanvasImage(candidate.url)
    if (downloaded.path) {
      if (index > 0) {
        pushWarning(
          warnings,
          'fallback_after_download_failed',
          photo.fileId,
          `首选图片下载失败，已降级使用 ${candidate.source}`
        )
      }
      return downloaded
    }
  }

  pushWarning(
    warnings,
    'download_failed',
    photo.fileId,
    '图片下载失败，导出图将显示占位'
  )
  return { path: null, width: 0, height: 0 }
}

export async function prepareExportCanvasImages(
  photos: ExportPhotoItem[]
): Promise<PrepareExportImagesResult> {
  const images: PreparedCanvasImage[] = []
  const warnings: ExportImageWarning[] = []

  for (const photo of photos.slice(0, MAX_EXPORT_PHOTOS)) {
    const downloaded = await downloadBestAvailableImage(photo, warnings)
    validateDownloadedImage(photo, downloaded, warnings)
    images.push({ fileId: photo.fileId, ...downloaded })
  }

  return { images, warnings }
}

/** 将 warnings 合并为一条可读文案；保留给调试面板或后续诊断使用，不阻断导出 */
export function summarizeExportImageWarnings(warnings: ExportImageWarning[]): string | null {
  if (!warnings.length) return null

  const codes = new Set(warnings.map(w => w.code))

  if (codes.has('no_url') || codes.has('download_failed')) {
    return '部分照片无法加载，已用占位显示'
  }
  if (
    codes.has('missing_export_url') ||
    codes.has('fallback_original_url') ||
    codes.has('fallback_after_download_failed')
  ) {
    return '部分照片未使用高清图，清晰度可能不足'
  }
  if (codes.has('low_resolution')) {
    return '部分照片分辨率较低，清晰度可能不足'
  }
  return '部分照片质量提示，请知悉'
}
