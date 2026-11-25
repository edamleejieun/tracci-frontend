/** 与后端 TripCollaborationServiceImpl 对齐：邀请码固定 4 位。 */
export const INVITE_CODE_LENGTH = 4
export const INVITE_CODE_ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const allowedCharSet = new Set(INVITE_CODE_ALLOWED_CHARS.split(''))

/** 对齐后端 normalizeCode：trim + 大写 */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase()
}

/** 过滤非法字符并限制为 4 位 */
export function sanitizeInviteCodeInput(raw: string): string {
  const upper = raw.toUpperCase()
  const filtered = [...upper].filter(ch => allowedCharSet.has(ch)).join('')
  return filtered.slice(0, INVITE_CODE_LENGTH)
}

/** 前端提交前长度校验；最终有效性仍由后端 hash 查询决定 */
export function isInviteCodeSubmittable(code: string): boolean {
  return normalizeInviteCode(code).length === INVITE_CODE_LENGTH
}