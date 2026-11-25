<template>
  <TracciLayout :show-navbar="false" :show-tab-bar="true" current-tab="profile" @tab-change="onTabChange">
    <TabPageHeader title="我的" description="行程、记录与设置" />

    <view class="profile-container pb-24 px-5 min-h-full">
      <!-- ==================== 已登录态 ==================== -->
      <template v-if="isLoggedIn">
        <!-- 用户卡片 -->
        <view class="profile-identity p-5 mb-6">
          <view class="relative flex items-start gap-4">
            <!-- 头像 -->
            <view
              class="relative shrink-0 active:opacity-80"
              @click="handleChangeAvatar"
            >
              <TracciImage
                v-if="avatarDisplayUrl"
                :image="avatarDisplayUrl"
                mode="aspectFill"
                class="w-20 h-20"
                custom-class="w-20 h-20 rounded-[24px] overflow-hidden"
                style="display: block; width: 80px; height: 80px"
              />
              <view
                v-else
                class="w-20 h-20 rounded-[24px] bg-warm-surface flex items-center justify-center"
              >
                <view class="i-carbon-user-avatar text-3xl text-disabled" />
              </view>
              <view
                v-if="isUploadingAvatar"
                class="absolute inset-0 rounded-[24px] bg-black/40 flex items-center justify-center"
              >
                <view class="i-carbon-renew animate-spin text-white text-xl" />
              </view>
              <view
                class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand flex items-center justify-center shadow-sm"
              >
                <view class="i-carbon-camera text-white text-xs" />
              </view>
            </view>
            <!-- 用户信息 -->
            <view class="flex-1 min-w-0 pt-1">
              <!-- 昵称行 -->
              <view class="flex items-center gap-1.5 mb-1">
                <text class="text-lg font-semibold text-primary truncate">
                  {{ userInfo?.nickname || '旅人' }}
                </text>
                <view
                  class="w-6 h-6 rounded-lg bg-warm-surface flex items-center justify-center shrink-0 active:opacity-70"
                  @click="handleEditNickname"
                >
                  <view class="i-carbon-edit text-xs text-muted" />
                </view>
              </view>
              <!-- 邮箱 -->
              <view class="flex items-center gap-1.5 mb-3">
                <view class="i-carbon-email text-xs text-muted" />
                <text class="text-[13px] text-secondary">
                  {{ userInfo?.email || '未使用邮箱登录' }}
                </text>
              </view>
              <!-- 状态标签 -->
              <view class="flex items-center gap-2">
                <view class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-surface">
                  <view class="w-1.5 h-1.5 rounded-full bg-brand" />
                  <text class="text-[11px] text-primary font-medium">趣溪用户</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 旅行概览（轻量统计） -->
        <view v-if="statsLoading" class="profile-stats p-4 mb-5">
          <view class="h-3.5 w-16 skeleton-block rounded mb-4" />
          <view class="grid grid-cols-3 gap-3">
            <view v-for="i in 3" :key="i" class="rounded-xl p-3 bg-warm-surface/80">
              <view class="h-2.5 w-10 skeleton-block rounded mb-2" />
              <view class="h-4 w-6 skeleton-block rounded" />
            </view>
          </view>
        </view>
        <view v-else-if="profileStats" class="profile-stats p-4 mb-5">
          <text class="text-[13px] font-medium text-primary block mb-4">旅行概览</text>
          <view class="grid grid-cols-3 gap-3">
            <view class="rounded-xl p-3 bg-warm-surface/80">
              <text class="text-[10px] text-muted block mb-1">旅行次数</text>
              <text class="text-sm font-semibold text-primary">
                {{ profileStats.tripCount || 0 }}
                <text class="text-[10px] font-normal text-secondary">次</text>
              </text>
            </view>
            <view class="rounded-xl p-3 bg-warm-surface/80">
              <text class="text-[10px] text-muted block mb-1">累计天数</text>
              <text class="text-sm font-semibold text-primary">
                {{ profileStats.totalTravelDays || 0 }}
                <text class="text-[10px] font-normal text-secondary">天</text>
              </text>
            </view>
            <view class="rounded-xl p-3 bg-warm-surface/80">
              <text class="text-[10px] text-muted block mb-1">目的地</text>
              <text class="text-sm font-semibold text-primary">
                {{ profileStats.destinationCount || 0 }}
                <text class="text-[10px] font-normal text-secondary">个</text>
              </text>
            </view>
          </view>
        </view>

        <!-- App 完整体验提示 -->
        <view class="profile-note p-4 mb-6">
          <view class="flex items-center gap-2 mb-2">
            <view class="w-7 h-7 rounded-lg bg-warm-surface flex items-center justify-center">
              <view class="i-carbon-mobile text-muted text-sm" />
            </view>
            <text class="text-[13px] font-medium text-secondary">App 完整体验</text>
          </view>
          <text class="text-[11px] text-muted leading-relaxed block">
            完整回顾与协作请在 App 体验；小程序专注轻量记录与行程分享。
          </text>
        </view>

        <!-- 账号设置 -->
        <view class="profile-list mb-4 overflow-hidden">
          <view
            v-for="(item, index) in accountSettingsItems"
            :key="item.key"
          >
            <view
              class="flex items-center justify-between px-1 py-4 active:bg-warm-surface transition-colors"
              @click="handleSettingsTap(item.key)"
            >
              <view class="flex items-center gap-3 flex-1 min-w-0">
                <view class="w-9 h-9 rounded-xl bg-warm-surface flex items-center justify-center shrink-0">
                  <view :class="[item.icon, 'text-muted text-base']" />
                </view>
                <view class="flex-1 min-w-0">
                  <text class="text-sm font-medium text-primary block">{{ item.title }}</text>
                  <text class="text-xs text-muted block truncate">{{ item.subtitle }}</text>
                </view>
              </view>
              <view class="i-carbon-chevron-right text-disabled text-sm ml-2 shrink-0" />
            </view>
            <view
              v-if="index < accountSettingsItems.length - 1"
              class="ml-12 border-t border-warm-divider/70"
            />
          </view>
        </view>

        <!-- 关于与法律 -->
        <view class="profile-list mb-5 overflow-hidden">
          <view
            v-for="(item, index) in aboutSettingsItems"
            :key="item.key"
          >
            <view
              class="flex items-center justify-between px-1 py-4 active:bg-warm-surface transition-colors"
              @click="handleSettingsTap(item.key)"
            >
              <view class="flex items-center gap-3 flex-1 min-w-0">
                <view class="w-9 h-9 rounded-xl bg-warm-surface flex items-center justify-center shrink-0">
                  <view :class="[item.icon, 'text-muted text-base']" />
                </view>
                <view class="flex-1 min-w-0">
                  <text class="text-sm font-medium text-primary block">{{ item.title }}</text>
                  <text class="text-xs text-muted block truncate">{{ item.subtitle }}</text>
                </view>
              </view>
              <view class="i-carbon-chevron-right text-disabled text-sm ml-2 shrink-0" />
            </view>
            <view
              v-if="index < aboutSettingsItems.length - 1"
              class="ml-12 border-t border-warm-divider/70"
            />
          </view>
        </view>

        <!-- 退出登录 -->
        <view
          class="profile-logout p-4 mb-5 active:opacity-80"
          @click="handleLogout"
        >
          <view class="flex items-center justify-center gap-2 text-red-500">
            <view class="i-carbon-logout text-base" />
            <text class="text-sm font-medium">退出登录</text>
          </view>
        </view>
      </template>

      <!-- ==================== 未登录态 ==================== -->
      <template v-else>
        <view class="profile-identity p-6 mb-5">
          <view class="relative flex flex-col items-center text-center">
            <view class="w-16 h-16 rounded-[24px] bg-subtle flex items-center justify-center mb-4">
              <view class="i-carbon-map text-3xl text-disabled" />
            </view>
            <text class="text-base font-semibold text-primary mb-2">登录后开始记录旅程</text>
            <text class="text-[13px] text-secondary mb-5 leading-relaxed">
              记录行程、开支与旅途日志
            </text>
            <view
              class="inline-flex items-center px-8 py-2.5 rounded-full bg-brand text-white active:opacity-80"
              @click="goToLogin"
            >
              <text class="text-sm font-medium">去登录</text>
            </view>
          </view>
        </view>
      </template>

      <!-- ==================== 底部品牌信息 ==================== -->
      <view class="flex flex-col items-center py-8">
        <text class="text-base font-semibold text-primary tracking-wider mb-1.5">趣溪</text>
        <text class="text-[11px] text-warm-muted">v{{ appVersion }}</text>
      </view>
    </view>
    <WechatPrivacyPopup />
  </TracciLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import TracciLayout from '@/components/layout/TracciLayout.vue'
