<template>
  <view class="register-page">
    <!-- 背景装饰 -->
    <view class="bg-decor bg-decor--top" />
    <view class="bg-decor bg-decor--bottom" />

    <view class="register-content">
      <!-- 标题区 -->
      <view class="title-area">
        <text class="title-text">创建账号</text>
        <text class="subtitle-text">用邮箱注册，马上开始记录你的旅程</text>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMsg" class="error-card">
        <view class="i-carbon-warning error-icon" />
        <text class="error-text">{{ errorMsg }}</text>
      </view>

      <view class="auth-panel">
        <!-- 表单 -->
        <view class="form-area">
          <view class="form-group">
            <text class="form-label">邮箱</text>
            <view class="form-field">
              <view class="i-carbon-email form-field-icon" />
              <input
                v-model="form.email"
                class="form-input"
                placeholder="请输入邮箱"
                type="text"
                autocomplete="email"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">密码</text>
            <view class="form-field">
              <view class="i-carbon-password form-field-icon" />
              <input
                v-model="form.password"
                class="form-input"
                type="password"
                placeholder="8-30位，需包含字母和数字"
                autocomplete="new-password"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">确认密码</text>
            <view class="form-field">
              <view class="i-carbon-password form-field-icon" />
              <input
                v-model="form.confirmPassword"
                class="form-input"
                type="password"
                placeholder="请再次输入密码"
                autocomplete="new-password"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">昵称 <text class="form-label-optional">（选填）</text></text>
            <view class="form-field">
              <view class="i-carbon-user form-field-icon" />
              <input
                v-model="form.nickname"
                class="form-input"
                placeholder="给自己取个名字吧"
                maxlength="50"
              />
            </view>
          </view>
        </view>

        <!-- 协议勾选 -->
        <view class="agreement" @click="toggleAgreement">
          <view
            class="agreement-check"
            :class="{ 'agreement-check--checked': agreedToLegal }"
          >
            <view v-if="agreedToLegal" class="i-carbon-checkmark agreement-check-icon" />
          </view>
          <text class="agreement-text">
            我已阅读并同意
            <text class="agreement-link" @click.stop="onAgreementTap('terms')">《用户协议》</text>
            和
            <text class="agreement-link" @click.stop="onAgreementTap('privacy')">《隐私政策》</text>
          </text>
        </view>

        <!-- 注册按钮 -->
        <button
          class="register-btn"
          :class="{ 'register-btn--inactive': !agreedToLegal }"
          :disabled="loading"
          @click="handleRegister"
        >
          <view v-if="loading" class="btn-loading">
            <view class="i-carbon-circle-dash animate-spin btn-spinner" />
          </view>
          <text>{{ loading ? '注册中...' : '注 册' }}</text>
        </button>

        <!-- 已有账号 -->
        <view class="login-link-area">
          <text class="login-link-text" @click="handleBack">已有账号？去登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWechatShare } from '@/composables/useWechatShare'
import { AuthService } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import { navigateToLegalPage } from '@/utils/wechatPrivacy'

const LEGAL_AGREED_STORAGE_KEY = 'legal_agreed'

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})
const loading = ref(false)
const errorMsg = ref('')
const agreedToLegal = ref(false)

const userStore = useUserStore()

useWechatShare()

/** 基本邮箱格式校验 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** 密码格式校验：8-30位，包含字母和数字 */
const isValidPassword = (pwd: string): boolean => {
  if (pwd.length < 8 || pwd.length > 30) return false
  return /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)
}

const toggleAgreement = () => {
  agreedToLegal.value = !agreedToLegal.value
  if (agreedToLegal.value) {
    uni.setStorageSync(LEGAL_AGREED_STORAGE_KEY, true)
  } else {
    uni.removeStorageSync(LEGAL_AGREED_STORAGE_KEY)
  }
}

const onAgreementTap = (type: 'terms' | 'privacy') => {
  navigateToLegalPage(type)
}

