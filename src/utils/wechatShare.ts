import type { CoverPhoto } from '@/types/trip'

export const WECHAT_SHARE_DEFAULT_TITLE = '趣溪 Tracci'
export const WECHAT_SHARE_HOME_PATH = '/pages/index/index'
export const WECHAT_INVITATION_SHARE_TITLE = '邀请你一起编辑旅行'

/** 小程序默认分享图（品牌 App 图标 256px，文件小加载快） */
export const WECHAT_SHARE_DEFAULT_IMAGE =
  '/static/brand/generated/miniapp-icon-white-256.png'

export interface WechatShareAppMessage {
  title: string
  path: string
  imageUrl?: string
}

export interface WechatShareTimeline {
  title: string
  query?: string
  imageUrl?: string
}

export function buildDefaultShareAppMessage(): WechatShareAppMessage {
  return {
    title: WECHAT_SHARE_DEFAULT_TITLE,
    path: WECHAT_SHARE_HOME_PATH,
    imageUrl: WECHAT_SHARE_DEFAULT_IMAGE
  }
}

export function buildInvitationShareAppMessage(path: string): WechatShareAppMessage {
  return {
    title: WECHAT_INVITATION_SHARE_TITLE,
    path
  }
}

export function getWechatShareImageUrl(coverPhoto?: CoverPhoto | null): string | undefined {
  if (!coverPhoto) return undefined
  const url = coverPhoto.previewUrl || coverPhoto.url || coverPhoto.thumbnailUrl
  if (!url?.startsWith('https://')) return undefined
  return url
}

export function buildTripShareAppMessage(params: {
  id: string
  title: string
  destinationDisplay?: string
  coverPhoto?: CoverPhoto | null
  imageUrl?: string
}): WechatShareAppMessage {
  const tripTitle = params.title.trim() || '我的旅行'
  const imageUrl = params.imageUrl || getWechatShareImageUrl(params.coverPhoto)

  return {
    title: tripTitle,
    path: `/pages/trip/detail?id=${encodeURIComponent(params.id)}&visitor=guest`,
    ...(imageUrl ? { imageUrl } : {})
  }
}

export function appMessageToTimeline(message: WechatShareAppMessage): WechatShareTimeline {
  const query = extractQueryFromPath(message.path)
  return {
    title: message.title,
    ...(query ? { query } : {}),
    ...(message.imageUrl ? { imageUrl: message.imageUrl } : {})
  }
}

function extractQueryFromPath(path: string): string {
  const queryIndex = path.indexOf('?')
  if (queryIndex === -1) return ''
  return path.slice(queryIndex + 1)
}
