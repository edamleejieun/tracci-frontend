/**
 * 共享 Binding Sheet 逻辑
 *
 * 为 EmailBindSheet / PhoneBindSheet 提供统一的：
 *   - 验证码倒计时管理
 *   - API 错误 → 字段级/全局错误映射
 *   - 发送验证码的通用流程（loading → countdown → error）
 *   - 手机号 / 邮箱格式校验
 */

import { ref, type Ref } from 'vue'
import { HttpError } from '@/utils/http'
import {
  ERR_CODE_ALREADY_BOUND,
  ERR_CODE_BAD_PARAM,
  ERR_CODE_INVALID,
  ERR_CODE_NEED_OTHER_LOGIN,
  ERR_CODE_NEED_PASSWORD,
  ERR_CODE_RATE_LIMITED,
} from '@/constants/apiErrors'

// ── 导出类型 ──────────────────────────────────────────────

export interface UseBindingSheetOptions {
  /** 倒计时时长（秒），默认 60 */
  countdownSeconds?: number
}

export interface FieldMap {
  /** 验证码字段 error ref */
  code?: Ref<string>
  /** 邮箱字段 error ref */
  email?: Ref<string>
  /** 手机号字段 error ref */
  phone?: Ref<string>
}

export interface UseBindingSheetReturn {
  /** 当前倒计时剩余秒数 */
  countdown: Ref<number>
  /** 全局错误消息（API 返回的提示级错误） */
  errorMessage: Ref<string>
  /** 启动倒计时 */
  startCountdown: (seconds?: number) => void
  /** 清除倒计时 */
  clearCountdown: () => void
  /** 通用字段错误映射：根据 err 内容设置对应字段的 error ref */
  mapApiError: (err: unknown, fieldMap: FieldMap) => void
  /** 通用发送验证码流程 */
  sendCode: (options: {
    /** 发送验证码 API */
    sendApi: () => Promise<{ retryAfterSeconds?: number }>
    /** 是否满足发送条件 */
    canSend: boolean
    /** 发送中 loading ref */
    sending: Ref<boolean>
    /** 额外的前置校验，失败时 throw */
    preCheck?: () => void
  }) => Promise<void>
  /** 纯函数：校验手机号格式 */
  validatePhone: (digits: string) => string | null
  /** 纯函数：校验邮箱格式 */
  validateEmail: (email: string) => string | null
}

// ── 实现 ──────────────────────────────────────────────────

export function useBindingSheet(
  opts: UseBindingSheetOptions = {}
): UseBindingSheetReturn {
  const { countdownSeconds = 60 } = opts

  const countdown = ref(0)
  const errorMessage = ref('')
  let timer: ReturnType<typeof setInterval> | null = null

  function startCountdown(seconds = countdownSeconds) {
    clearCountdown()
    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearCountdown()
      }
    }, 1000)
  }

  function clearCountdown() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = 0
  }

  /**
   * 将 API 错误映射到字段级 error ref。
   * 优先使用后端返回的 numeric code 进行可靠映射（比消息字符串稳定）。
   *
   * @param err - catch 到的错误
   * @param fieldMap - { 字段标识: 对应的 ref } ，如 { code, email, phone }
   * @param context - 可选上下文，用于更精确映射
   */
  function mapApiError(
    err: unknown,
    fieldMap: FieldMap
  ) {
    // 先清空所有字段错误
    Object.values(fieldMap).forEach((r) => {
      ;(r as Ref<string>).value = ''
    })
    errorMessage.value = ''

    const httpErr = err instanceof HttpError ? err : null
    const code = httpErr?.code
    const msg = (err as { message?: string })?.message || ''
    const lower = msg.toLowerCase()

    // 1. 优先按错误码映射（最可靠）
    if (code === ERR_CODE_INVALID) {
      // 验证码错误或过期
      if (fieldMap.code) {
        fieldMap.code.value = msg || '验证码错误或已过期'
        return
      }
      errorMessage.value = msg || '验证码错误或已过期'
      return
    }
    if (code === ERR_CODE_BAD_PARAM) {
      // 参数格式错误
      const target = fieldMap.code || fieldMap.email || fieldMap.phone
      if (target) {
        target.value = msg || '输入格式不正确'
        return
      }
      errorMessage.value = msg || '输入格式不正确'
      return
    }
    if (code === ERR_CODE_ALREADY_BOUND) {
      // 已被其他账号绑定
      errorMessage.value = '该信息已被其他账号绑定'
      return
    }
    if (code === ERR_CODE_NEED_OTHER_LOGIN) {
      errorMessage.value = '请先绑定其他登录方式后再解绑'
      return
    }
    if (code === ERR_CODE_NEED_PASSWORD) {
      errorMessage.value = '请先设置密码后再操作'
      return
    }
    if (code === ERR_CODE_RATE_LIMITED || lower.includes('频繁') || lower.includes('429')) {
      errorMessage.value = '操作过于频繁，请稍后再试'
      return
    }

    // 2. 字段关键词映射（兜底）
    for (const [keyword, fieldRef] of Object.entries(fieldMap)) {
      if (msg.includes(keyword) || lower.includes(keyword.toLowerCase())) {
        fieldRef.value = msg
        return
      }
    }

    // 3. 通用消息兜底
    if (lower.includes('已被') || lower.includes('绑定')) {
      errorMessage.value = '该信息已被其他账号绑定'
    } else if (msg) {
      errorMessage.value = msg
    } else {
      errorMessage.value = '操作失败，请重试'
    }
  }

  /**
   * 通用发送验证码流程
   */
  async function sendCode(options: {
    /** 发送验证码 API */
    sendApi: () => Promise<{ retryAfterSeconds?: number }>
    /** 是否满足发送条件 */
    canSend: boolean
    /** 发送中 loading ref */
    sending: Ref<boolean>
    /** 额外的前置校验，失败时 throw */
    preCheck?: () => void
  }) {
    const { sendApi, canSend, sending, preCheck } = options
    if (countdown.value > 0 || !canSend || sending.value) return

    // 前置校验
    preCheck?.()

    sending.value = true
    errorMessage.value = ''

    try {
      const res = await sendApi()
      startCountdown(res.retryAfterSeconds)
    } catch (err) {
      // 复用 mapApiError 以获得基于错误码的可靠映射
      mapApiError(err, {})
    } finally {
      sending.value = false
    }
  }

  function validatePhone(digits: string): string | null {
    if (!digits) return '请输入手机号'
    if (digits.length !== 11) return '手机号应为 11 位'
    if (!/^1[3-9]\d{9}$/.test(digits)) return '请输入有效的手机号'
    return null
  }

  function validateEmail(email: string): string | null {
    if (!email.trim()) return '请输入邮箱地址'
    if (email.length > 320) return '邮箱地址过长'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '请输入有效的邮箱地址'
    return null
  }

  return {
    countdown,
    errorMessage,
    startCountdown,
    clearCountdown,
    mapApiError,
    sendCode,
    validatePhone,
    validateEmail,
  }
}
