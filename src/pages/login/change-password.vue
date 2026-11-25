<template>
  <view class="change-pwd-page">
    <!-- Header -->
    <view class="px-5 pb-4" :style="{ paddingTop: `${insetTop}px` }">
      <view class="flex items-center gap-3">
        <view
          class="w-9 h-9 rounded-xl bg-white flex-center shadow-sm active:scale-95 transition-transform"
          @click="handleBack"
        >
          <view class="i-carbon-chevron-left text-xl text-primary" />
        </view>
        <view>
          <text class="text-[20px] font-semibold text-primary block tracking-tight">修改密码</text>
        </view>
      </view>
    </view>

    <view class="px-5 pb-10">
      <!-- 错误提示 -->
      <view v-if="errorMsg" class="error-card mb-4">
        <view class="i-carbon-warning error-icon" />
        <text class="error-text">{{ errorMsg }}</text>
      </view>

      <!-- 表单 -->
      <view class="form-area">
        <view class="form-group">
          <text class="form-label">当前密码</text>
          <input
            v-model="form.oldPassword"
            class="form-input"
            type="password"
            placeholder="请输入当前密码"
            autocomplete="current-password"
          />
        </view>

        <view class="form-group">
          <text class="form-label">新密码</text>
          <input
            v-model="form.newPassword"
            class="form-input"
            type="password"
            placeholder="8-30位，需包含字母和数字"
            autocomplete="new-password"
          />
        </view>

        <view class="form-group">
          <text class="form-label">确认新密码</text>
          <input
            v-model="form.confirmPassword"
            class="form-input"
            type="password"
            placeholder="请再次输入新密码"
            autocomplete="new-password"
          />
        </view>
      </view>

      <!-- 提示 -->
      <view class="hint-card mb-6">
        <view class="i-carbon-information hint-icon" />
        <text class="hint-text">修改密码后，所有设备需重新登录</text>
      </view>

      <!-- 提交按钮 -->
      <button
        class="submit-btn"
        :disabled="loading"
        @click="handleChangePassword"
      >
        <view v-if="loading" class="btn-loading">
          <view class="i-carbon-circle-dash animate-spin btn-spinner" />
        </view>
        <text>{{ loading ? '修改中...' : '确认修改' }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePageTopInset } from '@/composables/usePageTopInset'
import { AuthService } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import { guardProtectedPage } from '@/utils/guestAuth'

const { insetTop } = usePageTopInset()
const userStore = useUserStore()

const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const loading = ref(false)
const errorMsg = ref('')

/** 密码格式校验：8-30位，包含字母和数字 */
const isValidPassword = (pwd: string): boolean => {
  if (pwd.length < 8 || pwd.length > 30) return false
  return /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)
}

onShow(() => {
  guardProtectedPage()
})

const handleChangePassword = async () => {
  if (loading.value) return

  const { oldPassword, newPassword, confirmPassword } = form.value

  // 校验
  if (!oldPassword) {
    uni.showToast({ title: '请输入当前密码', icon: 'none' })
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
  if (newPassword === oldPassword) {
    uni.showToast({ title: '新密码不能与当前密码相同', icon: 'none' })
    return
  }
  if (newPassword !== confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await AuthService.changePassword({ oldPassword, newPassword })

    // 后端会撤销所有 RefreshToken，清除本地登录态
    userStore.clearAuthState()

    uni.showModal({
      title: '密码已修改',
      content: '请使用新密码重新登录',
      showCancel: false,
      confirmText: '去登录',
      success: () => {
        uni.reLaunch({ url: '/pages/login/index' })
      }
    })
  } catch (err: unknown) {
    const e = err as { message?: string; name?: string }
    if (e?.name === 'HttpError') {
      errorMsg.value = e.message || '修改失败，请重试'
    } else {
      errorMsg.value = '修改失败，请重试'
    }
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.change-pwd-page {
  min-height: 100vh;
  background-color: #FFFFFF;
}

.error-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
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
  margin-bottom: 20px;
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
</style>
