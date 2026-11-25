<!--
  Demo Journey 只读详情页
  - 布局与交互对齐当前 detail.vue（复用同一批展示组件），禁止改动 detail 样式。
  - 数据仅从 Bundle 缓存读取，不调用 Trip / Itinerary / Expense / Journal 写接口。
  - 薄增量：示例横幅、场景切换、成员只读弹层、AA 只读结算。
-->
<template>
  <view class="min-h-screen bg-background pb-safe relative">
    <view v-if="!sceneData" class="flex-col-center py-24">
      <text class="text-sm text-muted">加载示例旅程...</text>
    </view>

    <template v-else>
      <!-- 与 detail 同组件；showActions 仅开成员入口，分享/设置关闭 -->
      <TripDetailHeader
        :nav-padding-top="navPaddingTop"
        :cover-photo="sceneData.trip.coverPhoto"
        :title="sceneData.trip.title"
        :destination-display="destinationDisplay"
        :date-range-text="dateRangeText"
        :total-days="sceneData.trip.totalDays"
        :status="sceneData.trip.status"
        :current-day="0"
        :show-actions="true"
        :member-count="members.length"
        :can-share="false"
        :can-edit="false"
        @back="onBack"
        @members="showMembersSheet = true"
      />

      <!-- 示例语义（契约：首屏稳定位置标明仅供查看） -->
      <view class="demo-banner px-5 py-3">
        <view class="demo-banner__inner">
          <view class="i-carbon-view w-3.5 h-3.5 text-brand shrink-0" />
          <text class="text-[12px] font-medium text-brand">示例旅程 · 仅供查看</text>
        </view>
      </view>

      <!-- 场景切换（demo 薄增量；三 Scene 与 iOS 一致） -->
      <view class="px-5 mb-1">
        <view class="scene-switcher" role="tablist" aria-label="旅程阶段">
          <view
            v-for="s in sceneOptions"
            :key="s.key"
            class="scene-segment"
            :class="{ 'scene-segment--active': sceneKey === s.key }"
            role="tab"
            :aria-selected="sceneKey === s.key"
            @click="onSelectScene(s.key)"
          >
            <text class="scene-segment__label">{{ s.label }}</text>
          </view>
        </view>
        <text class="block text-center mt-2 text-[11px] text-muted-strong">
          {{ sceneHint }}
        </text>
      </view>

      <!-- 统计概览（与 detail 同组件） -->
      <TripStatsOverviewCard
        :total-cny="sceneData.trip.totalCny"
        :node-count="sceneData.trip.nodeCount || 0"
        :journal-count="sceneData.trip.journalCount || 0"
        :has-group-expenses="hasGroupExpenses"
        @show-settlement="showSettlementSheet = true"
      />

      <!--
        天气：与 detail 的 TripWeatherSection「可用态入口卡」同构
        （单行摘要卡 + 点击打开逐日 Sheet；数据来自 Scene，不调 Provider）
      -->
      <view v-if="weatherAvailable" class="px-5 mt-3">
        <view
          class="bg-card rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          style="box-shadow: 0 2px 16px -4px rgba(139, 115, 85, 0.06)"
          role="button"
          aria-label="查看逐日天气预报"
          @click="showWeatherSheet = true"
        >
          <view
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style="background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(229, 224, 218, 0.7)"
          >
            <WeatherIcon :icon="weatherEntry.icon" icon-size="md" />
          </view>
          <view class="flex-1 min-w-0">
            <view class="flex items-center gap-2 mb-0.5">
              <text class="text-[14px] font-medium text-primary">{{ weatherEntry.summary }}</text>
              <text class="text-[14px] font-semibold text-primary">{{ weatherEntry.tempRange }}</text>
            </view>
            <text class="text-[12px] text-secondary truncate block">
              {{ weatherEntry.tip || '点击查看逐日预报' }}
            </text>
          </view>
          <view class="i-carbon-chevron-right text-lg text-disabled shrink-0" />
        </view>
      </view>

      <!-- 内容区：结构对齐 detail.detail-body -->
      <view class="detail-body px-5 pt-6 pb-8">
        <view v-if="itineraryDays.length === 0" class="py-12 text-center">
          <view class="w-20 h-20 mx-auto mb-4 rounded-full bg-warm-surface flex-center">
            <view class="i-carbon-map text-3xl text-disabled" />
          </view>
          <text class="text-base font-medium text-primary block mb-2">暂无行程数据</text>
        </view>

        <template v-else>
          <view class="trip-workspace-sticky">
            <scroll-view scroll-x enable-flex class="whitespace-nowrap" :show-scrollbar="false">
              <view class="flex gap-2 pb-2">
                <view
                  v-for="day in itineraryDays"
                  :key="day.id"
                  class="shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                  :class="selectedDayId === day.id ? 'day-chip--active' : 'day-chip--idle'"
                  @click="selectedDayId = day.id"
                >
                  <text
                    class="text-xs mb-0.5"
                    :class="selectedDayId === day.id ? 'text-primary' : 'text-muted'"
                  >
                    {{ formatDayDate(day.date) }}
                  </text>
                  <text
                    class="text-[11px] mb-0.5"
                    :class="selectedDayId === day.id ? 'text-secondary' : 'text-muted'"
                  >
                    {{ formatWeekday(day.date) }}
                  </text>
                </view>
              </view>
            </scroll-view>

            <TripDetailContentTabs v-model="selectedContentTab" />
          </view>

          <view
            v-if="selectedDay"
            :key="`${sceneKey}-${selectedDayId}-${selectedContentTab}`"
            class="tab-fade-in"
          >
            <DayTabContent
              :day="selectedDay"
              :active-tab="selectedContentTab"
              :expenses="dayExpenses"
              :journals="dayJournals"
              :loading-expenses="false"
              :loading-journals="false"
              :trip-status="sceneData.trip.status"
              :readonly="true"
              @preview-journal="onPreviewJournalPhotos"
            />
          </view>
        </template>
      </view>
    </template>

    <!-- 逐日天气（静态 Scene；无刷新） -->
    <WeatherDetailSheet
      :visible="showWeatherSheet"
      :location-name="sceneData?.weather.locationName"
      :date-range="dateRangeText"
      :items="sceneData?.weather.items ?? []"
      :trip-total-days="sceneData?.trip.totalDays"
      :refreshing="false"
      @close="showWeatherSheet = false"
      @refresh="() => {}"
    />

    <!-- AA 结算（只读 scene 数据） -->
    <TracciBottomSheet
      :model-value="showSettlementSheet"
      max-height="80vh"
      content-class="flex flex-col min-h-0"
      @update:model-value="showSettlementSheet = $event"
    >
      <view class="flex items-center justify-between mb-5 shrink-0">
        <text class="text-lg font-semibold text-primary">AA 结算</text>
        <view
          class="w-8 h-8 rounded-full bg-subtle flex-center active:opacity-80"
          @click="showSettlementSheet = false"
        >
          <view class="i-carbon-close text-secondary text-base" />
        </view>
      </view>
      <scroll-view scroll-y class="flex-1 min-h-0" style="max-height: 55vh">
        <DemoSettlementView
          v-if="sceneData"
          :settlement="sceneData.expenseSettlement"
        />
      </scroll-view>
    </TracciBottomSheet>

    <!-- 成员列表（只读） -->
    <TracciBottomSheet
      :model-value="showMembersSheet"
      max-height="60vh"
      @update:model-value="showMembersSheet = $event"
    >
      <view class="flex items-center justify-between mb-5">
        <text class="text-lg font-semibold text-primary">旅行成员</text>
        <view
          class="w-8 h-8 rounded-full bg-subtle flex-center active:opacity-80"
          @click="showMembersSheet = false"
        >
          <view class="i-carbon-close text-secondary text-base" />
        </view>
      </view>
      <view class="space-y-3">
        <view
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3 p-3 rounded-2xl bg-warm-surface/60"
        >
          <view class="w-10 h-10 rounded-full bg-brand/10 flex-center shrink-0">
            <image
              v-if="member.avatarUrl"
              :src="member.avatarUrl"
              class="w-10 h-10 rounded-full"
              mode="aspectFill"
            />
            <text v-else class="text-sm font-semibold text-brand">
              {{ member.nickname?.charAt(0) || '?' }}
            </text>
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-sm font-medium text-primary block truncate">
              {{ member.nickname }}
            </text>
            <text class="text-[11px] text-muted-strong block">
              {{ roleLabel(member.role) }}
            </text>
          </view>
        </view>
      </view>
    </TracciBottomSheet>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TripDetailHeader from './components/TripDetailHeader.vue'
