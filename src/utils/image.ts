/**
 * 图片处理统一工具类
 * 适配后端腾讯云数据万象 CI 派生 URL 字段
 */

import type { CoverPhoto } from '@/types/trip'

export interface BaseImageParams {
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
}

export const getImageThumbnailUrl = (image?: BaseImageParams | CoverPhoto | null): string => {
  if (!image) return ''
  return image.thumbnailUrl || image.previewUrl || image.url || ''
}

/**
 * 列表/卡片展示用图：小程序优先 url（更短、无重复 CI 参数），避免 thumbnail 预签名解码失败。
 */
export const getImageListDisplayUrl = (image?: BaseImageParams | CoverPhoto | null): string => {
  if (!image) return ''
  if (import.meta.env.UNI_PLATFORM === 'h5') {
    return image.thumbnailUrl || image.previewUrl || image.url || ''
  }
  return image.url || image.thumbnailUrl || image.previewUrl || ''
}

/** 按优先级去重后的展示 URL 候选（用于逐级回退） */
export const getImageDisplayUrlCandidates = (
  image?: BaseImageParams | CoverPhoto | string | null
): string[] => {
  if (!image) return []
  if (typeof image === 'string') return image ? [image] : []
  const ordered =
    import.meta.env.UNI_PLATFORM === 'h5'
      ? [image.thumbnailUrl, image.previewUrl, image.url]
      : [image.url, image.thumbnailUrl, image.previewUrl]
  return [...new Set(ordered.filter((u): u is string => Boolean(u)))]
}

export const getImagePreviewUrl = (image?: BaseImageParams | CoverPhoto | null): string => {
  if (!image) return ''
  return image.previewUrl || image.url || image.thumbnailUrl || ''
}

/**
 * 通用图片 URL（含 thumbnail 降级），用于非 Canvas 场景。
 * 小程序导出图请使用 `resolveExportImageUrl`（禁止降级 thumbnailUrl）。
 */
export const getImageExportUrl = (image?: BaseImageParams | CoverPhoto | null): string => {
  if (!image) return ''
  return image.exportUrl || image.previewUrl || image.thumbnailUrl || image.url || ''
}

/** 本地上传预览：上传完成后优先用 CDN 地址（小程序临时路径可能失效） */
export const getLocalUploadDisplayUrl = (file?: {
  localPath: string
  status?: string
  thumbnailUrl?: string
  previewUrl?: string
  url?: string
} | null): string => {
  if (!file) return ''
  if (file.status === 'uploaded') {
    const remote = getImageThumbnailUrl(file) || getImagePreviewUrl(file)
    if (remote) return remote
  }
  return file.localPath
}

const DISPLAY_PATH_CACHE_MAX = 80
const displayPathCache = new Map<string, string>()

/** 是否为本机路径（无需 downloadFile） */
export const isLocalImagePath = (path: string): boolean => {
  if (!path) return true
  // 微信小程序 chooseImage 临时路径：wxfile:// 或 DevTools 展示的 http(s)://tmp/
  // 注意：http(s)://tmp/ 仅在开发者工具中出现，真机上不会触发此分支
  if (
    path.startsWith('wxfile://') ||
    path.startsWith('http://tmp/') ||
    path.startsWith('https://tmp/')
  ) {
    return true
  }
  if (path.startsWith('http://') || path.startsWith('https://')) return false
  return (
    path.startsWith('file://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    (path.startsWith('/') && !path.startsWith('//'))
  )
}

function cacheDisplayPath(remote: string, local: string) {
  if (displayPathCache.size >= DISPLAY_PATH_CACHE_MAX) {
    const first = displayPathCache.keys().next().value
    if (first) displayPathCache.delete(first)
  }
  displayPathCache.set(remote, local)
}

const IS_H5_PLATFORM = import.meta.env.UNI_PLATFORM === 'h5'

/** 校验本地临时路径是否可被 image 组件解码 */
export function verifyDisplayImagePath(path: string): Promise<boolean> {
  if (!path) return Promise.resolve(false)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return Promise.resolve(IS_H5_PLATFORM)
  }
  return new Promise(resolve => {
    uni.getImageInfo({
      src: path,
      success: () => resolve(true),
      fail: err => {
        console.warn('[image] getImageInfo failed:', path.slice(0, 60), err)
        resolve(false)
      }
    })
  })
}

/**
 * 将远程图片转为可展示的 src。
 * 微信小程序对 COS 预签名 URL 需先 downloadFile 到临时路径，否则 <image> 会空白。
 */
export function resolveImageSrcForDisplay(url: string): Promise<string> {
  if (!url) return Promise.resolve('')
  if (isLocalImagePath(url)) return Promise.resolve(url)

  const cached = displayPathCache.get(url)
  if (cached) return Promise.resolve(cached)

  if (IS_H5_PLATFORM) return Promise.resolve(url)

  return new Promise(resolve => {
    uni.downloadFile({
      url,
      success: res => {
        if (res.statusCode !== 200 || !res.tempFilePath) {
          console.warn('[image] downloadFile bad response', res.statusCode)
          resolve('')
          return
        }
        uni.getImageInfo({
          src: res.tempFilePath,
          success: () => {
            cacheDisplayPath(url, res.tempFilePath)
            resolve(res.tempFilePath)
          },
          fail: err => {
            console.warn('[image] downloaded file is not a valid image', err)
            resolve('')
          }
        })
      },
      fail: err => {
        console.warn('[image] downloadFile failed', err)
        resolve('')
      }
    })
  })
}

/** 依次尝试多个远程 URL，返回第一个可展示的本地/H5 路径 */
export async function resolveImageSrcFromCandidates(urls: string[]): Promise<string> {
  for (const url of urls) {
    const src = await resolveImageSrcForDisplay(url)
    if (!src) continue
    if (await verifyDisplayImagePath(src)) return src
  }
  return ''
}

export const isImageUrlAvailable = (image?: BaseImageParams | CoverPhoto | null): boolean => {
  if (!image) return false
  return Boolean(image.exportUrl || image.previewUrl || image.thumbnailUrl || image.url)
}

export const getTripCoverThumbnailUrl = (trip?: { coverPhoto?: CoverPhoto } | null): string => {
  if (!trip?.coverPhoto) return ''
  return getImageThumbnailUrl(trip.coverPhoto)
}

export const getTripCoverPreviewUrl = (trip?: { coverPhoto?: CoverPhoto } | null): string => {
  if (!trip?.coverPhoto) return ''
  return getImagePreviewUrl(trip.coverPhoto)
}
