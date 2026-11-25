import { http } from '@/utils/http'
import type {
  AccountRegisterReq,
  AccountLoginReq,
  AuthLoginRes,
  RefreshTokenReq,
  RefreshTokenRes,
  SendPasswordResetEmailCodeReq,
  SendPasswordResetEmailCodeRes,
  ResetPasswordReq,
  ChangePasswordReq,
  EmailBindSendCodeReq,
  EmailBindSendCodeRes,
  EmailBindConfirmReq,
  // 微信小程序登录
  WechatMiniLoginReq,
  WechatMiniLoginRes,
  // 手机号绑定
  PhoneBindSendCodeReq,
  PhoneBindSendCodeRes,
  PhoneBindConfirmReq
} from '@/types/auth'

export const AuthService = {
  // ──────────────────────────────────────────────
  // 邮箱 + 密码注册 / 登录
  // ──────────────────────────────────────────────

  /**
   * 邮箱注册
   */
  register(data: AccountRegisterReq) {
    return http<AuthLoginRes>({
      url: '/auth/register',
      method: 'POST',
      data,
      custom: {
        noAuth: true
      }
    })
  },

  /**
   * 邮箱密码登录
   */
  loginWithPassword(data: AccountLoginReq) {
    return http<AuthLoginRes>({
      url: '/auth/login',
      method: 'POST',
      data,
      custom: {
        noAuth: true
      }
    })
  },

  /**
   * 退出登录
   */
  logout() {
    return http<null>({
      url: '/auth/logout',
      method: 'POST'
    })
  },

  /**
   * 刷新 AccessToken
   */
  refreshToken(data: RefreshTokenReq) {
    return http<RefreshTokenRes>({
      url: '/auth/refresh',
      method: 'POST',
      data,
      custom: {
        noAuth: true
      }
    })
  },

  // ──────────────────────────────────────────────
  // 密码重置 / 修改
  // ──────────────────────────────────────────────

  /**
   * 发送邮箱密码重置验证码
   */
  sendPasswordResetEmailCode(data: SendPasswordResetEmailCodeReq) {
    return http<SendPasswordResetEmailCodeRes>({
      url: '/auth/password/reset/email-code',
      method: 'POST',
      data,
      custom: {
        noAuth: true
      }
    })
  },

  /**
   * 重置密码（邮箱 + 验证码 + 新密码）
   */
  resetPassword(data: ResetPasswordReq) {
    return http<null>({
      url: '/auth/password/reset',
      method: 'POST',
      data,
      custom: {
        noAuth: true
      }
    })
  },

  /**
   * 修改密码（已登录，旧密码 + 新密码）
   */
  changePassword(data: ChangePasswordReq) {
    return http<null>({
      url: '/auth/password/change',
      method: 'POST',
      data
    })
  },

  // ──────────────────────────────────────────────
  // 邮箱绑定
  // ──────────────────────────────────────────────

  sendEmailBindCode(data: EmailBindSendCodeReq) {
    return http<EmailBindSendCodeRes>({
      url: '/auth/email/bind/send-code',
      method: 'POST',
      data
    })
  },

  confirmEmailBind(data: EmailBindConfirmReq) {
    return http<null>({
      url: '/auth/email/bind/confirm',
      method: 'POST',
      data
    })
  },

  /*
   * FUTURE（待产品确认）：邮箱换绑 API 接入点。
   * 暂不猜测路径、请求字段或校验方式；契约确认后再恢复独立方法。
   */

  // ──────────────────────────────────────────────
  // 微信小程序一键登录（暂时屏蔽入口，代码保留）
  // ──────────────────────────────────────────────

  /**
   * 微信小程序登录（code 换 token）
   */
  loginByWechatMini(data: WechatMiniLoginReq) {
    return http<WechatMiniLoginRes>({
      url: '/auth/wechat-mini/login',
      method: 'POST',
      data,
      custom: {
        noAuth: true,
        noToast: true
      }
    })
  },

  // ──────────────────────────────────────────────
  // 手机号绑定
  // ──────────────────────────────────────────────

  /**
   * 发送手机号绑定验证码
   */
  sendPhoneBindCode(data: PhoneBindSendCodeReq) {
    return http<PhoneBindSendCodeRes>({
      url: '/auth/phone/bind/send-code',
      method: 'POST',
      data
    })
  },

  /**
   * 确认绑定手机号（验证码校验）
   */
  confirmPhoneBind(data: PhoneBindConfirmReq) {
    return http<null>({
      url: '/auth/phone/bind/confirm',
      method: 'POST',
      data
    })
  },

  /**
   * 解绑手机号
   */
  unbindPhone() {
    return http<null>({
      url: '/auth/phone/unbind',
      method: 'POST',
      data: {}
    })
  }
}