import TripStatsOverviewCard from './components/TripStatsOverviewCard.vue'
import TripDetailContentTabs from './components/TripDetailContentTabs.vue'
import DayTabContent from './components/DayTabContent.vue'
import WeatherDetailSheet from './components/weather/WeatherDetailSheet.vue'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import DemoSettlementView from './components/DemoSettlementView.vue'
import { getCachedBundle } from '@/utils/demoJourneyCache'
import { formatDateRangeShort } from '@/utils/format'
import { getTripDestinationDisplayName } from '@/utils/destination'
import {
  formatItineraryDayDate,
  formatItineraryWeekday
} from '@/utils/itineraryStatus'
import { utcToLocalDate } from '@/utils/timezone'
import { getWeatherLabel } from '@/constants/weatherIcons'
import {
  normalizeJournalPhotos,
  enrichJournalPhotoWithAccessUrl
} from '@/utils/journalPhoto'
import {
  getImageDisplayUrlCandidates,
  resolveImageSrcFromCandidates
} from '@/utils/image'
import { FileService } from '@/services/file'
import type { DemoJourneyBundle, DemoSceneKey, DemoJourneyScene } from '@/types/demoJourney'
import type { MemberRole } from '@/types/collaboration'
import type { TravelLogItem } from '@/types/journal'
import type { JournalPhotoItem } from '@/types/file'
import { isGroupExpenseScope } from '@/types/expense'

