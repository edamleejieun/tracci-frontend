<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decor bg-decor--top" />
    <view class="bg-decor bg-decor--bottom" />

    <!-- 品牌区 -->
    <view class="brand-area">
      <BrandLogo :size="56" />
      <text class="brand-name">趣溪</text>
      <text class="brand-slogan">规划 · 记录 · 分享</text>
    </view>

    <!-- 登录操作区 -->
    <view class="action-area">
      <!-- 错误提示 -->
      <view v-if="errorMsg" class="error-card">
        <view class="i-carbon-warning error-icon" />
        <text class="error-text">{{ errorMsg }}</text>
      </view>

      <view class="auth-panel">
        <!-- #ifdef MP-WEIXIN -->
        <view v-if="enableWechatLogin" class="wechat-login-section">
          <button
            class="wechat-btn"
            :class="{ 'wechat-btn--inactive': !agreedToLegal }"
            :disabled="wechatLoading"
            @click="handleWechatLogin"
          >
            <view v-if="wechatLoading" class="btn-loading">
              <view class="i-carbon-circle-dash animate-spin btn-spinner" />
            </view>
            <view v-else class="i-carbon-logo-wechat wechat-btn-icon" />
            <text>{{ wechatLoading ? '登录中...' : '微信一键登录' }}</text>
          </button>
        </view>
        <!-- #endif -->

        <view
          v-if="showPasswordLogin"
          class="password-section"
          :class="{ 'password-section--with-divider': enableWechatLogin }"
        >
          <view class="password-section-head">
            <text class="password-section-title">邮箱登录</text>
            <!-- #ifdef MP-WEIXIN -->
            <text class="password-section-action" @click="showPasswordLogin = false">收起</text>
            <!-- #endif -->
          </view>
          <view class="form-field">
            <view class="i-carbon-email form-field-icon" />
            <input
              v-model="loginForm.email"
              class="form-input"
              placeholder="请输入邮箱"
              type="text"
              autocomplete="email"
            />
          </view>
          <view class="form-field">
            <view class="i-carbon-password form-field-icon" />
            <input
              v-model="loginForm.password"
              class="form-input"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </view>

          <button
            class="login-btn"
            :class="{ 'login-btn--inactive': !agreedToLegal }"
            :disabled="passwordLoading"
            @click="handlePasswordLogin"
          >
            <view v-if="passwordLoading" class="btn-loading">
              <view class="i-carbon-circle-dash animate-spin btn-spinner" />
            </view>
            <text>{{ passwordLoading ? '登录中...' : '登录邮箱账号' }}</text>
          </button>

          <!-- 注册 / 忘记密码 -->
          <view class="login-links">
            <text class="login-link-text" @click="goToRegister">注册账号</text>
            <text class="login-link-text" @click="goToForgotPassword">忘记密码？</text>
          </view>
        </view>

        <!-- #ifdef MP-WEIXIN -->
        <button
          v-if="!showPasswordLogin"
          class="password-toggle-btn"
          @click="showPasswordLogin = true"
        >
          <view class="i-carbon-email password-toggle-icon" />
          <text>使用邮箱账号登录</text>
        </button>
        <!-- #endif -->

        <!-- 协议勾选 -->
        <view class="agreement" @click="toggleAgreement">
          <view
            class="agreement-check"
            :class="{
              'agreement-check--checked': agreedToLegal,
              'agreement-check--warning': agreementWarning && !agreedToLegal
            }"
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
      </view>

      <!-- 跳过登录 -->
      <view class="skip-login" @click="skipLogin">
        <text class="skip-login-text">暂不登录，先逛逛</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import { AuthService } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { navigateToLegalPage } from '@/utils/wechatPrivacy'

const LEGAL_AGREED_STORAGE_KEY = 'legal_agreed'

const errorMsg = ref('')
const wechatLoading = ref(false)
const agreedToLegal = ref(false)
const agreementWarning = ref(false)

/** 登录成功后跳转的目标页面（从 query 参数传入） */
const returnUrl = ref('')

let initialWechatLoginEnabled = false
let initialPasswordLoginVisible = true

// #ifdef MP-WEIXIN
initialWechatLoginEnabled = true
initialPasswordLoginVisible = false
// #endif

