<template>
  <TracciLayout :show-navbar="false" :show-tab-bar="false">
    <!-- Loading State -->
    <TracciLoading v-if="loading" text="加载中..." />

    <!-- Error State -->
    <TracciError
      v-else-if="error"
      title="加载失败"
      message="无法获取账号安全信息，请检查网络后重试"
      :show-retry="true"
      retry-text="重新加载"
      @retry="fetchSecurityInfo"
    />

    <!-- Content -->
    <template v-else-if="securityInfo">
      <!-- Page Header (使用与其他有返回按钮页面一致的 inset 计算) -->
      <view class="px-5 pb-4" :style="{ paddingTop: `${insetTop}px` }">
        <view class="flex items-center gap-3">
          <view
            class="w-9 h-9 rounded-xl bg-white flex-center shadow-sm active:scale-95 transition-transform"
            @click="handleBack"
          >
            <view class="i-carbon-chevron-left text-xl text-primary" />
          </view>
          <view>
            <text class="text-[26px] font-semibold text-primary tracking-tight block leading-tight">账号安全</text>
            <text class="text-[13px] text-muted mt-0.5 block">管理你的登录方式和账号保护</text>
          </view>
        </view>
      </view>

      <view class="px-5 pb-10">

        <!-- 登录与绑定方式 -->
        <view class="card-base mb-4 overflow-hidden">
          <text class="px-5 pt-4 pb-2 text-[12px] font-medium text-muted tracking-[0.02em] uppercase">登录与绑定方式</text>

          <!-- 邮箱 -->
          <view
            class="flex items-center gap-3.5 px-5 py-3.5"
            :class="{ 'active:bg-warm-surface transition-colors': !securityInfo.email }"
            @click="onEmailTap"
          >
            <view class="w-10 h-10 rounded-xl bg-subtle flex-center shrink-0">
              <view class="i-carbon-email text-secondary text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <view class="flex items-center gap-2 mb-0.5">
                <text class="text-[15px] font-medium text-primary">邮箱</text>
              </view>
              <text class="text-xs text-muted block">
                {{ securityInfo.email ? maskedEmail : '未使用邮箱登录' }}
              </text>
            </view>
            <text
              class="text-[13px] font-medium shrink-0"
              :class="securityInfo.email ? 'text-muted' : 'text-brand active:opacity-70'"
            >
              {{ securityInfo.email ? '已绑定' : '绑定' }}
            </text>
          </view>

          <!-- 手机号 -->
          <view class="flex items-center gap-3.5 px-5 py-3.5 active:bg-warm-surface transition-colors border-t border-warm-divider/60" @click="onPhoneTap">
            <view class="w-10 h-10 rounded-xl bg-subtle flex-center shrink-0">
              <view class="i-carbon-phone text-secondary text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <view class="flex items-center gap-2 mb-0.5">
                <text class="text-[15px] font-medium text-primary">手机号</text>
                <StatusBadge v-if="securityInfo.phoneVerified" variant="success">
                  已验证
                </StatusBadge>
                <StatusBadge v-else-if="securityInfo.phone" variant="warning" :dot="false">
                  未验证
                </StatusBadge>
              </view>
              <text class="text-xs text-muted block">
                {{ securityInfo.phone ? maskedPhone : '暂未绑定' }}
              </text>
            </view>
            <text
              class="text-[13px] text-brand font-medium shrink-0 active:opacity-70"
              @click.stop="showPhoneSheet = true"
            >
              {{ securityInfo.phone ? '解绑' : '绑定' }}
            </text>
          </view>

          <!-- 微信 -->
          <view class="flex items-center gap-3.5 px-5 py-3.5 border-t border-warm-divider/60">
            <view class="w-10 h-10 rounded-xl bg-subtle flex-center shrink-0">
              <view class="i-carbon-logo-wechat text-secondary text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <view class="flex items-center gap-2 mb-0.5">
                <text class="text-[15px] font-medium text-primary">微信</text>
                <StatusBadge v-if="!securityInfo.bindings?.wechat" variant="warning" :dot="false">
                  即将支持
                </StatusBadge>
              </view>
              <text class="text-xs text-muted block">
                {{ securityInfo.bindings?.wechat ? '已绑定' : '绑定后可用微信登录' }}
              </text>
            </view>
          </view>
        </view>

        <!-- 其他设置 -->
        <view class="card-base mb-4 overflow-hidden">
          <text class="px-5 pt-4 pb-2 text-[12px] font-medium text-muted tracking-[0.02em] uppercase">其他设置</text>

          <!-- 修改密码 -->
          <view
            class="flex items-center gap-3.5 px-5 py-3.5 active:bg-warm-surface transition-colors border-t border-warm-divider/60"
            @click="goToChangePassword"
          >
            <view class="w-10 h-10 rounded-xl bg-subtle flex-center shrink-0">
              <view class="i-carbon-password text-secondary text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <text class="text-[15px] font-medium text-primary block">修改密码</text>
              <text class="text-xs text-muted">使用旧密码修改</text>
            </view>
            <view class="text-muted text-sm shrink-0">
              <view class="i-carbon-chevron-right" />
            </view>
          </view>
        </view>

        <!-- 危险操作 -->
        <view class="card-base overflow-hidden bg-[#FEF2F2]">
          <view
            class="flex items-center gap-3.5 px-5 py-3.5 active:bg-[#FEE2E2] transition-colors"
            @click="showDeleteSheet = true"
          >
            <view class="w-10 h-10 rounded-xl bg-[#FEE2E2] flex-center shrink-0">
              <view class="i-carbon-trash-can text-danger text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <text class="text-[15px] font-medium text-danger block">注销账号</text>
              <text class="text-xs text-[#F87171]">注销后无法继续使用当前账号</text>
            </view>
            <view class="text-[#FCA5A5] text-sm shrink-0">
              <view class="i-carbon-chevron-right" />
            </view>
          </view>
        </view>
      </view>  <!-- end px-5 pb-10 content -->
    </template>

    <DeleteAccountSheet v-model="showDeleteSheet" />
    <EmailBindSheet
      v-model="showEmailSheet"
      :security-info="securityInfo"
      @success="handleBindSuccess"
    />
    <PhoneBindSheet
      v-model="showPhoneSheet"
      :security-info="securityInfo"
      @success="handleBindSuccess"
    />
  </TracciLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TracciLayout from '@/components/layout/TracciLayout.vue'