// ── 系统尺寸（与 detail 一致） ──
const statusBarHeight = ref(0)
const capsuleBottom = ref(0)
try {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  if (menuButtonInfo) capsuleBottom.value = menuButtonInfo.bottom
  // #endif
} catch (e) {
  console.error('获取系统信息失败', e)
}

const navPaddingTop = computed(() => {
  if (capsuleBottom.value) return `${capsuleBottom.value + 8}px`
  return `${statusBarHeight.value + 12}px`
})

// ── Bundle & Scene ──
const bundle = ref<DemoJourneyBundle | null>(null)
const sceneKey = ref<DemoSceneKey>('ONGOING')

const sceneOptions: Array<{ key: DemoSceneKey; label: string }> = [
  { key: 'PLANNING', label: '计划中' },
  { key: 'ONGOING', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' }
]

/** 工具向短句（对齐 iOS browseHint 语气，非 slogan） */
const SCENE_HINTS: Record<DemoSceneKey, string> = {
  PLANNING: '看规划阶段的行程与概况',
  ONGOING: '看进行中的记录与花费',
  COMPLETED: '看结束后的回顾与材料'
}

const sceneHint = computed(() => SCENE_HINTS[sceneKey.value] || '')

const sceneData = computed<DemoJourneyScene | null>(() => {
  if (!bundle.value?.scenes) return null
  const key = sceneKey.value.toLowerCase() as Lowercase<DemoSceneKey>
  return bundle.value.scenes[key] ?? null
})

const destinationDisplay = computed(() => {
  if (!sceneData.value) return ''
  return getTripDestinationDisplayName(sceneData.value.trip)
})

const dateRangeText = computed(() => {
  if (!sceneData.value) return ''
  return formatDateRangeShort(sceneData.value.trip.startDate, sceneData.value.trip.endDate)
})

const members = computed(() => sceneData.value?.members ?? [])

const hasGroupExpenses = computed(() => {
  const list = sceneData.value?.expenses.list ?? []
  if (list.some(e => isGroupExpenseScope(e.expenseScope))) return true
  // 兜底：有有效 AA 结算结果时也展示入口（与 Bundle settlement 对齐）
  const s = sceneData.value?.expenseSettlement
  if (!s) return false
  const total = Number(s.totalGroupAmount)
  return (
    (Array.isArray(s.members) && s.members.length > 0) &&
    !Number.isNaN(total) &&
    total > 0
  )
})

const weatherAvailable = computed(() => {
  const w = sceneData.value?.weather
  return w?.available && Array.isArray(w.items) && w.items.length > 0
})

/** 与 TripWeatherSection 入口卡同一推导口径（首日摘要 + 全程温区） */
const weatherEntry = computed(() => {
  const items = sceneData.value?.weather.items ?? []
  const first = items[0]
  const mins = items.map(i => i.tempMin).filter((t): t is number => t != null)
  const maxs = items.map(i => i.tempMax).filter((t): t is number => t != null)
  const lo = mins.length ? Math.min(...mins) : null
  const hi = maxs.length ? Math.max(...maxs) : null
  let tempRange = ''
  if (lo != null && hi != null) tempRange = `${lo}° / ${hi}°`
  else if (hi != null) tempRange = `${hi}°`
  else if (lo != null) tempRange = `${lo}°`
  return {
    icon: first?.icon || 'unknown',
    summary:
      first?.weather && first.weather !== 'unknown'
        ? first.weather
        : getWeatherLabel(first?.icon),
    tempRange,
    tip: first?.tip || ''
  }
})

// ── 行程天 / Tab ──
// 示例展示：固定落在行程第一天，不绑定真实「今天」
type TabKey = 'itinerary' | 'journal' | 'expense'
const itineraryDays = computed(() => sceneData.value?.itinerary.days ?? [])
const selectedDayId = ref('')
const selectedContentTab = ref<TabKey>('itinerary')

const formatDayDate = formatItineraryDayDate
const formatWeekday = formatItineraryWeekday

const pickInitialDayId = (): string => {
  const days = itineraryDays.value
  if (days.length === 0) return ''
  // 优先 dayIndex 最小（通常为第 1 天），不跟墙钟日期对齐
  const sorted = [...days].sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0))
  return sorted[0]?.id || days[0].id
}