import TabPageHeader from '@/components/layout/TabPageHeader.vue'
import TracciImage from '@/components/common/TracciImage.vue'
import WechatPrivacyPopup from '@/components/privacy/WechatPrivacyPopup.vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { useUserStore } from '@/stores/user'
import { UserService } from '@/services/user'
import { APP_VERSION } from '@/constants/feedback'
import { StatsService } from '@/services/stats'
import { getLocalUploadDisplayUrl } from '@/utils/image'
import { navigateToLegalPage } from '@/utils/wechatPrivacy'
import type { StatsOverview } from '@/types/stats'

const userStore = useUserStore()
const appVersion = APP_VERSION

useWechatShare()

const isLoggedIn = computed(() => userStore.isLogin())
const userInfo = computed(() => userStore.userInfo)

// ==================== Tab 切换 ====================

const onTabChange = (key: string) => {
  if (key === 'home') {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

// ==================== 轻量旅行概览 ====================

const statsLoading = ref(false)
const profileStats = ref<StatsOverview | null>(null)

const fetchProfileStats = async () => {
  if (!userStore.isLogin()) {
    profileStats.value = null
    return
  }
  statsLoading.value = true
  try {
    const res = await StatsService.getStatsOverview()
    profileStats.value = res.overview
  } catch (error) {
    console.error('Fetch profile stats failed:', error)
    profileStats.value = null
  } finally {
    statsLoading.value = false
  }
}

// ==================== 设置列表定义 ====================

interface SettingsItem {
  key: string
  title: string
  subtitle: string
  icon: string
}

const accountSettingsItems: SettingsItem[] = [
  {
    key: 'edit-profile',
    title: '编辑资料',
    subtitle: '修改头像、昵称等信息',
    icon: 'i-carbon-edit'
  },
  {
    key: 'security',
    title: '账号安全',
    subtitle: '登录方式、密码与账号安全',
    icon: 'i-carbon-security'
  }
]

const aboutSettingsItems: SettingsItem[] = [
  {
    key: 'help',
    title: '帮助与反馈',
    subtitle: '常见问题与意见反馈',
    icon: 'i-carbon-help'
  },
  {
    key: 'about',
    title: '关于趣溪',
    subtitle: `版本 v${APP_VERSION}`,
    icon: 'i-carbon-information'
  },
  {
    key: 'user-agreement',
    title: '用户协议',
    subtitle: '服务条款与使用规范',
    icon: 'i-carbon-document'
  },
  {
    key: 'privacy-policy',
    title: '隐私政策',
    subtitle: '个人信息处理规则',
    icon: 'i-carbon-locked'
  }
]

// ==================== 设置项点击 ====================

const handleSettingsTap = (key: string) => {
  if (key === 'edit-profile') {
    handleEditProfile()
  } else if (key === 'security') {
    uni.navigateTo({ url: '/pages/profile/account-security' })
  } else if (key === 'help') {
    uni.navigateTo({ url: '/pages/help-feedback/index' })
  } else if (key === 'about') {
    uni.showModal({
      title: '关于趣溪',
      content:
        `趣溪 v${APP_VERSION}\n\n小程序用于轻量记录旅行、查看行程和分享旅程；完整回顾、深度统计与多人协作请在 App 中体验。`,
      showCancel: false,
      confirmText: '好的'
    })
  } else if (key === 'user-agreement') {
    navigateToLegalPage('terms')
  } else if (key === 'privacy-policy') {
    navigateToLegalPage('privacy')
  }
}

// ==================== 头像上传 ====================

const { uploadFiles, chooseImages, resetUploads } = useImageUpload()

const isUploadingAvatar = computed(() => {
  if (uploadFiles.value.length > 0) {
    const file = uploadFiles.value[0]
    return file.status === 'uploading' || file.status === 'waiting'
  }
  return false
})

const avatarDisplayUrl = computed(() => {
  if (uploadFiles.value.length > 0) {
    const local = getLocalUploadDisplayUrl(uploadFiles.value[0])
    if (local) return local
  }
  return userInfo.value?.avatarUrl || ''
})

const handleChangeAvatar = () => {
  if (isUploadingAvatar.value) return
  resetUploads()
  chooseImages(1, 'AVATAR')
}

watch(
  () => uploadFiles.value,
  async files => {
    if (files.length === 0) return
    const file = files[0]
    if (file.status === 'uploaded' && file.fileId) {
      try {
        uni.showLoading({ title: '保存中...' })
        await UserService.updateCurrentUser({ avatarFileId: file.fileId })
        await userStore.fetchUserInfo()
        uni.hideLoading()
        uni.showToast({ title: '头像已更新', icon: 'success' })
      } catch (err) {
        console.error('Update avatar failed:', err)
        uni.hideLoading()
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      } finally {
        resetUploads()
      }
    } else if (file.status === 'uploaded' && !file.fileId) {
      uni.showToast({ title: '头像文件 ID 获取失败', icon: 'none' })
      resetUploads()
    } else if (file.status === 'failed') {
      uni.showToast({ title: file.error || '头像上传失败', icon: 'none' })
      resetUploads()
    }
  },
  { deep: true }
)

// ==================== 资料编辑 ====================

const hasAvatar = computed(() => !!(userInfo.value?.avatarUrl || userInfo.value?.avatarFileId))

const handleClearAvatar = () => {
  uni.showModal({
    title: '清空头像',
    content: '确定要移除当前头像吗？',
    success: async res => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '保存中...' })
        await UserService.updateCurrentUser({ avatarFileId: '' })
        await userStore.fetchUserInfo()
        uni.hideLoading()
        uni.showToast({ title: '头像已清空', icon: 'success' })
      } catch (err) {
        console.error('Clear avatar failed:', err)
        uni.hideLoading()
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      }
    }
  })
}