// 微信登录入口开关：当前仅小程序端开放
const enableWechatLogin = ref(initialWechatLoginEnabled)
const showPasswordLogin = ref(initialPasswordLoginVisible)

// 邮箱密码登录
const loginForm = ref({ email: '', password: '' })
const passwordLoading = ref(false)

const userStore = useUserStore()

useWechatShare()

onLoad((options?: { returnUrl?: string }) => {
  if (options?.returnUrl) {
    returnUrl.value = decodeURIComponent(options.returnUrl)
  }
})

/** 基本邮箱格式校验（允许测试账号 admin） */
const isValidEmail = (email: string): boolean => {
  if (email === 'admin') return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const syncAgreementFromStorage = () => {
  agreedToLegal.value = !!uni.getStorageSync(LEGAL_AGREED_STORAGE_KEY)
}

onShow(() => {
  syncAgreementFromStorage()
})

const toggleAgreement = () => {
  agreedToLegal.value = !agreedToLegal.value
  agreementWarning.value = false
  if (agreedToLegal.value) {
    uni.setStorageSync(LEGAL_AGREED_STORAGE_KEY, true)
  } else {
    uni.removeStorageSync(LEGAL_AGREED_STORAGE_KEY)
  }
}

const ensureAgreement = () => {
  if (agreedToLegal.value) return true
  agreementWarning.value = true
  uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
  return false
}

/** 保存登录态并跳转 */
const saveAuthAndNavigate = async (
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt: string
) => {
  uni.setStorageSync(LEGAL_AGREED_STORAGE_KEY, true)
  userStore.setToken(accessToken)
  userStore.setRefreshToken(refreshToken)
  userStore.setAccessTokenExpiresAt(accessTokenExpiresAt)

  // 拉取完整用户信息
  uni.showLoading({ title: '同步账号信息...', mask: true })
  await Promise.race([
    userStore.fetchUserInfo(),
    new Promise(resolve => setTimeout(resolve, 5000))
  ])
  uni.hideLoading()

  uni.showToast({ title: '登录成功', icon: 'success' })
  setTimeout(() => {
    // 如果有 returnUrl，则跳转到目标页面
    if (returnUrl.value) {
      uni.redirectTo({ url: returnUrl.value }).catch(() => {
        uni.navigateTo({ url: returnUrl.value }).catch(() => {
          uni.switchTab({ url: '/pages/index/index' })
        })
      })
      return
    }
    uni.switchTab({ url: '/pages/index/index' }).catch(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    })
  }, 600)
}

const handleWechatLogin = async () => {
  if (wechatLoading.value) return

  if (!ensureAgreement()) return

  wechatLoading.value = true
  errorMsg.value = ''

  try {
    // 1. 调用微信登录获取 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      })
    })

    if (!loginRes.code) {
      throw new Error('NO_CODE')
    }

    // 2. 调用后端接口
    uni.showLoading({ title: '登录中...', mask: true })
    const res = await AuthService.loginByWechatMini({ code: loginRes.code })
    uni.hideLoading()

    // 3. 校验关键字段
    if (!res.accessToken) {
      throw new Error('TOKEN_MISSING')
    }

    // 4. 保存登录态并跳转
    await saveAuthAndNavigate(res.accessToken, res.refreshToken, res.accessTokenExpiresAt)
  } catch (err: unknown) {
    uni.hideLoading()
    const e = err as { errMsg?: string; message?: string; name?: string }
    if (e?.errMsg && (/cancel$/i.test(e.errMsg) || e.errMsg.includes(':fail cancel'))) {
      errorMsg.value = '已取消登录'
    } else if (e?.message === 'NO_CODE') {
      errorMsg.value = '获取授权失败，请重试'
    } else if (e?.message === 'TOKEN_MISSING') {
      errorMsg.value = '登录状态异常，请重新登录'
    } else if (e?.name === 'HttpError') {
      errorMsg.value = e.message || '登录失败，请重试'
    } else {
      errorMsg.value = '登录失败，请重试'
    }
  } finally {
    wechatLoading.value = false
  }
}

