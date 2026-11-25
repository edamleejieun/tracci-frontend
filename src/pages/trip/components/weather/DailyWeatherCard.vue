<template>
  <view class="daily-weather-card bg-background rounded-2xl text-center">
    <text class="daily-weather-date text-muted block">{{ formattedDate }}</text>
    <text class="daily-weather-weekday text-disabled block">{{ weekday }}</text>
    <view class="daily-weather-icon flex justify-center">
      <WeatherIcon :icon="item.icon" icon-size="md" />
    </view>
    <text class="daily-weather-temp font-semibold text-primary block">{{ tempText }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import {
  formatWeatherWeekdayLabel,
  normalizeWeatherDate
} from '@/constants/weatherIcons'
import type { TripWeatherDailyItem } from '@/types/weather'

const props = defineProps<{
  item: TripWeatherDailyItem
}>()

const dateStr = computed(() => normalizeWeatherDate(props.item.date as string | number[]))

const formattedDate = computed(() => {
  const parts = dateStr.value.split('-')
  if (parts.length === 3) return `${parts[1]}.${parts[2]}`
  return dateStr.value || String(props.item.date || '')
})

const weekday = computed(() =>
  formatWeatherWeekdayLabel(props.item.weekday, props.item.date as string | number[])
)

const tempText = computed(() => {
  const low = props.item.tempMin
  const high = props.item.tempMax
  if (low != null && high != null) return `${low}° / ${high}°`
  if (high != null) return `最高 ${high}°`
  if (low != null) return `最低 ${low}°`
  return '暂无温度'
})
</script>

<style scoped>
.daily-weather-card {
  box-sizing: border-box;
  width: 176rpx;
  min-width: 176rpx;
  max-width: 176rpx;
  height: 164rpx;
  min-height: 164rpx;
  max-height: 164rpx;
  padding: 12rpx 10rpx;
  overflow: hidden;
}

.daily-weather-date {
  font-size: 22rpx;
  line-height: 26rpx;
}

.daily-weather-weekday {
  margin-top: 2rpx;
  font-size: 20rpx;
  line-height: 24rpx;
}

.daily-weather-icon {
  height: 44rpx;
  margin-top: 8rpx;
  margin-bottom: 8rpx;
  align-items: center;
}

.daily-weather-temp {
  font-size: 26rpx;
  line-height: 30rpx;
  white-space: nowrap;
}
</style>
