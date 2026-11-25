<template>
  <view class="forgot-page">
    <!-- 背景装饰 -->
    <view class="bg-decor bg-decor--top" />
    <view class="bg-decor bg-decor--bottom" />

    <!-- 标题区 -->
    <view class="title-area">
      <text class="title-text">{{ currentStep === 'email' ? '找回密码' : '重置密码' }}</text>
      <text class="subtitle-text">
        {{ currentStep === 'email' ? '输入注册邮箱，获取验证码' : '输入验证码并设置新密码' }}
      </text>
    </view>

    <!-- 错误提示 -->
    <view v-if="errorMsg" class="error-card">
      <view class="i-carbon-warning error-icon" />
      <text class="error-text">{{ errorMsg }}</text>
    </view>

    <!-- Step 1: 输入邮箱 -->
    <view v-if="currentStep === 'email'" class="form-area">
      <view class="form-group">
        <text class="form-label">邮箱</text>
        <input
          v-model="emailForm.email"
          class="form-input"
          placeholder="请输入注册邮箱"
          type="text"
          autocomplete="email"
        />
      </view>

      <view class="hint-card">
        <view class="i-carbon-information hint-icon" />
        <text class="hint-text">如果该邮箱已注册，我们将发送验证码</text>
      </view>

      <button
        class="submit-btn"
        :disabled="sendingCode"
        @click="handleSendCode"
      >
        <view v-if="sendingCode" class="btn-loading">
          <view class="i-carbon-circle-dash animate-spin btn-spinner" />
        </view>
        <text>{{ sendingCode ? '发送中...' : '发送验证码' }}</text>
      </button>
    </view>

    <!-- Step 2: 输入验证码和新密码 -->
    <view v-else class="form-area">
      <view class="form-group">
        <text class="form-label">验证码</text>
        <view class="code-row">
          <input
            v-model="resetForm.code"
            class="form-input form-input--code"
            placeholder="请输入6位验证码"
            type="number"
            maxlength="6"
          />
          <view
            class="resend-btn"
            :class="{ 'resend-btn--disabled': countdown > 0 }"
            @click="handleResendCode"
          >
            <text class="resend-text">
              {{ countdown > 0 ? `${countdown}s` : '重新发送' }}
            </text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">新密码</text>
        <input
          v-model="resetForm.newPassword"
          class="form-input"
          type="password"
          placeholder="8-30位，需包含字母和数字"
          autocomplete="new-password"
        />
      </view>

      <view class="form-group">
        <text class="form-label">确认新密码</text>
        <input
          v-model="resetForm.confirmPassword"
          class="form-input"
          type="password"
          placeholder="请再次输入新密码"
          autocomplete="new-password"
        />
      </view>

      <button
        class="submit-btn"
        :disabled="resetting"
        @click="handleResetPassword"
      >
        <view v-if="resetting" class="btn-loading">
          <view class="i-carbon-circle-dash animate-spin btn-spinner" />
        </view>
        <text>{{ resetting ? '重置中...' : '重置密码' }}</text>
      </button>
    </view>

    <!-- 返回登录 -->
    <view class="login-link-area">
      <text class="login-link-text" @click="goToLogin">返回登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { AuthService } from '@/services/auth'
import { useUserStore } from '@/stores/user'

const currentStep = ref<'email' | 'reset'>('email')

const emailForm = ref({ email: '' })
const resetForm = ref({ code: '', newPassword: '', confirmPassword: '' })

const sendingCode = ref(false)
const resetting = ref(false)
const errorMsg = ref('')
const countdown = ref(0)

let countdownTimer: ReturnType<typeof setInterval> | null = null

const userStore = useUserStore()

/** 基本邮箱格式校验 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** 密码格式校验：8-30位，包含字母和数字 */
const isValidPassword = (pwd: string): boolean => {
  if (pwd.length < 8 || pwd.length > 30) return false
  return /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)
}

