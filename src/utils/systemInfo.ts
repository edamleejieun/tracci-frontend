import type { FeedbackSystemInfo } from '@/types/feedback'

/** 收集反馈提交所需的设备信息（不含 openId、token 等敏感字段） */
export function collectFeedbackSystemInfo(): FeedbackSystemInfo {
  try {
    const sys = uni.getSystemInfoSync()
    return {
      brand: sys.brand,
      model: sys.model,
      system: sys.system,
      platform: sys.platform,
      SDKVersion: sys.SDKVersion,
      version: sys.version,
      wechatVersion: sys.version
    }
  } catch {
    return {}
  }
}
