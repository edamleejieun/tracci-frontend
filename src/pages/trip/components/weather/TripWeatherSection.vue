<template>
  <view v-if="tripId">
    <!-- Loading skeleton -->
    <WeatherSkeleton v-if="loading" />

    <!-- AVAILABLE: compact entry card -->
    <view
      v-else-if="weatherData && weatherData.available && weatherItems.length > 0"
      class="px-5 mt-3"
    >
      <view
        class="bg-card rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        :style="{ boxShadow: '0 2px 16px -4px rgba(139, 115, 85, 0.06)' }"
        @click="showSheet = true"
      >
        <!-- Weather icon circle -->
        <view
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style="background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(229, 224, 218, 0.7)"
        >
          <WeatherIcon :icon="entryIcon" icon-size="md" />
        </view>

        <!-- Info -->
        <view class="flex-1 min-w-0">
          <view class="flex items-center gap-2 mb-0.5">
            <text class="text-[14px] font-medium text-primary">{{ entrySummary }}</text>
            <text class="text-[14px] font-semibold text-primary">{{ entryTempRange }}</text>
          </view>
          <text class="text-[12px] text-secondary truncate block">{{ entryTip }}</text>
        </view>

        <!-- Chevron -->
        <view class="i-carbon-chevron-right text-lg text-disabled shrink-0" />
      </view>
    </view>

    <!-- Non-AVAILABLE / error: compact inline row instead of full card -->
    <view
      v-else-if="(weatherData && !weatherData.available) || error || (weatherData && weatherData.available && weatherItems.length === 0)"
      class="px-5 mt-3"
    >
      <view
        class="bg-card rounded-2xl p-3 flex items-center gap-3"
        :style="{ boxShadow: '0 2px 16px -4px rgba(139, 115, 85, 0.06)' }"
      >
        <view
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-subtle"
        >
          <view :class="compactStatusIcon" class="text-base" :style="{ color: compactStatusColor }" />
        </view>
        <text class="flex-1 min-w-0 text-[13px] text-secondary truncate">{{ compactStatusMessage }}</text>
        <view
          v-if="compactShowRetry"
          class="text-[12px] text-brand font-medium shrink-0 active:opacity-60 transition-opacity"
          @click="fetchWeather"
        >
          重试
        </view>
        <view
          v-if="compactShowEdit"
          class="text-[12px] text-brand font-medium shrink-0 active:opacity-60 transition-opacity"
          @click="$emit('editTrip')"
        >
          去完善
        </view>
      </view>
    </view>

    <!-- Weather detail bottom sheet (matches v0's WeatherDetailSheet) -->
    <WeatherDetailSheet
      :visible="showSheet"
      :location-name="weatherData?.locationName"
      :date-range="dateRangeText"
      :items="weatherItems"
      :forecast-limit-days="weatherData?.forecastLimitDays"
      :trip-total-days="tripTotalDays"
      @close="showSheet = false"
      :refreshing="loading"
      @refresh="fetchWeather"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { TripService } from '@/services/trip'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import WeatherSkeleton from './WeatherSkeleton.vue'
import WeatherDetailSheet from './WeatherDetailSheet.vue'
import { formatDateRangeShort } from '@/utils/format'
import { getWeatherLabel } from '@/constants/weatherIcons'
import type { TripWeatherResponse } from '@/types/weather'

const props = withDefaults(
  defineProps<{
    tripId: string
    startDate?: string
    endDate?: string
    tripHasEditPermission?: boolean
  }>(),
  {
    startDate: '',
    endDate: '',
    tripHasEditPermission: false
  }
)

defineEmits<{
  (e: 'editTrip'): void
}>()

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const weatherData = ref<TripWeatherResponse | null>(null)
const showSheet = ref(false)
const currentRequestTripId = ref('')
let requestSeq = 0
let disposed = false

/** ── Entry card derived values (v0 WeatherEntryCard) ── */

const weatherItems = computed(() => {
  const items = weatherData.value?.items
  return Array.isArray(items) ? items : []
})

const entryIcon = computed(() => weatherItems.value[0]?.icon)

const entrySummary = computed(() => {
  const first = weatherItems.value[0]
  if (!first) return ''
  if (first.weather && first.weather !== 'unknown') return first.weather
  return getWeatherLabel(first.icon)
})

const entryTempRange = computed(() => {
  const items = weatherItems.value
  if (!items.length) return ''
  const mins = items.map(i => i.tempMin).filter((t): t is number => t != null)
  const maxs = items.map(i => i.tempMax).filter((t): t is number => t != null)
  const lo = mins.length ? Math.min(...mins) : null
  const hi = maxs.length ? Math.max(...maxs) : null
  if (lo != null && hi != null) return `${lo}° / ${hi}°`
  if (hi != null) return `${hi}°`
  if (lo != null) return `${lo}°`
  return ''
})

const entryTip = computed(() => weatherItems.value[0]?.tip || '')

/** ── Compact error state derived values ── */

const compactStatus = computed(() => {
  if (weatherData.value && !weatherData.value.available) return weatherData.value.status
  if (error.value) return 'PROVIDER_ERROR'
  return 'PROVIDER_ERROR'
})

const compactStatusMessage = computed(() => {
  if (weatherData.value?.message) return weatherData.value.message
  if (errorMessage.value) return errorMessage.value
  const defaults: Record<string, string> = {
    DATE_TOO_FAR: '临近出行时将为你更新天气',
    PAST_TRIP_NOT_SUPPORTED: '历史天气暂不可查看',
    LOCATION_MISSING: '暂无目的地位置信息',
    PROVIDER_ERROR: '暂时无法获取天气信息'
  }
  return defaults[compactStatus.value] || '暂时无法获取天气信息'
})

const compactStatusIcon = computed(() => {
  const icons: Record<string, string> = {
    DATE_TOO_FAR: 'i-carbon-time',
    PAST_TRIP_NOT_SUPPORTED: 'i-carbon-calendar',
    LOCATION_MISSING: 'i-carbon-location',
    PROVIDER_ERROR: 'i-carbon-cloud-offline'
  }
  return icons[compactStatus.value] || 'i-carbon-cloud-offline'
})

const compactStatusColor = computed(() => {
  const colors: Record<string, string> = {
    DATE_TOO_FAR: '#F59E0B',
    PAST_TRIP_NOT_SUPPORTED: '#9B958C',
    LOCATION_MISSING: '#7A746B',
    PROVIDER_ERROR: '#C4BEB5'
  }
  return colors[compactStatus.value] || '#C4BEB5'
})

const compactShowRetry = computed(() => compactStatus.value === 'PROVIDER_ERROR')
const compactShowEdit = computed(() => compactStatus.value === 'LOCATION_MISSING' && props.tripHasEditPermission)

const dateRangeText = computed(() => {
  if (props.startDate && props.endDate) return formatDateRangeShort(props.startDate, props.endDate)
  return ''
})

/** ── Trip duration for long trip hint ── */

const tripTotalDays = computed(() => {
  if (!props.startDate || !props.endDate) return 0
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
})

/** ── Data fetching ── */

const fetchWeather = async () => {
  if (!props.tripId) return
  if (loading.value && currentRequestTripId.value === props.tripId) return

  const seq = ++requestSeq
  currentRequestTripId.value = props.tripId
  try {
    loading.value = true
    error.value = false
    const data = await TripService.getTripWeather(props.tripId)
    if (disposed || seq !== requestSeq) return
    weatherData.value = data
  } catch (err: unknown) {
    if (disposed || seq !== requestSeq) return
    const message = err instanceof Error ? err.message : err
    console.error('Fetch weather failed:', message)
    weatherData.value = null
    error.value = true
    errorMessage.value = '暂时无法获取天气信息，请稍后再试'
  } finally {
    if (!disposed && seq === requestSeq) {
      loading.value = false
      currentRequestTripId.value = ''
    }
  }
}

fetchWeather()

watch(() => props.tripId, (newId, oldId) => {
  if (newId && newId !== oldId) fetchWeather()
})

onUnmounted(() => {
  disposed = true
  requestSeq += 1
})
</script>
