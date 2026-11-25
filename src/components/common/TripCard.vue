<template>
  <view
    class="trip-row card-base p-3.5 flex gap-3.5 mb-3 active:scale-[0.99] transition-transform"
    :aria-label="ariaLabel"
    role="button"
    @click="onClick"
  >
    <!-- Cover thumbnail -->
    <view class="w-[84px] h-[84px] rounded-[18px] overflow-hidden flex-shrink-0 bg-subtle">
      <TracciImage
        v-if="coverUrl"
        :image="trip.coverPhoto"
        :urls="[coverUrl]"
        mode="aspectFill"
        class="w-full h-full"
        custom-class="w-full h-full"
        style="display: block; width: 100%; height: 100%"
      />
      <view v-else class="w-full h-full flex-col-center bg-subtle">
        <view class="i-carbon-image text-2xl text-disabled" />
      </view>
    </view>

    <!-- Info -->
    <view class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
      <view>
        <!-- Title + status badge -->
        <view class="flex items-center gap-2 mb-1.5">
          <text class="text-[15px] font-semibold text-primary truncate tracking-tight">
            {{ trip.title }}
          </text>
          <view
            class="status-badge shrink-0"
            :style="statusBadgeStyle"
          >
            {{ statusText }}
          </view>
        </view>

        <!-- 目的地 -->
        <view
          v-if="destinationDisplay"
          class="flex items-center gap-1.5 text-muted-strong mb-1"
        >
          <view class="i-carbon-location w-3 h-3 shrink-0" />
          <text class="text-[11px] truncate">{{ destinationDisplay }}</text>
        </view>

        <!-- Date -->
        <view class="flex items-center gap-1.5 text-muted-strong">
          <view class="i-carbon-calendar w-3 h-3" />
          <text class="text-[11px]">{{ dateDisplay }}</text>
        </view>
      </view>

      <!-- Stats summary -->
      <view v-if="hasStats" class="flex items-center gap-2 text-[11px] text-secondary">
        <text>{{ trip.totalDays }} 天</text>
        <template v-if="trip.nodeCount">
          <view class="w-0.5 h-0.5 rounded-full bg-disabled" />
          <text>{{ trip.nodeCount }} 个行程</text>
        </template>
        <template v-if="trip.journalCount">
          <view class="w-0.5 h-0.5 rounded-full bg-disabled" />
          <text>{{ trip.journalCount }} 条日志</text>
        </template>
      </view>
    </view>

    <!-- Chevron -->
    <view class="flex items-center">
      <view class="i-carbon-chevron-right w-5 h-5 text-disabled" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Trip } from '@/types/trip'
import { getTripCoverThumbnailUrl } from '@/utils/image'
import { getTripDestinationDisplayName } from '@/utils/destination'
import { TRIP_STATUS_BADGE_COLORS } from '@/constants/designTokens'
import TracciImage from '@/components/common/TracciImage.vue'

const props = defineProps<{
  trip: Trip
}>()

const emit = defineEmits<{
  (e: 'click', trip: Trip): void
}>()

const onClick = () => {
  emit('click', props.trip)
}

const coverUrl = computed(() => {
  return getTripCoverThumbnailUrl(props.trip)
})

const destinationDisplay = computed(() => getTripDestinationDisplayName(props.trip))

const dateDisplay = computed(() => {
  const start = (props.trip.startDate || '').replace(/-/g, '.')
  if (props.trip.endDate) {
    const end = props.trip.endDate.replace(/-/g, '.')
    return `${start} - ${end}`
  }
  return start
})

const hasStats = computed(() => {
  return (
    props.trip.totalDays !== undefined ||
    (props.trip.nodeCount !== undefined && props.trip.nodeCount > 0) ||
    (props.trip.journalCount !== undefined && props.trip.journalCount > 0)
  )
})

const statusText = computed(() => {
  switch (props.trip.status) {
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

const statusBadgeStyle = computed(() => {
  const colors = TRIP_STATUS_BADGE_COLORS[props.trip.status] || TRIP_STATUS_BADGE_COLORS.completed
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
})

const ariaLabel = computed(() => {
  const parts = [props.trip.title, statusText.value, dateDisplay.value]
  if (destinationDisplay.value) parts.splice(1, 0, destinationDisplay.value)
  return `旅程：${parts.filter(Boolean).join('，')}`
})
</script>

<style scoped>
.status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 1.5;
}
</style>
