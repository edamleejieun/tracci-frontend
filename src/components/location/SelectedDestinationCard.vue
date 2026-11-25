<template>
  <view class="selected-destination-card rounded-2xl bg-warm-surface border-warm-border/50 p-4">
    <view class="flex items-start gap-3">
      <view class="w-10 h-10 rounded-xl bg-white shadow-sm flex-center shrink-0">
        <view class="i-carbon-location-filled text-brand text-lg" />
      </view>
      <view class="flex-1 min-w-0">
        <text class="text-[15px] font-medium text-primary block leading-snug">
          {{ displayName }}
        </text>
        <text
          v-if="precision === 'poi' && destination.address"
          class="text-[13px] text-secondary block mt-1 leading-snug"
        >
          {{ destination.address }}
        </text>
        <text v-if="regionText" class="text-[12px] text-muted block mt-1">
          {{ regionText }}
        </text>
      </view>
      <view
        v-if="showClear"
        class="w-8 h-8 rounded-full bg-white/90 flex-center shrink-0 active:scale-95 transition-transform"
        @tap.stop="emit('clear')"
      >
        <view class="i-carbon-close text-muted text-sm" />
      </view>
    </view>

    <view
      v-if="showChange"
      class="mt-3 pt-1 active:opacity-70"
      @tap="emit('change')"
    >
      <text class="text-[13px] text-brand font-medium">{{ changeLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlaceInfo } from '@/types/location'
import type { TripDestination } from '@/types/trip'
import type { PoiSearchPrecision } from '@/types/location'
import { formatDestinationRegion, getTripDestinationDisplayName } from '@/utils/destination'

const props = withDefaults(
  defineProps<{
    destination: PlaceInfo | TripDestination
    precision?: PoiSearchPrecision
    showClear?: boolean
    showChange?: boolean
  }>(),
  {
    precision: 'poi',
    showClear: true,
    showChange: true
  }
)

const emit = defineEmits<{
  (e: 'clear'): void
  (e: 'change'): void
}>()

const displayName = computed(() => {
  if (props.precision === 'city') {
    return getTripDestinationDisplayName({ destination: props.destination as TripDestination })
  }
  return props.destination.name
})

const regionText = computed(() => {
  if (props.precision === 'city') return ''
  return formatDestinationRegion(props.destination)
})

const changeLabel = computed(() =>
  props.precision === 'city' ? '重新选择城市' : '重新选择地点'
)
</script>
