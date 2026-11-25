<template>
  <view class="poi-result-list mt-2 rounded-2xl border border-subtle bg-white overflow-hidden shadow-sm">
    <view v-if="status === 'too-short'" class="px-4 py-3">
      <text class="text-[13px] text-muted">请输入更完整的地点</text>
    </view>

    <view v-else-if="status === 'loading'" class="px-4 py-4 flex items-center gap-2">
      <view class="i-carbon-circle-dash animate-spin text-brand text-lg" />
      <text class="text-[13px] text-muted">正在搜索地点…</text>
    </view>

    <view v-else-if="status === 'empty'" class="px-4 py-4">
      <text class="text-[13px] text-muted leading-relaxed">
        没有找到相关地点，试试更换关键词
      </text>
    </view>

    <view v-else-if="status === 'error'" class="px-4 py-4">
      <text class="text-[13px] text-muted leading-relaxed">
        暂时无法搜索地点，请稍后再试
      </text>
    </view>

    <template v-else-if="status === 'success'">
      <PoiSearchResultItem
        v-for="item in items"
        :key="item.poiId"
        :poi="item"
        :precision="precision"
        :selected="isItemSelected(item)"
        @select="emit('select', item)"
      />
      <view
        v-if="hasMore"
        class="px-4 py-3.5 flex-center border-t border-warm-border/50 active:bg-warm-surface/80 transition-colors"
        @tap="emit('load-more')"
      >
        <view
          v-if="loadingMore"
          class="i-carbon-circle-dash animate-spin text-brand text-base mr-2"
        />
        <text class="text-[13px] text-brand font-medium">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { LocationPoiDTO } from '@/types/location'
import type { PoiSearchStatus } from '@/composables/usePoiSearch'
import type { PoiSearchPrecision } from '@/types/location'
import { getCityKeyFromPoi } from '@/utils/destination'
import PoiSearchResultItem from '@/components/location/PoiSearchResultItem.vue'

const props = defineProps<{
  status: PoiSearchStatus
  items: LocationPoiDTO[]
  selectedPoiId?: string
  selectedCityKey?: string
  precision?: PoiSearchPrecision
  hasMore?: boolean
  loadingMore?: boolean
}>()

const isItemSelected = (item: LocationPoiDTO) => {
  if (props.precision === 'city' && props.selectedCityKey) {
    return getCityKeyFromPoi(item) === props.selectedCityKey
  }
  return props.selectedPoiId === item.poiId
}

const emit = defineEmits<{
  (e: 'select', poi: LocationPoiDTO): void
  (e: 'load-more'): void
}>()
</script>
