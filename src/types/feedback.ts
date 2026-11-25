export type FeedbackType = 'BUG' | 'FEATURE' | 'UX' | 'ACCOUNT' | 'OTHER'

export type FeedbackContactType = 'WECHAT' | 'EMAIL' | 'PHONE' | 'OTHER'

export type FeedbackPlatform = 'WECHAT_MINI' | 'IOS' | 'H5' | 'UNKNOWN'

export interface FeedbackSystemInfo {
  brand?: string
  model?: string
  system?: string
  platform?: string
  SDKVersion?: string
  version?: string
  wechatVersion?: string
}

export interface SubmitFeedbackRequest {
  type: FeedbackType
  title?: string
  content: string
  contactType?: FeedbackContactType
  contact?: string
  imageIds?: string[]
  platform?: FeedbackPlatform
  appVersion?: string
  systemInfo?: FeedbackSystemInfo | null
}

export interface SubmitFeedbackResponse {
  id: string
  status: string
  createdAt: string
}
