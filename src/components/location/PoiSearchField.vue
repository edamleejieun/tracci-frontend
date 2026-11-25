<template>
  <view class="poi-search-field">
    <view class="mb-2">
      <view class="flex items-center gap-2">
        <view class="i-carbon-location text-secondary text-sm" />
        <text class="text-[13px] font-medium text-secondary">{{ fieldLabel }}</text>
        <text v-if="optional" class="text-[12px] text-muted font-normal">可选</text>
      </view>
      <text
        v-if="city && precision === 'poi'"
        class="text-[11px] text-muted block mt-1 ml-5"
      >
        仅在「{{ city }}」范围内搜索
      </text>
    </view>

    <SelectedDestinationCard
      v-if="modelValue && !activelySearching"
      class="mb-3"
      :destination="modelValue"
      :precision="precision"
      @clear="onClearSelection"
      @change="onStartReselect"
    />

    <view v-if="!modelValue || activelySearching">
      <view
        class="relative flex items-center"
        :class="error ? 'ring-2 ring-danger/30 rounded-xl' : ''"
      >
        <input
          :value="keyword"
          type="text"
          :placeholder="fieldPlaceholder"
          placeholder-class="text-muted"
          class="w-full h-12 pl-4 pr-11 input-surface text-[15px] text-primary box-border"
          maxlength="100"
          :focus="inputFocus"
          @input="onKeywordInput"
          @focus="onInputFocus"
        />
        <view
          v-if="keyword"
          class="absolute right-3 w-7 h-7 rounded-full bg-white/90 flex-center active:scale-95 transition-transform"
          @tap.stop="onClearKeyword"
        >
          <view class="i-carbon-close text-muted text-sm" />
        </view>
      </view>

      <PoiSearchResultList
        v-if="showResultList"
        :status="effectiveSearchStatus"
        :items="displayItems"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :precision="precision"
        :selected-poi-id="precision === 'poi' ? modelValue?.poiId : undefined"
        :selected-city-key="precision === 'city' ? selectedCityKey : undefined"
        @select="onSelectPoi"
        @load-more="loadMore"
      />
    </view>

    <text v-if="error" class="text-[12px] text-danger mt-1.5 block">{{ error }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, toRef } from 'vue'
import type { PlaceInfo, LocationPoiDTO, PoiSearchPrecision } from '@/types/location'
import type { TripDestination } from '@/types/trip'
import { usePoiSearch } from '@/composables/usePoiSearch'
import {
  dedupePoiResultsByCity,
  filterPoiResultsByTripDestination,
  getCityKeyFromPlace,
  placeToTripDestination,
  poiToPlace
} from '@/utils/destination'
import SelectedDestinationCard from '@/components/location/SelectedDestinationCard.vue'
import PoiSearchResultList from '@/components/location/PoiSearchResultList.vue'

const props = withDefaults(
  defineProps<{
    modelValue: PlaceInfo | TripDestination | null
    city?: string
    /** 旅程目的地，用于 POI 模式下的客户端范围过滤 */
    destinationScope?: TripDestination | null
    error?: string
    optional?: boolean
    label?: string
    placeholder?: string
    /** city：旅程目的地，精确到市；poi：行程节点等精确地点 */
    precision?: PoiSearchPrecision
  }>(),
  {
    optional: true,
    precision: 'poi'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlaceInfo | TripDestination | null): void
}>()

const fieldLabel = computed(() => {
  if (props.label) return props.label
  return props.precision === 'city' ? '目的地' : '地点'
})

const fieldPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return props.precision === 'city' ? '搜索城市或地区' : '搜索城市、景点或地址'
})

const cityRef = toRef(() => props.city)
const { keyword, items, status, hasMore, loadingMore, clearKeyword, loadMore } = usePoiSearch({
  city: cityRef
})

const displayItems = computed(() => {
  let list = items.value
  if (props.precision === 'city') {
    return dedupePoiResultsByCity(list)
  }
  const scope = props.destinationScope ?? props.city
  if (props.precision === 'poi' && scope) {
    list = filterPoiResultsByTripDestination(list, scope)
  }
  return list
})

const effectiveSearchStatus = computed(() => {
  if (
    props.precision === 'poi' &&
    (props.destinationScope || props.city) &&
    status.value === 'success' &&
    displayItems.value.length === 0 &&
    items.value.length > 0
  ) {
    return 'empty' as const
  }
  return status.value
})

const selectedCityKey = computed(() =>
  props.modelValue ? getCityKeyFromPlace(props.modelValue) : undefined
)

const activelySearching = ref(false)
const inputFocus = ref(false)

const showResultList = computed(() => {
  if (!activelySearching.value) return false
  const trimmed = keyword.value.trim()
  if (!trimmed) return false
  return ['too-short', 'loading', 'success', 'empty', 'error'].includes(effectiveSearchStatus.value)
})

watch(
  () => props.modelValue,
  value => {
    if (value && !activelySearching.value) {
      keyword.value = ''
    }
  }
)

const onKeywordInput = (e: { detail: { value: string } }) => {
  activelySearching.value = true
  keyword.value = e.detail.value
}

const onInputFocus = () => {
  activelySearching.value = true
}

const onClearKeyword = () => {
  clearKeyword()
}

const onSelectPoi = (poi: LocationPoiDTO) => {
  const place = poiToPlace(poi)
  const value = props.precision === 'city' ? placeToTripDestination(place) : place
  emit('update:modelValue', value)
  activelySearching.value = false
  clearKeyword()
  inputFocus.value = false
}

const onClearSelection = () => {
  emit('update:modelValue', null)
  activelySearching.value = true
  clearKeyword()
  inputFocus.value = true
}

const onStartReselect = () => {
  activelySearching.value = true
  if (props.modelValue?.name) {
    keyword.value = props.modelValue.cityName || props.modelValue.name
  }
  inputFocus.value = true
}
</script>