const handlePasswordLogin = async () => {
  if (passwordLoading.value) return

  if (!ensureAgreement()) return

  const { email, password } = loginForm.value
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

  passwordLoading.value = true
  errorMsg.value = ''

  try {
    uni.showLoading({ title: '登录中...', mask: true })
    const res = await AuthService.loginWithPassword({ email: email.trim(), password })
    uni.hideLoading()

    if (!res.accessToken) {
      throw new Error('TOKEN_MISSING')
    }

    // 保存登录态并跳转
    await saveAuthAndNavigate(res.accessToken, res.refreshToken, res.accessTokenExpiresAt)
  } catch (err: unknown) {
    uni.hideLoading()
    const e = err as { message?: string; name?: string; code?: number }
    if (e?.message === 'TOKEN_MISSING') {
      errorMsg.value = '登录状态异常，请重新登录'
    } else if (e?.name === 'HttpError') {
      // 直接展示后端 message，不写死文案
      errorMsg.value = e.message || '登录失败，请重试'
    } else {
      errorMsg.value = '登录失败，请重试'
    }
  } finally {
    passwordLoading.value = false
  }
}

const onAgreementTap = (type: 'terms' | 'privacy') => {
  navigateToLegalPage(type)
}

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/login/register' })
}

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/login/forgot-password' })
}

const skipLogin = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 22px;
  box-sizing: border-box;
  position: relative;
  overflow-x: hidden;
}

/* ==================== 背景装饰圆 ==================== */

.bg-decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.bg-decor--top {
  width: 280px;
  height: 280px;
  top: -140px;
  right: -120px;
  background: rgba(59, 130, 246, 0.04);
}

.bg-decor--bottom {
  width: 200px;
  height: 200px;
  bottom: -60px;
  left: -60px;
  background: rgba(59, 130, 246, 0.03);
}

/* ==================== 品牌区 ==================== */

.brand-area {
  margin-top: 72px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.brand-name {
  font-size: 28px;
  font-weight: 600;
  color: #2f2a25;
  letter-spacing: 0.12em;
  line-height: 1;
}

.brand-slogan {
  margin-top: 4px;
  font-size: 15px;
  color: #7a746b;
  line-height: 1.5;
  letter-spacing: 0.02em;
}

/* ==================== 登录操作区 ==================== */

.action-area {
  width: 100%;
  max-width: 420px;
}

/* ---------- 错误提示 ---------- */

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
  padding: 18px;
  border-radius: 22px;
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

/* ---------- 微信登录 ---------- */

.wechat-login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wechat-btn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  background: #07C160;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  box-shadow: 0 10px 22px -12px rgba(7, 193, 96, 0.58);
}

.wechat-btn::after {
  border: none;
}

.wechat-btn[disabled] {
  opacity: 0.75;
}

.wechat-btn--inactive {
  opacity: 0.9;
}

.wechat-btn-icon {
  font-size: 21px;
}

/* ---------- 邮箱密码表单 ---------- */

.password-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.password-section--with-divider {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EDE8E2;
}

.password-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 2px;
}

.password-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #5C5650;
}

.password-section-action {
  font-size: 12px;
  color: #9B958C;
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

.login-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  background: #3B82F6;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 20px -10px rgba(59, 130, 246, 0.58);
}

.login-btn::after {
  border: none;
}

.login-btn[disabled] {
  opacity: 0.75;
}

.login-btn--inactive {
  opacity: 0.72;
}

.btn-loading {
  display: flex;
  align-items: center;
}

.btn-spinner {
  font-size: 20px;
}

/* ---------- 注册 / 忘记密码链接 ---------- */

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 4px;
}

.login-link-text {
  font-size: 13px;
  color: #3B82F6;
}

.login-link-text:active {
  opacity: 0.7;
}

.password-toggle-btn {
  width: 100%;
  height: 48px;
  margin-top: 14px;
  border-radius: 16px;
  background: #FFFFFF;
  color: #2F2A25;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #E8E4DE;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.password-toggle-btn::after {
  border: none;
}

.password-toggle-icon {
  font-size: 17px;
  color: #9B958C;
}

/* ---------- 跳过登录 ---------- */

.skip-login {
  margin-top: 20px;
  padding: 8px 0;
  display: flex;
  justify-content: center;
}

.skip-login:active {
  opacity: 0.7;
}

.skip-login-text {
  font-size: 14px;
  color: #7A746B;
}

/* ---------- 协议区 ---------- */

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
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
  background: #3B82F6;
  border-color: #3B82F6;
}

.agreement-check--warning {
  background: #FEF2F2;
  border-color: #EF4444;
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
  color: #3B82F6;
}
</style>
