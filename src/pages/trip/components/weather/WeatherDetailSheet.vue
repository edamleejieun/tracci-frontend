<template>
  <TracciBottomSheet
    :model-value="visible"
    max-height="85vh"
    padding-x="20px"
    padding-bottom="24px"
    @update:model-value="$emit('close')"
    @close="$emit('close')"
  >
    <view class="pb-safe">
      <!-- Title row -->
      <view class="flex items-center justify-between mb-4">
        <view>
          <text class="text-[17px] font-semibold text-primary block">出行天气</text>
          <text class="text-[12px] text-muted">{{ subtitle }}</text>
        </view>
        <view class="flex items-center gap-1 text-[12px] text-brand font-medium" @click.stop="onRefresh">
          <view
            :class="refreshing ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'"
            class="text-sm"
          />
          <text>{{ refreshing ? '刷新中' : '刷新' }}</text>
        </view>
      </view>

      <!-- Summary card -->
      <view
        class="rounded-[20px] p-4 mb-4"
        style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
      >
        <view class="flex items-start justify-between mb-3">
          <view class="flex-1 min-w-0">
            <view class="flex items-center gap-1.5 mb-1">
              <view class="i-carbon-location text-sm text-secondary shrink-0" />
              <text class="text-[13px] font-medium text-primary">{{ locationName }}</text>
            </view>
            <text class="text-[11px] text-muted">{{ firstDayDateText }}</text>
          </view>
          <view
            class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ml-3"
            style="background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(229, 224, 218, 0.7)"
          >
            <WeatherIcon :icon="firstDayIcon" icon-size="lg" />
          </view>
        </view>

        <view class="mb-3">
          <text class="text-[18px] font-semibold text-primary block mb-0.5">{{ firstDayWeather }}</text>
          <text class="text-[24px] font-semibold text-primary tracking-tight block">{{ tempRangeText }}</text>
        </view>

        <view
          v-if="tip"
          class="flex items-center gap-2 px-3 py-2 rounded-xl"
          style="background: rgba(255, 255, 255, 0.6)"
        >
          <view class="i-carbon-umbrella text-base text-brand shrink-0" />
          <text class="text-[12px] text-secondary">{{ tip }}</text>
        </view>
      </view>

      <!-- Daily forecast -->
      <text class="text-[12px] text-muted block mb-3">逐日预报</text>
      <scroll-view scroll-x class="w-full" :show-scrollbar="false" style="white-space: nowrap">
        <view
          v-if="safeItems.length === 1"
          class="daily-weather-item"
        >
          <DailyWeatherCard :item="safeItems[0]" />
        </view>
        <template v-else>
          <view
            v-for="item in safeItems"
            :key="item.date"
            class="daily-weather-item"
          >
            <DailyWeatherCard :item="item" />
          </view>
        </template>
      </scroll-view>

      <!-- Long trip hint -->
      <view
        v-if="showLongTripHint"
        class="mt-3 px-3 py-2 rounded-xl"
        style="background: rgba(245, 158, 11, 0.06)"
      >
        <text class="text-[11px] text-muted leading-relaxed">{{ longTripHintText }}</text>
      </view>
    </view>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import DailyWeatherCard from './DailyWeatherCard.vue'
import {
  getWeatherLabel,
  formatWeatherWeekdayLabel,
  normalizeWeatherDate
} from '@/constants/weatherIcons'
import type { TripWeatherDailyItem } from '@/types/weather'

const props = defineProps<{
  visible: boolean
  locationName?: string
  dateRange?: string
  items: TripWeatherDailyItem[]
  forecastLimitDays?: number
  tripTotalDays?: number
  refreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const subtitle = computed(() => '根据旅程日期动态更新')

const safeItems = computed(() => {
  return Array.isArray(props.items) ? props.items : []
})
const firstDay = computed(() => safeItems.value[0] || null)
const firstDayIcon = computed(() => firstDay.value?.icon)
const firstDayWeather = computed(() => {
  if (!firstDay.value) return ''
  if (firstDay.value.weather && firstDay.value.weather !== 'unknown') return firstDay.value.weather
  return getWeatherLabel(firstDay.value.icon)
})
const tip = computed(() => firstDay.value?.tip)

const firstDayDateText = computed(() => {
  const dateStr = normalizeWeatherDate(firstDay.value?.date as string | number[] | undefined)
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  const shortDate = parts.length === 3 ? `${parts[1]}.${parts[2]}` : dateStr
  const today = new Date()
  const todayText = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
  const prefix =
    dateStr === todayText
      ? '今天'
      : formatWeatherWeekdayLabel(firstDay.value?.weekday, firstDay.value?.date as string | number[])
  return prefix ? `${prefix} ${shortDate}` : shortDate
})

const tempRangeText = computed(() => {
  if (!safeItems.value.length) return ''
  const mins = safeItems.value.map(i => i.tempMin).filter((t): t is number => t != null)
  const maxs = safeItems.value.map(i => i.tempMax).filter((t): t is number => t != null)
  const lo = mins.length ? Math.min(...mins) : null
  const hi = maxs.length ? Math.max(...maxs) : null
  if (lo != null && hi != null) return `${lo}° / ${hi}°`
  if (hi != null) return `${hi}°`
  if (lo != null) return `${lo}°`
  return ''
})

const showLongTripHint = computed(() => {
  const total = props.tripTotalDays || 0
  return total > 0 && total > safeItems.value.length
})

const longTripHintText = computed(() => {
  const limit = props.forecastLimitDays || safeItems.value.length || 4
  return `已展示近期可查询的 ${limit} 天天气，后续日期临近时将自动更新`
})

const onRefresh = () => {
  if (props.refreshing) return
  emit('refresh')
}
</script>

<style scoped>
.daily-weather-item {
  display: inline-block;
  width: 176rpx;
  min-width: 176rpx;
  max-width: 176rpx;
  margin-right: 16rpx;
  vertical-align: top;
}
</style>
