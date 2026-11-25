import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import {
  appMessageToTimeline,
  buildDefaultShareAppMessage,
  buildInvitationShareAppMessage,
  type WechatShareAppMessage,
  type WechatShareTimeline
} from '@/utils/wechatShare'

export interface UseWechatShareOptions {
  getShareAppMessage?: (event?: Page.ShareAppMessageOption) => WechatShareAppMessage
  getShareTimeline?: () => WechatShareTimeline
}

function getButtonSharePath(event?: Page.ShareAppMessageOption): string | undefined {
  if (event?.from !== 'button') return undefined
  const path = event.target?.dataset?.sharePath
  if (typeof path !== 'string' || !path.startsWith('/')) return undefined
  // 给 co-editor 的分享路径加 from=share 来源标识，让落地页能区分「好友邀请」与「手填邀请码」
  if (path.startsWith('/pages/co-editor/') && !path.includes('from=')) {
    const sep = path.includes('?') ? '&' : '?'
    return `${path}${sep}from=share`
  }
  return path
}

export function useWechatShare(options: UseWechatShareOptions = {}) {
  const resolveAppMessage = (event?: Page.ShareAppMessageOption) => {
    const buttonSharePath = getButtonSharePath(event)
    if (buttonSharePath) {
      return buildInvitationShareAppMessage(buttonSharePath)
    }
    return options.getShareAppMessage?.(event) ?? buildDefaultShareAppMessage()
  }

  // #ifdef MP-WEIXIN
  try {
    uni.showShareMenu({
      withShareTicket: false,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  } catch (error) {
    console.warn('[wechatShare] showShareMenu failed', error)
  }

  onShareAppMessage(event => resolveAppMessage(event))

  onShareTimeline(() => {
    if (options.getShareTimeline) {
      return options.getShareTimeline()
    }
    return appMessageToTimeline(resolveAppMessage())
  })
  // #endif
}
