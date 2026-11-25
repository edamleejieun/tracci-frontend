const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 校验反馈联系邮箱格式 */
export function isValidFeedbackEmail(contact: string): boolean {
  return EMAIL_RE.test(contact.trim())
}