<template>
  <view class="fixed bottom-0 left-0 right-0 z-50">
    <!-- 底部导航栏：磨砂玻璃质感 + 安全区适配 -->
    <view class="tabbar-glass pb-safe box-border">
      <view class="flex items-center justify-around px-6 relative">
        <!-- 左侧标签：图标 + 文字，提升可发现性 -->
        <view
          v-for="item in leftTabs"
          :key="item.key"
          class="tab-item flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors duration-200 active:scale-95"
          :class="current === item.key ? 'text-brand' : 'text-muted-strong'"
          :aria-label="item.ariaLabel"
          :aria-current="current === item.key ? 'page' : undefined"
          role="button"
          @click="switchTab(item.key)"
        >
          <view
            class="flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200"
            :class="current === item.key ? 'bg-brand/8' : 'active:bg-warm-border/20'"
          >
            <view
              class="text-[20px]"
              :class="current === item.key ? item.activeIcon : item.icon"
            />
          </view>
          <text
            class="tab-item__label"
            :class="current === item.key ? 'tab-item__label--active' : ''"
          >
            {{ item.label }}
          </text>
        </view>

        <!-- 中央 FAB：创建旅程 -->
        <view class="relative -top-3">
          <view
            class="fab-btn w-14 h-14 rounded-full bg-brand flex items-center justify-center text-white active:scale-95 transition-transform duration-200"
            aria-label="创建或加入旅程"
            role="button"
            @click="createNewTrip"
          >
            <view class="i-carbon-add text-[22px]" />
          </view>
        </view>

        <!-- 右侧标签 -->
        <view
          v-for="item in rightTabs"
          :key="item.key"
          class="tab-item flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors duration-200 active:scale-95"
          :class="current === item.key ? 'text-brand' : 'text-muted-strong'"
          :aria-label="item.ariaLabel"
          :aria-current="current === item.key ? 'page' : undefined"
          role="button"
          @click="switchTab(item.key)"
        >
          <view
            class="flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200"
            :class="current === item.key ? 'bg-brand/8' : 'active:bg-warm-border/20'"
          >
            <view
              class="text-[20px]"
              :class="current === item.key ? item.activeIcon : item.icon"
            />
          </view>
          <text
            class="tab-item__label"
            :class="current === item.key ? 'tab-item__label--active' : ''"
          >
            {{ item.label }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { requireLogin } from '@/utils/guestAuth'

const props = withDefaults(
  defineProps<{
    current?: string
  }>(),
  {
    current: 'home'
  }
)

const emit = defineEmits<{
  (e: 'change', key: string): void
}>()

const leftTabs = [
  {
    key: 'home',
    label: '首页',
    ariaLabel: '首页',
    icon: 'i-carbon-home',
    activeIcon: 'i-carbon-home'
  }
]

const rightTabs = [
  {
    key: 'profile',
    label: '我的',
    ariaLabel: '我的',
    icon: 'i-carbon-user',
    activeIcon: 'i-carbon-user'
  }
]

const switchTab = (key: string) => {
  if (props.current !== key) {
    emit('change', key)
  }
}

const createNewTrip = async () => {
  const ok = await requireLogin({
    title: '登录后继续',
    content: '加入或创建旅程需要登录，数据将安全保存在你的账号下。'
  })
  if (!ok) return

  uni.showActionSheet({
    itemList: ['通过邀请码加入', '创建新旅程'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: '/pages/co-editor/index' })
      } else if (res.tapIndex === 1) {
        uni.navigateTo({ url: '/pages/trip/create' })
      }
    }
  })
}
</script>

<style scoped>
/* 磨砂玻璃底栏：柔和阴影 + 微妙顶部描边 */
.tabbar-glass {
  background: rgba(255, 255, 255, 0.92);
  border-top: 0.5px solid rgba(139, 115, 85, 0.08);
  box-shadow: 0 -2px 20px -4px rgba(139, 115, 85, 0.06);
  padding-top: 6px;
}

.tab-item__label {
  font-size: 10px;
  line-height: 1.2;
  margin-top: 1px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #6e655c;
}

.tab-item__label--active {
  color: #4f7dff;
  font-weight: 600;
}

/* FAB：内敛高光 + 柔和阴影，替代过重的蓝色光晕 */
.fab-btn {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 4px 16px -2px rgba(79, 125, 255, 0.3);
}
</style>
