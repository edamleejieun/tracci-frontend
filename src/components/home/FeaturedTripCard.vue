<!-- DESIGN_RADIUS.xxl → rounded-[28px]（featured card 圆角） -->
<template>
  <view
    class="featured-card relative overflow-hidden rounded-[28px] mb-4 active:scale-[0.985] transition-transform"
    :aria-label="ariaLabel"
    role="button"
    @click="emit('click', props.trip)"
  >
    <!-- Cover image -->
    <view class="absolute inset-0 bg-subtle">
      <TracciImage
        v-if="finalCover"
        :image="finalCover"
        mode="aspectFill"
        class="w-full h-full"
        custom-class="w-full h-full"
        style="display: block; width: 100%; height: 100%"
      />
      <view v-else class="w-full h-full bg-gradient-to-br from-[#D4CFC8] to-[#B8B0A8]" />
    </view>

    <!-- Gradient overlay -->
    <view class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

    <!-- Content -->
    <view class="relative h-[240px] flex flex-col justify-between p-5">
      <!-- Top: status tags -->
      <view class="flex items-center gap-2">
        <view class="status-pill status-ongoing">
          <view class="w-1.5 h-1.5 rounded-full bg-white" />
          <text class="text-[11px] text-white font-medium">进行中</text>
        </view>
        <view v-if="currentDay && totalDays" class="status-pill status-day">
          <text class="text-[11px] text-white">第{{ currentDay }}天 / 共{{ totalDays }}天</text>
        </view>
      </view>

      <!-- Bottom: trip info -->
      <view>
        <!-- 旅行名称 -->
        <text class="text-[28px] font-semibold text-white tracking-tight mb-2 block leading-tight">
          {{ title }}
        </text>

        <!-- 目的地（与 title 独立） -->
        <view v-if="destinationDisplay" class="flex items-center gap-1.5 mb-2">
          <view class="i-carbon-location-filled w-3.5 h-3.5 text-white/70 shrink-0" />
          <text class="text-[14px] text-white/85 leading-snug">{{ destinationDisplay }}</text>
        </view>

        <!-- Date -->
        <view class="flex items-center gap-1.5 mb-4">
          <view class="i-carbon-calendar w-3.5 h-3.5 text-white/70" />
          <text class="text-[12px] text-white/70">{{ dateRange }}</text>
        </view>

        <!-- Data pills -->
        <view class="flex flex-wrap items-center gap-2">
          <view
            v-if="expenseDisplay"
            class="data-pill"
          >
            <view class="i-carbon-wallet w-3 h-3 text-white/80" />
            <text class="text-[11px] text-white font-medium">{{ expenseDisplay }}</text>
          </view>
          <view
            v-if="itineraryCount"
            class="data-pill"
          >
            <view class="i-carbon-map w-3 h-3 text-white/80" />
            <text class="text-[11px] text-white font-medium">{{ itineraryCount }} 行程</text>
          </view>
          <view
            v-if="journalCount"
            class="data-pill"
          >
            <view class="i-carbon-notebook w-3 h-3 text-white/80" />
            <text class="text-[11px] text-white font-medium">{{ journalCount }} 日志</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TracciImage from '@/components/common/TracciImage.vue'

const props = defineProps<{
  title: string
  destinationDisplay?: string
  dateRange: string
  coverUrl: string
  currentDay?: number
  totalDays?: number
  expenseDisplay?: string
  itineraryCount?: number
  journalCount?: number
  trip?: { id: string }
}>()

const emit = defineEmits<{
  (e: 'click', trip: { id: string } | undefined): void
}>()

const finalCover = computed(() => props.coverUrl)

const ariaLabel = computed(() => {
  const day =
    props.currentDay && props.totalDays
      ? `第 ${props.currentDay}/${props.totalDays} 天`
      : ''
  const detail = [props.title, '进行中', day, props.destinationDisplay, props.dateRange]
    .filter(Boolean)
    .join('，')
  return `旅程：${detail}`
})
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
}

/* DESIGN_COLORS.brand → #4F7DFF */
.status-ongoing {
  background: #4F7DFF;
}

.status-day {
  background: rgba(255, 255, 255, 0.2);
}

.data-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

/* 暖棕 elevated 阴影，对齐 designTokens / shadow-elevated */
.featured-card {
  box-shadow:
    0 12px 32px -6px rgba(139, 115, 85, 0.16),
    0 4px 12px -2px rgba(139, 115, 85, 0.1);
}
</style>
