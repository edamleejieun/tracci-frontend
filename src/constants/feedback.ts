import type { FeedbackType } from '@/types/feedback'

/** 与 package.json / manifest.json versionName 保持一致 */
export const APP_VERSION = '1.0.2'

export const FEEDBACK_CONTENT_MIN = 10
export const FEEDBACK_CONTENT_MAX = 200
export const FEEDBACK_IMAGE_MAX = 3

export interface FeedbackTypeOption {
  value: FeedbackType
  label: string
}

export const FEEDBACK_TYPE_OPTIONS: FeedbackTypeOption[] = [
  { value: 'BUG', label: '问题反馈' },
  { value: 'FEATURE', label: '功能建议' },
  { value: 'UX', label: '体验问题' },
  { value: 'ACCOUNT', label: '账号问题' },
  { value: 'OTHER', label: '其他' }
]