import TracciLoading from '@/components/common/TracciLoading.vue'
import TracciError from '@/components/common/TracciError.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DeleteAccountSheet from '@/components/account/DeleteAccountSheet.vue'
import EmailBindSheet from '@/components/account/EmailBindSheet.vue'
import PhoneBindSheet from '@/components/account/PhoneBindSheet.vue'
import { usePageTopInset } from '@/composables/usePageTopInset'
import { UserService } from '@/services/user'
import { guardProtectedPage } from '@/utils/guestAuth'
import type { SecurityInfo } from '@/types/user'

const showDeleteSheet = ref(false)
const showEmailSheet = ref(false)
const showPhoneSheet = ref(false)
const securityInfo = ref<SecurityInfo | null>(null)
const loading = ref(false)
const error = ref(false)

const { insetTop } = usePageTopInset()

// ── 脱敏 ──

const maskedPhone = computed(() => {
  const phone = securityInfo.value?.phone
  if (!phone || phone.length < 7) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
})

const maskedEmail = computed(() => {
  const email = securityInfo.value?.email
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain || local.length <= 2) return email
  return local.slice(0, 2) + '****@' + domain
})

// ── 导航 ──

function onPhoneTap() {
  if (!securityInfo.value?.phone) {
    showPhoneSheet.value = true
  }
}

function onEmailTap() {
  if (!securityInfo.value?.email) {
    showEmailSheet.value = true
  }
}

/*
 * FUTURE（待产品确认）：已有邮箱的换绑入口。
 * 确认换绑产品与 API 契约后，再增加独立 Sheet。
 */

function goToChangePassword() {
  uni.navigateTo({ url: '/pages/login/change-password' })
}

function handleBack() {
  uni.navigateBack()
}

// ── 数据获取 ──

async function fetchSecurityInfo() {
  error.value = false
  loading.value = true
  try {
    securityInfo.value = await UserService.getSecurityInfo()
  } catch (err) {
    console.error('Fetch security info failed:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onShow(async () => {
  if (!guardProtectedPage()) return
  await Promise.all([fetchSecurityInfo(), userStore.fetchUserInfo()])
})

const handleBindSuccess = async () => {
  try {
    securityInfo.value = await UserService.getSecurityInfo()
  } catch (err) {
    console.error('Refresh security info failed:', err)
  }
}
</script>

<style scoped>
/* 仅保留少量必要样式，其余使用 UnoCSS + card-base 等系统组件 */
</style>