const handleRegister = async () => {
  if (loading.value) return

  if (!agreedToLegal.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return
  }

  const { email, password, confirmPassword, nickname } = form.value

  // 校验
  if (!email.trim()) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }
  if (!isValidEmail(email.trim())) {
    uni.showToast({ title: '请输入正确的邮箱格式', icon: 'none' })
    return
  }
  if (!password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (!isValidPassword(password)) {
    uni.showToast({ title: '密码需8-30位，包含字母和数字', icon: 'none' })
    return
  }
  if (password !== confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    uni.showLoading({ title: '注册中...', mask: true })
    const res = await AuthService.register({
      email: email.trim(),
      password,
      nickname: nickname.trim() || undefined
    })
    uni.hideLoading()

    if (!res.accessToken) {
      throw new Error('TOKEN_MISSING')
    }

    // 注册成功，保存登录态
    uni.setStorageSync(LEGAL_AGREED_STORAGE_KEY, true)
    userStore.setToken(res.accessToken)
    userStore.setRefreshToken(res.refreshToken)
    userStore.setAccessTokenExpiresAt(res.accessTokenExpiresAt)

    // 拉取完整用户信息
    uni.showLoading({ title: '同步账号信息...', mask: true })
    await Promise.race([
      userStore.fetchUserInfo(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ])
    uni.hideLoading()

    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' }).catch(() => {
        uni.reLaunch({ url: '/pages/index/index' })
      })
    }, 600)
  } catch (err: unknown) {
    uni.hideLoading()
    const e = err as { message?: string; name?: string }
    if (e?.message === 'TOKEN_MISSING') {
      errorMsg.value = '注册状态异常，请重试'
    } else if (e?.name === 'HttpError') {
      // 直接展示后端 message
      errorMsg.value = e.message || '注册失败，请重试'
    } else {
      errorMsg.value = '注册失败，请重试'
    }
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  uni.redirectTo({ url: '/pages/login/index' })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding: 22px 22px 28px;
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

.register-content {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.title-area {
  margin-bottom: 18px;
  text-align: center;
}

.title-text {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: #2F2A25;
  margin-bottom: 6px;
  letter-spacing: 0;
}

.subtitle-text {
  display: block;
  font-size: 14px;
  color: #7A746B;
  line-height: 1.5;
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

.auth-panel {
  width: 100%;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(229, 224, 218, 0.82);
  box-shadow: 0 14px 38px -20px rgba(47, 42, 37, 0.34);
  box-sizing: border-box;
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
  gap: 12px;
  margin-bottom: 16px;
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

.form-label-optional {
  font-size: 12px;
  color: #9B958C;
  font-weight: 400;
}

.form-field {
  height: 52px;
  padding: 0 14px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #E8E4DE;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
}

.form-field-icon {
  font-size: 18px;
  color: #9B958C;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  min-width: 0;
  height: 50px;
  padding: 0;
  background: transparent;
  border: 0;
  font-size: 15px;
  color: #2F2A25;
}

.form-input::placeholder {
  color: #9B958C;
}

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 0 2px;
}

.agreement-check {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid #C4BEB5;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.2s ease;
}

.agreement-check--checked {
  background: #4F7DFF;
  border-color: #4F7DFF;
}

.agreement-check-icon {
  font-size: 12px;
  color: #FFFFFF;
}

.agreement-text {
  flex: 1;
  font-size: 12px;
  color: #9B958C;
  line-height: 1.6;
  text-align: left;
}

.agreement-link {
  color: #4F7DFF;
}

.register-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  background: #4F7DFF;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 20px -10px rgba(79, 125, 255, 0.58);
}

.register-btn::after {
  border: none;
}

.register-btn[disabled] {
  opacity: 0.75;
}

.register-btn--inactive {
  opacity: 0.45;
}

.btn-loading {
  display: flex;
  align-items: center;
}

.btn-spinner {
  font-size: 20px;
}

.login-link-area {
  margin-top: 16px;
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