watch(
  () => itineraryDays.value,
  (days) => {
    if (days.length === 0) {
      selectedDayId.value = ''
      return
    }
    if (!selectedDayId.value || !days.some(d => d.id === selectedDayId.value)) {
      selectedDayId.value = pickInitialDayId()
    }
  },
  { immediate: true }
)

const onSelectScene = (key: DemoSceneKey) => {
  if (sceneKey.value === key) return
  sceneKey.value = key
  selectedContentTab.value = 'itinerary'
  // 清空后由 itineraryDays watch 按新 Scene 重选初始日
  selectedDayId.value = ''
}

const selectedDay = computed(() =>
  itineraryDays.value.find(d => d.id === selectedDayId.value) ?? null
)

const allExpenses = computed(() => sceneData.value?.expenses.list ?? [])
const allJournals = computed(() => sceneData.value?.journals.list ?? [])

const dayExpenses = computed(() => {
  if (!selectedDay.value) return []
  return allExpenses.value.filter(e => {
    if (!e.spentAt) return false
    return utcToLocalDate(e.spentAt) === selectedDay.value!.date
  })
})

const dayJournals = computed(() => {
  if (!selectedDay.value) return []
  return allJournals.value.filter(j => {
    if (!j.occurredAt) return false
    return utcToLocalDate(j.occurredAt) === selectedDay.value!.date
  })
})

// ── 弹层 ──
const showSettlementSheet = ref(false)
const showMembersSheet = ref(false)
const showWeatherSheet = ref(false)

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

/** 日志照片预览：与 detail 同解析链路；demo URL 自带时不产生额外请求 */
const onPreviewJournalPhotos = async (
  _log: TravelLogItem,
  _photos: unknown[],
  index: number
) => {
  const photos = _photos as JournalPhotoItem[]
  if (!photos?.length) return
  const normalized = normalizeJournalPhotos(photos)
  const enriched = await Promise.all(
    normalized.map(p =>
      enrichJournalPhotoWithAccessUrl(p, fid => FileService.getAccessUrl(fid))
    )
  )
  const urls = (
    await Promise.all(
      enriched.map(p => resolveImageSrcFromCandidates(getImageDisplayUrlCandidates(p)))
    )
  ).filter(Boolean)
  if (!urls.length) return
  uni.previewImage({
    current: Math.min(index, urls.length - 1),
    urls
  })
}

const roleLabel = (role: MemberRole): string => {
  switch (role) {
    case 'owner': return '创建者'
    case 'editor': return '编辑者'
    case 'viewer': return '查看者'
    default: return role
  }
}

onLoad(() => {
  const cached = getCachedBundle()
  if (cached?.scenes && cached.enabled) {
    bundle.value = cached
    const ds = String(cached.defaultScene || '').toUpperCase()
    if (['PLANNING', 'ONGOING', 'COMPLETED'].includes(ds)) {
      sceneKey.value = ds as DemoSceneKey
    }
  } else {
    uni.showToast({ title: '示例数据不可用', icon: 'none' })
    // switchTab 目标必须是 tabBar 页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 400)
  }
})
</script>

<style scoped>
/* 以下样式仅本页自用；不修改 detail.vue / 共享组件 scoped 样式 */
.detail-body {
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  background: #fff;
}

.trip-workspace-sticky {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -4px -20px 20px;
  padding: 4px 20px 0;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid rgba(232, 228, 222, 0.72);
}

.tab-fade-in {
  animation: tab-enter 200ms ease;
}

@keyframes tab-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.day-chip--active {
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(79, 125, 255, 0.16);
}

.day-chip--idle {
  background: rgba(251, 250, 246, 0.76);
}

.demo-banner {
  padding-left: 20px;
  padding-right: 20px;
}

.demo-banner__inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(79, 125, 255, 0.06);
  border: 1px solid rgba(79, 125, 255, 0.12);
}

.scene-switcher {
  display: flex;
  align-items: center;
  padding: 3px;
  border-radius: 999px;
  background: #faf8f5;
  border: 0.5px solid #ede8e2;
}

.scene-segment {
  flex: 1;
  min-width: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #6e655c;
}

.scene-segment--active {
  background: #ffffff;
  color: #4f7dff;
  box-shadow: 0 2px 8px -2px rgba(139, 115, 85, 0.16);
}

.scene-segment__label {
  font-size: 13px;
  font-weight: 500;
}
</style>