const handleEditProfile = () => {
  const itemList = hasAvatar.value
    ? ['修改头像', '修改昵称', '清空头像']
    : ['修改头像', '修改昵称']

  uni.showActionSheet({
    itemList,
    success: res => {
      if (res.tapIndex === 0) {
        handleChangeAvatar()
      } else if (res.tapIndex === 1) {
        handleEditNickname()
      } else if (hasAvatar.value && res.tapIndex === 2) {
        handleClearAvatar()
      }
    }
  })
}

const handleEditNickname = () => {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: userInfo.value?.nickname || '',
    success: async (res) => {
      if (res.confirm && res.content !== undefined && res.content.trim()) {
        const newNickname = res.content.trim()
        try {
          await UserService.updateCurrentUser({ nickname: newNickname })
          await userStore.fetchUserInfo()
          uni.showToast({ title: '昵称已更新', icon: 'success' })
        } catch (err) {
          console.error('Update nickname failed:', err)
          uni.showToast({ title: '保存失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

// ==================== 退出登录 ====================

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '退出中...' })
        await userStore.logout()
        uni.hideLoading()
        uni.showToast({ title: '已退出登录', icon: 'none' })
      }
    }
  })
}

// ==================== 导航 ====================

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' })
}

// ==================== 生命周期 ====================

onShow(async () => {
  if (userStore.isLogin()) {
    await userStore.fetchUserInfo()
    await fetchProfileStats()
  } else {
    profileStats.value = null
  }
})
</script>

<style scoped>
.profile-identity {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(251, 250, 246, 0.98), rgba(255, 255, 255, 1)),
    linear-gradient(180deg, rgba(79, 125, 255, 0.05), rgba(245, 230, 211, 0.08));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.profile-stats {
  border-radius: 24px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.55);
}

.profile-note {
  border-radius: 22px;
  background: rgba(251, 250, 246, 0.72);
}

.profile-list {
  background: #fff;
  box-shadow: inset 0 -1px 0 rgba(237, 232, 226, 0.72);
}

.profile-logout {
  border-radius: 18px;
  background: rgba(254, 242, 242, 0.72);
}

.skeleton-block {
  background: linear-gradient(
    90deg,
    #f5f2ee 25%,
    #ede8e2 50%,
    #f5f2ee 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
