<template>
  <view
    class="poi-result-item px-4 py-3.5 flex items-start gap-3 border-b border-warm-border/50 last:border-b-0 active:bg-warm-surface/80 transition-colors"
    :class="selected ? 'bg-brand/5' : ''"
    @tap="emit('select')"
  >
    <view class="flex-1 min-w-0">
      <view class="flex items-center gap-2">
        <text class="text-[15px] font-medium text-primary truncate">{{ primaryText }}</text>
        <view
          v-if="selected"
          class="i-carbon-checkmark-filled text-brand text-sm shrink-0"
        />
      </view>
      <text v-if="secondaryText" class="text-[13px] text-secondary block mt-1 leading-snug">
        {{ secondaryText }}
      </text>
      <text v-if="regionText && precision !== 'city'" class="text-[12px] text-muted block mt-1">
        {{ regionText }}
      </text>
      <text
        v-if="precision === 'poi' && poi.typeName"
        class="text-[11px] text-muted/80 block mt-1"
      >
        {{ poi.typeName }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LocationPoiDTO } from '@/types/location'
import type { PoiSearchPrecision } from '@/types/location'
import { getCityDisplayLabelFromPoi } from '@/utils/destination'

const props = defineProps<{
  poi: LocationPoiDTO
  selected?: boolean
  precision?: PoiSearchPrecision
}>()

const emit = defineEmits<{
  (e: 'select'): void
}>()

const primaryText = computed(() => {
  if (props.precision === 'city') {
    return getCityDisplayLabelFromPoi(props.poi)
  }
  return props.poi.name
})

const secondaryText = computed(() => {
  if (props.precision === 'city') {
    const poiName = props.poi.name?.trim()
    const districtName = props.poi.districtName?.trim()
    // 区县子 POI 仅作去重参考，列表里不展示「参考：黄浦区」
    if (poiName && poiName !== primaryText.value && poiName !== districtName) {
      return `参考：${poiName}`
    }
    return ''
  }
  return props.poi.address || ''
})

const regionText = computed(() => {
  const parts = [props.poi.cityName, props.poi.districtName].filter(Boolean)
  return parts.join(' · ')
})
</script>
