export interface BaseResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ──────────────────────────────────────────────
// 邮箱 + 密码注册 / 登录
// ──────────────────────────────────────────────

/** 注册请求 */
export interface AccountRegisterReq {
  email: string
  password: string
  nickname?: string
}

/** 账号密码登录请求 */
export interface AccountLoginReq {
  email: string
  password: string
}

/** 登录响应中的用户信息 */
export interface AuthLoginUser {
  id: string
  email?: string
  nickname?: string
  avatarFileId?: string
  avatarUrl?: string
  loginType?: string
}

/** 登录 / 注册统一响应 */
export interface AuthLoginRes {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  user?: AuthLoginUser
  isNewUser: boolean
}

/** 刷新 AccessToken 请求 */
export interface RefreshTokenReq {
  refreshToken: string
}

/** 刷新 AccessToken 响应 */
export interface RefreshTokenRes {
  accessToken: string
  accessTokenExpiresAt: string
}

// ──────────────────────────────────────────────
// 密码重置 / 修改
// ──────────────────────────────────────────────

/** 发送邮箱密码重置验证码请求 */
export interface SendPasswordResetEmailCodeReq {
  email: string
}

/** 发送邮箱密码重置验证码响应 */
export interface SendPasswordResetEmailCodeRes {
  expireSeconds: number
  retryAfterSeconds: number
}

/** 重置密码请求 */
export interface ResetPasswordReq {
  email: string
  code: string
  newPassword: string
}

/** 修改密码请求（已登录） */
export interface ChangePasswordReq {
  oldPassword: string
  newPassword: string
}

/** 发送首次绑定邮箱验证码请求 */
export interface EmailBindSendCodeReq {
  email: string
}

/** 首次绑定邮箱验证码响应 */
export interface EmailBindSendCodeRes {
  expireSeconds: number
  retryAfterSeconds: number
}

/** 首次绑定邮箱确认请求 */
export interface EmailBindConfirmReq {
  email: string
  code: string
  password: string
}

// ──────────────────────────────────────────────
// 手机号绑定
// ──────────────────────────────────────────────

/** 发送手机号绑定验证码请求 */
export interface PhoneBindSendCodeReq {
  /** 手机号，含国际区号，如 +8613812345678 */
  phone: string
}

/** 发送手机号绑定验证码响应 */
export interface PhoneBindSendCodeRes {
  expireSeconds: number
  retryAfterSeconds: number
}

/** 确认绑定手机号请求 */
export interface PhoneBindConfirmReq {
  /** 手机号，含国际区号 */
  phone: string
  /** 6 位数字验证码 */
  code: string
}

// ──────────────────────────────────────────────
// 微信小程序一键登录
// ──────────────────────────────────────────────

/** 微信小程序登录请求 */
export interface WechatMiniLoginReq {
  code: string
}

/** 微信小程序登录响应 */
export interface WechatMiniLoginRes {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  accessTokenExpiresAt: string
  user: WechatMiniLoginUser
  isNewUser: boolean
}

/** 微信小程序登录响应中的用户信息（字段子集，完整信息需通过 /users/me 获取） */
export interface WechatMiniLoginUser {
  id: string
  nickname?: string
  loginType?: string
}