const startCountdown = (seconds: number) => {
  countdown.value = seconds
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (sendingCode.value || countdown.value > 0) return

  const { email } = emailForm.value
  if (!email.trim()) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }
  if (!isValidEmail(email.trim())) {
    uni.showToast({ title: '请输入正确的邮箱格式', icon: 'none' })
    return
  }

  sendingCode.value = true
  errorMsg.value = ''

  try {
    const res = await AuthService.sendPasswordResetEmailCode({ email: email.trim() })
    // 无论邮箱是否存在，后端都返回成功
    startCountdown(res.retryAfterSeconds || 60)
    currentStep.value = 'reset'
    // 预填邮箱到 reset 表单
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (err: unknown) {
    const e = err as { message?: string; name?: string }
    if (e?.name === 'HttpError') {
      errorMsg.value = e.message || '发送失败，请重试'
    } else {
      errorMsg.value = '发送失败，请重试'
    }
  } finally {
    sendingCode.value = false
  }
}

const handleResendCode = async () => {
  if (countdown.value > 0) return
  await handleSendCode()
}

const handleResetPassword = async () => {
  if (resetting.value) return

  const { code, newPassword, confirmPassword } = resetForm.value
  const email = emailForm.value.email.trim()

  // 校验
  if (!code.trim() || code.trim().length !== 6) {
    uni.showToast({ title: '请输入6位验证码', icon: 'none' })
    return
  }
  if (!newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  if (!isValidPassword(newPassword)) {
    uni.showToast({ title: '密码需8-30位，包含字母和数字', icon: 'none' })
    return
  }
  if (newPassword !== confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  resetting.value = true
  errorMsg.value = ''

  try {
    await AuthService.resetPassword({
      email,
      code: code.trim(),
      newPassword
    })

    // 清除本地旧 token
    userStore.clearAuthState()

    uni.showModal({
      title: '密码已重置',
      content: '请使用新密码重新登录',
      showCancel: false,
      confirmText: '去登录',
      success: () => {
        uni.redirectTo({ url: '/pages/login/index' })
      }
    })
  } catch (err: unknown) {
    const e = err as { message?: string; name?: string }
    if (e?.name === 'HttpError') {
      errorMsg.value = e.message || '重置失败，请重试'
    } else {
      errorMsg.value = '重置失败，请重试'
    }
  } finally {
    resetting.value = false
  }
}

const goToLogin = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/login/index' })
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.forgot-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding: 22px 28px 28px;
  box-sizing: border-box;
  position: relative;
  overflow-x: hidden;
}

.bg-decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.bg-decor--top {
  width: 320px;
  height: 320px;
  top: -120px;
  right: -100px;
  background: rgba(79, 125, 255, 0.06);
}

.bg-decor--bottom {
  width: 200px;
  height: 200px;
  bottom: -60px;
  left: -60px;
  background: rgba(79, 125, 255, 0.03);
}

.title-area {
  margin-bottom: 22px;
}

.title-text {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #2F2A25;
  margin-bottom: 8px;
}

.subtitle-text {
  display: block;
  font-size: 15px;
  color: #7A746B;
}

.error-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 18px;
  color: #EF4444;
  flex-shrink: 0;
}

.error-text {
  font-size: 13px;
  color: #DC2626;
  line-height: 1.4;
}

.form-area {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #2F2A25;
}

.form-input {
  height: 50px;
  padding: 0 16px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #E8E4DE;
  font-size: 15px;
  color: #2F2A25;
  transition: border-color 0.2s ease;
}

.form-input::placeholder {
  color: #9B958C;
}

.code-row {
  display: flex;
  gap: 12px;
}

.form-input--code {
  flex: 1;
}

.resend-btn {
  height: 50px;
  padding: 0 16px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #E8E4DE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resend-btn--disabled {
  opacity: 0.5;
}

.resend-text {
  font-size: 13px;
  color: #4F7DFF;
  white-space: nowrap;
}

.hint-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
}

.hint-icon {
  font-size: 16px;
  color: #4F7DFF;
  flex-shrink: 0;
}

.hint-text {
  font-size: 13px;
  color: #1E40AF;
  line-height: 1.4;
}

.submit-btn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  background: #4F7DFF;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px -2px rgba(79, 125, 255, 0.2);
  margin-top: 4px;
}

.submit-btn::after {
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.75;
}

.btn-loading {
  display: flex;
  align-items: center;
}

.btn-spinner {
  font-size: 20px;
}

.login-link-area {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.login-link-text {
  font-size: 14px;
  color: #4F7DFF;
}

.login-link-text:active {
  opacity: 0.7;
}
</style>
