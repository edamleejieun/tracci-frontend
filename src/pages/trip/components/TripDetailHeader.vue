<template>
  <view class="relative overflow-hidden" style="height: 640rpx">
    <!-- 封面背景 -->
    <view class="absolute inset-0 bg-subtle pointer-events-none">
      <TracciImage
        v-if="coverPhoto"
        :image="coverPhoto"
        mode="aspectFill"
        class="w-full h-full"
        custom-class="w-full h-full"
        style="display: block; width: 100%; height: 100%"
      />
      <view
        v-else
        class="w-full h-full bg-gradient-to-br from-[#D4CFC8] to-[#B8B0A8]"
      />
    </view>

    <!-- 渐变遮罩 -->
    <view
      class="absolute inset-0 pointer-events-none"
      style="background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.08) 100%)"
    />

    <!-- 顶部导航 -->
    <view
      class="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pb-3 z-30"
      :style="{ paddingTop: navPaddingTop }"
    >
      <view
        class="header-action-btn w-10 h-10 rounded-full bg-white/20 flex-center active:scale-95 transition-transform"
        @click.stop="emit('back')"
      >
        <view class="i-carbon-chevron-left text-xl text-white" />
      </view>
      <view class="flex items-center gap-2">
        <view
          v-if="showActions"
          class="header-action-btn w-10 h-10 rounded-full bg-white/20 flex-center active:scale-95 transition-transform relative"
          @click.stop="emit('members')"
        >
          <view class="i-carbon-user-multiple text-lg text-white" />
          <view
            v-if="memberCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-semibold flex-center px-1 gap-0.5"
          >
            <view
              v-if="memberCount > 1"
              class="w-1 h-1 rounded-full bg-success"
            />
            {{ memberCount > 99 ? '99+' : memberCount }}
          </view>
        </view>
        <view
          v-if="showActions && canShare"
          class="header-action-btn w-10 h-10 rounded-full bg-white/20 flex-center active:scale-95 transition-transform"
          @click.stop="emit('share')"
        >
          <view class="i-carbon-share text-lg text-white" />
        </view>
        <view
          v-if="showActions && canEdit"
          class="header-action-btn w-10 h-10 rounded-full bg-white/20 flex-center active:scale-95 transition-transform"
          @click.stop="emit('settings')"
        >
          <view class="i-carbon-settings text-lg text-white" />
        </view>
      </view>
    </view>

    <!-- 底部信息（预留与概览卡间距，避免被遮挡） -->
    <view class="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6 z-10">
      <template v-if="loading">
        <view class="space-y-3 animate-pulse">
          <view class="h-6 bg-white/20 rounded-full w-24" />
          <view class="h-9 bg-white/20 rounded w-3/4" />
          <view class="h-4 bg-white/20 rounded w-1/2" />
        </view>
      </template>
      <template v-else-if="error">
        <text class="text-2xl font-semibold text-white tracking-tight block mb-2">
          {{ errorTitle }}
        </text>
        <text class="text-sm text-white/80 block">{{ errorMessage }}</text>
      </template>
      <template v-else>
        <!-- 状态标签 -->
        <view class="flex items-center flex-wrap gap-2 mb-3">
          <view
            class="px-3 py-1 rounded-full text-[11px] font-medium"
            :class="statusPillClass"
          >
            <text>{{ statusLabel }}</text>
          </view>
          <view
            v-if="showDayProgress"
            class="px-3 py-1 rounded-full bg-white/20 text-white text-[11px]"
          >
            <text>第{{ currentDay }}天 / 共{{ totalDays }}天</text>
          </view>
        </view>

        <!-- 旅行名称 -->
        <text class="text-[32px] font-semibold text-white tracking-tight block mb-2 leading-tight">
          {{ title }}
        </text>

        <!-- 目的地（与 title 独立） -->
        <view v-if="destinationDisplay" class="flex items-center gap-1.5 mb-2">
          <view class="i-carbon-location-filled text-white/70 text-xs shrink-0" />
          <text class="text-[15px] text-white/85 leading-snug">{{ destinationDisplay }}</text>
        </view>

        <!-- 日期与天数 -->
        <view class="flex items-center flex-wrap gap-4 text-white/80">
          <view class="flex items-center gap-1.5">
            <view class="i-carbon-calendar text-xs" />
            <text class="text-xs">{{ dateRangeText }}</text>
          </view>
          <view v-if="totalDays" class="flex items-center gap-1.5">
            <view class="i-carbon-calendar text-xs" />
            <text class="text-xs">{{ totalDays }} 天旅程</text>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CoverPhoto, TripStatus } from '@/types/trip'
import TracciImage from '@/components/common/TracciImage.vue'

const props = withDefaults(
  defineProps<{
    navPaddingTop: string
    coverPhoto?: CoverPhoto
    loading?: boolean
    error?: boolean
    errorTitle?: string
    errorMessage?: string
    title?: string
    destinationDisplay?: string
    dateRangeText?: string
    totalDays?: number
    status?: TripStatus
    currentDay?: number
    showActions?: boolean
    memberCount?: number
    canShare?: boolean
    canEdit?: boolean
  }>(),
  {
    loading: false,
    error: false,
    errorTitle: '',
    errorMessage: '',
    title: '',
    destinationDisplay: '',
    dateRangeText: '',
    totalDays: 0,
    status: 'planning',
    currentDay: 1,
    showActions: true,
    memberCount: 0,
    canShare: true,
    canEdit: true
  }
)

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'share'): void
  (e: 'settings'): void
  (e: 'members'): void
}>()

const statusLabel = computed(() => {
  switch (props.status) {
    case 'ongoing':
      return '进行中'
    case 'planning':
      return '计划中'
    case 'completed':
      return '已完成'
    default:
      return ''
  }
})

const statusPillClass = computed(() => {
  switch (props.status) {
    case 'ongoing':
      return 'bg-brand text-white'
    case 'planning':
      return 'bg-amber-400/90 text-white'
    case 'completed':
      return 'bg-white/25 text-white'
    default:
      return 'bg-white/25 text-white'
  }
})

const showDayProgress = computed(
  () => props.status === 'ongoing' && props.totalDays && props.currentDay
)
</script>

<style scoped>
.header-action-btn {
  position: relative;
  z-index: 31;
}
</style>
