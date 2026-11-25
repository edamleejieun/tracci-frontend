<!--
  首页示例旅程卡（对齐 iOS HomeDemoJourneyCard）
  - 形态接近真实旅程卡：封面 + 标题/元信息/能力 pills，仅多「示例 · 只读」标识
  - 视觉权重低于 Featured 进行中大卡，但高于空态纯文案引导
  - 只在登录后 total === 0 且 Demo 就绪时显示
-->
<template>
  <view
    v-if="trip"
    class="demo-card active:scale-[0.99] transition-transform"
    role="button"
    :aria-label="`示例旅程，只读，${trip.title}`"
    @click="$emit('click')"
  >
    <!-- 封面条 -->
    <view class="demo-card__cover">
      <TracciImage
        v-if="coverUrl"
        :image="coverPhotoData"
        mode="aspectFill"
        class="demo-card__cover-img"
        custom-class="demo-card__cover-img"
        style="display: block; width: 100%; height: 100%"
      />
      <view v-else class="demo-card__cover-fallback" />
      <view class="demo-card__cover-scrim" />
      <view class="demo-card__badge">
        <text>示例 · 只读</text>
      </view>
    </view>

    <!-- 正文 -->
    <view class="demo-card__body">
      <text class="demo-card__title">{{ trip.title }}</text>

      <view class="demo-card__meta">
        <view v-if="destinationDisplay" class="demo-card__meta-item">
          <view class="i-carbon-location w-3 h-3 shrink-0" />
          <text class="truncate">{{ destinationDisplay }}</text>
        </view>
        <view class="demo-card__meta-item">
          <view class="i-carbon-calendar w-3 h-3 shrink-0" />
          <text>{{ trip.totalDays || 0 }} 天</text>
        </view>
        <view class="i-carbon-chevron-right demo-card__chevron" />
      </view>

      <text v-if="dateRangeText" class="demo-card__dates">{{ dateRangeText }}</text>

      <view v-if="pills.length" class="demo-card__pills">
        <view v-for="(p, idx) in pills" :key="idx" class="demo-pill">
          <view :class="[p.icon, 'w-3 h-3']" />
          <text>{{ p.text }}</text>
        </view>
      </view>

      <text class="demo-card__hint">看看行程、日志和开支长什么样</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DemoJourneyBundle } from '@/types/demoJourney'
import TracciImage from '@/components/common/TracciImage.vue'
import { getTripCoverThumbnailUrl, getImageListDisplayUrl } from '@/utils/image'

const props = defineProps<{
  bundle: DemoJourneyBundle
}>()

defineEmits<{ click: [] }>()

const trip = computed(() => {
  const scenes = props.bundle.scenes
  return (
    scenes?.ongoing?.trip ||
    scenes?.planning?.trip ||
    scenes?.completed?.trip ||
    null
  )
})

const coverPhotoData = computed(() => trip.value?.coverPhoto)

const coverUrl = computed(() => {
  if (!trip.value) return ''
  return getImageListDisplayUrl(trip.value.coverPhoto) || getTripCoverThumbnailUrl(trip.value)
})

const destinationDisplay = computed(() => {
  const dest = trip.value?.destination
  if (!dest) return ''
  const name = dest.name || dest.cityName || dest.districtName || ''
  const title = (trip.value?.title || '').trim()
  // 标题已含目的地时不再重复（对齐 iOS）
  if (!name || !title) return name
  if (title === name || title.includes(name) || name.includes(title)) return ''
  return name
})

const dateRangeText = computed(() => {
  if (!trip.value) return ''
  const start = (trip.value.startDate || '').replace(/-/g, '.')
  const end = (trip.value.endDate || '').replace(/-/g, '.')
  if (!end) return start
  return `${start} - ${end}`
})

const pills = computed(() => {
  if (!trip.value) return [] as Array<{ icon: string; text: string }>
  const list: Array<{ icon: string; text: string }> = []
  const nodes = trip.value.nodeCount || 0
  const journals = trip.value.journalCount || 0
  const cny = trip.value.totalCny
  if (nodes > 0) list.push({ icon: 'i-carbon-map', text: `${nodes} 行程` })
  if (journals > 0) list.push({ icon: 'i-carbon-notebook', text: `${journals} 日志` })
  if (cny && cny !== '0' && cny !== '0.00') {
    const num = Number(cny)
    if (!Number.isNaN(num) && num > 0) {
      list.push({
        icon: 'i-carbon-wallet',
        text: `¥${num >= 1000 ? num.toLocaleString('zh-CN', { maximumFractionDigits: 0 }) : cny}`
      })
    }
  }
  return list
})
</script>

<style scoped>
.demo-card {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: #ffffff;
  box-shadow:
    0 6px 20px -4px rgba(139, 115, 85, 0.12),
    0 2px 8px -2px rgba(139, 115, 85, 0.08);
}

.demo-card__cover {
  position: relative;
  width: 100%;
  height: 120px;
  background: #d4cfc8;
  overflow: hidden;
}

.demo-card__cover-img {
  width: 100%;
  height: 100%;
}

.demo-card__cover-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #d4cfc8 0%, #b8b0a8 100%);
}

.demo-card__cover-scrim {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.55), transparent);
  pointer-events: none;
}

.demo-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 10px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.94);
}

.demo-card__badge text {
  font-size: 11px;
  font-weight: 600;
  color: #4f7dff;
  letter-spacing: 0.02em;
}

.demo-card__body {
  padding: 14px 16px 16px;
}

.demo-card__title {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #2f2a25;
  line-height: 1.3;
  margin-bottom: 8px;
}

.demo-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-bottom: 4px;
}

.demo-card__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: #6e655c;
}

.demo-card__meta-item text {
  font-size: 12px;
  color: #6e655c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-card__chevron {
  margin-left: auto;
  width: 14px;
  height: 14px;
  color: #c4beb5;
  flex-shrink: 0;
}

.demo-card__dates {
  display: block;
  font-size: 12px;
  color: #9b958c;
  margin-bottom: 10px;
}

.demo-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.demo-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 100px;
  background: #faf8f5;
  color: #6e655c;
}

.demo-pill text {
  font-size: 11px;
  font-weight: 500;
  color: #6e655c;
}

.demo-card__hint {
  display: block;
  font-size: 12px;
  color: #6e655c;
  line-height: 1.4;
}
</style>
