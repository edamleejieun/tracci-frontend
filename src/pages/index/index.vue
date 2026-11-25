<template>
  <TracciLayout
    :show-navbar="false"
    :show-tab-bar="true"
    current-tab="home"
    content-class="bg-warm-bg"
    @tab-change="onTabChange"
  >
    <HomeHeader
      ref="homeHeaderRef"
      v-model="keyword"
      :show-search="isLoggedIn"
      @search="onSearch"
    />

    <view class="pb-24 relative">
      <!-- Hero Section -->
      <view class="px-5 pt-4 pb-6">
        <view class="home-hero card-hero shadow-card p-6 relative">
          <image
            class="absolute right-3 bottom-3 w-20 h-20 opacity-[0.06] pointer-events-none"
            src="/static/brand/generated/brand-watermark-grey-256.png"
            mode="aspectFit"
            aria-hidden="true"
          />

          <!-- Date -->
          <text class="text-[13px] text-muted-strong mb-2 tracking-wide relative block">
            {{ currentDate }}
          </text>

          <!-- Greeting -->
          <view class="relative">
            <text class="text-[22px] font-semibold text-primary mb-1 tracking-tight block">
              {{ greetingCopy.greeting }}，{{ greetingName }}
            </text>
            <text class="text-sm text-secondary leading-relaxed block">
              {{ greetingCopy.subtext }}
            </text>
          </view>
        </view>
      </view>

      <!-- Trip list section -->
      <view class="px-5 relative">
        <!-- Section title -->
        <view class="section-heading mb-4 flex items-center justify-between">
          <text :class="[TYPOGRAPHY.sectionTitle, 'block']">
            我的旅程
          </text>
          <view
            v-if="!loading && !error && trips.length > 0"
            class="flex items-center gap-3"
          >
            <text class="text-[12px] text-muted-strong font-medium">
              <template v-if="keyword.trim()">
                {{ total > 0 ? total : trips.length }} 个结果
              </template>
              <template v-else>
                {{ total }} 段
              </template>
            </text>
            <view
              v-if="showViewAll"
              class="view-all-btn"
              role="button"
              hover-class="view-all-btn--active"
              aria-label="查看全部旅程"
              @click="onViewAllTrips"
            >
              <text class="view-all-btn__text">查看全部 ›</text>
            </view>
          </view>
        </view>

        <!-- Loading state：Featured 骨架 + 行卡骨架，对齐最终布局 -->
        <view v-if="loading && trips.length === 0">
          <FeaturedTripCardSkeleton />
          <TripCardSkeleton v-for="i in 2" :key="i" />
        </view>

        <!-- Error state -->
        <TracciError
          v-else-if="error && trips.length === 0"
          title="加载失败"
          message="无法获取旅行列表，请检查网络后重试"
          @retry="() => fetchTrips({ mode: 'full' })"
        />

        <!-- Trip list：首页最多预览 5 条；超出进全部旅程页 -->
        <view v-else-if="previewTrips.length > 0">
          <view
            v-for="group in tripGroups"
            :key="group.key"
            class="trip-group"
          >
            <view
              v-if="showGroupHeaders"
              class="trip-group__header"
            >
              <text class="trip-group__title">{{ group.label }}</text>
              <text class="trip-group__count">{{ group.trips.length }}</text>
            </view>

            <template v-for="(trip, idx) in group.trips" :key="trip.id">
              <FeaturedTripCard
                v-if="group.key === 'ongoing' && idx === 0"
                class="card-enter"
                :style="{ animationDelay: `${getGlobalIndex(trip.id) * 40}ms` }"
                :title="trip.title"
                :destination-display="getTripDestinationDisplayName(trip)"
                :date-range="formatDateRange(trip)"
                :cover-url="getTripCoverThumbnailUrl(trip)"
                :current-day="getCurrentDay(trip)"
                :total-days="trip.totalDays"
                :expense-display="formatExpense(trip.totalCny)"
                :itinerary-count="trip.nodeCount || 0"
                :journal-count="trip.journalCount || 0"
                :trip="trip"
                @click="goToDetail"
              />
              <TripCard
                v-else
                class="card-enter"
                :style="{ animationDelay: `${getGlobalIndex(trip.id) * 40}ms` }"
                :trip="trip"
                @click="goToDetail"
              />
            </template>
          </view>
        </view>

        <!-- Search: no results -->
        <view v-else-if="isLoggedIn && keyword.trim()" class="flex-col-center py-14 px-4">
          <view class="w-16 h-16 rounded-full bg-warm-surface flex-center mb-5">
            <view class="i-carbon-search text-2xl text-muted-strong" />
          </view>
          <text class="text-base font-semibold text-primary mb-1.5 block">未找到相关旅程</text>
          <text class="text-sm text-muted-strong block text-center mb-5 leading-relaxed">
            没有匹配「{{ keyword.trim() }}」的结果，试试其他关键词
          </text>
          <view
            class="btn-secondary h-11 px-6"
            role="button"
            aria-label="清空搜索"
            @click="clearSearch"
          >
            <text class="text-sm font-medium text-brand">清空搜索</text>
          </view>
        </view>

        <!-- Guest empty state -->
        <view v-else-if="!isLoggedIn" class="flex-col-center py-12 px-4">
          <view class="w-16 h-16 rounded-full bg-warm-surface flex-center mb-5">
            <view class="i-carbon-map text-2xl text-muted-strong" />
          </view>
          <text class="text-base font-semibold text-primary mb-1.5 block">开启你的第一段旅程</text>
          <text class="text-sm text-muted-strong block text-center leading-relaxed max-w-[280px]">
            登录后创建旅程，记录每一站行程与开支。
          </text>
        </view>

        <!--
          Logged-in empty state：
          有示例时卡在上；创建走底部 TabBar 中央「+」，此处不再放主 CTA。
        -->
        <view v-else class="px-4 py-10">
          <view
            v-if="demoState === 'ready' && demoBundle"
            class="w-full mb-6"
          >
            <DemoJourneyCard
              :bundle="demoBundle"
              @click="goToDemo"
            />
          </view>

          <view class="flex-col-center">
            <text class="text-base font-semibold text-primary mb-1.5 block">还没有旅程</text>
            <text class="text-sm text-muted-strong block text-center leading-relaxed max-w-[280px]">
              {{
                demoState === 'ready' && demoBundle
                  ? '点底部「+」，开始你的第一段旅程'
                  : '点底部「+」创建旅程，或加入同伴的行程'
              }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </TracciLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import TracciLayout from '@/components/layout/TracciLayout.vue'
import HomeHeader from '@/components/home/HomeHeader.vue'
import FeaturedTripCard from '@/components/home/FeaturedTripCard.vue'
import FeaturedTripCardSkeleton from '@/components/home/FeaturedTripCardSkeleton.vue'
import TripCard from '@/components/common/TripCard.vue'
import TracciError from '@/components/common/TracciError.vue'
import TripCardSkeleton from '@/components/common/TripCardSkeleton.vue'
import DemoJourneyCard from '@/components/home/DemoJourneyCard.vue'
import { TripService } from '@/services/trip'
import { DemoJourneyService } from '@/services/demoJourney'
import type { DemoJourneyBundle } from '@/types/demoJourney'
import { useUserStore } from '@/stores/user'
import { requireLogin } from '@/utils/guestAuth'
import { isGraduated, markGraduated } from '@/utils/demoGraduated'
import { getTripCoverThumbnailUrl } from '@/utils/image'
import { TRIP_LIST_DIRTY_KEY } from '@/constants/storageKeys'
import type { Trip, TripStatus } from '@/types/trip'
import { getTripDestinationDisplayName } from '@/utils/destination'
import { getHomeGreetingCopy } from '@/utils/homeGreeting'
import { TYPOGRAPHY } from '@/constants/designTokens'

/** 首页预览条数；超出后引导至全部旅程页 */
const HOME_PREVIEW_LIMIT = 5
/**
 * 首页拉取量：后端列表默认按创建时间倒序，无 status 排序参数。
 * 多拉一页再在客户端按 进行中 → 计划中 → 已完成 排序后截断，避免漏掉进行中旅程。
 */
const HOME_FETCH_SIZE = 20

type FetchMode = 'full' | 'silent' | 'refresh'

interface TripGroup {
  key: TripStatus
  label: string
  trips: Trip[]
}

const trips = ref<Trip[]>([])
const keyword = ref('')
const loading = ref(true)
const error = ref(false)
const total = ref(0)
const userStore = useUserStore()
const homeHeaderRef = ref<{ openSearch: () => void; closeSearch: () => void } | null>(null)
let fetchTripsSeq = 0

// ── Demo Journey（独立状态，不污染 trips / total） ──
const demoState = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')
const demoBundle = ref<DemoJourneyBundle | null>(null)

const resetDemoState = () => {
  demoState.value = 'idle'
  demoBundle.value = null
}

useWechatShare()

const isLoggedIn = computed(() => userStore.isLogin())

/** 首页只展示前 N 条（已按状态排序） */
const previewTrips = computed(() => trips.value.slice(0, HOME_PREVIEW_LIMIT))

/** 总数超过预览上限时显示「查看全部」 */
const showViewAll = computed(() => total.value > HOME_PREVIEW_LIMIT)

/** 仅当预览区存在 ≥2 种状态时显示分组头 */
const showGroupHeaders = computed(() => tripGroups.value.length > 1)

const tripGroups = computed<TripGroup[]>(() => {
  const order: { key: TripStatus; label: string }[] = [
    { key: 'ongoing', label: '进行中' },
    { key: 'planning', label: '计划中' },
    { key: 'completed', label: '已完成' }
  ]
  return order
    .map(({ key, label }) => ({
      key,
      label,
      trips: previewTrips.value.filter(t => t.status === key)
    }))
    .filter(g => g.trips.length > 0)
})

// --- Date & Greeting ---

const now = ref(new Date())

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const currentDate = computed(() => {
  const d = now.value
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekDays[d.getDay()]}`
})

const hasOngoingTrip = computed(() => trips.value.some(trip => trip.status === 'ongoing'))

const greetingCopy = computed(() => {
  return getHomeGreetingCopy(now.value.getHours(), hasOngoingTrip.value)
})

const greetingName = computed(() => {
  const nickname = userStore.userInfo?.nickname?.trim()
  return nickname || '旅人'
})

// --- Helpers ---

const formatDateRange = (trip: Trip) => {
  const start = (trip.startDate || '').replace(/-/g, '.')
  if (trip.endDate) {
    const end = trip.endDate.replace(/-/g, '.')
    return `${start} - ${end}`
  }
  return start
}

const getCurrentDay = (trip: Trip): number => {
  if (!trip.startDate) return 1
  const start = new Date(trip.startDate)
  const nowDate = new Date()
  const diff = Math.floor((nowDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, Math.min(diff, trip.totalDays || diff))
}

const formatExpense = (totalCny?: string): string => {
  if (!totalCny || totalCny === '0' || totalCny === '0.00') return ''
  const num = Number(totalCny)
  if (Number.isNaN(num)) return ''
  return `¥${num.toLocaleString()}`
}

const sortTrips = (list: Trip[]) => {
  const rank: Record<TripStatus, number> = {
    ongoing: 0,
    planning: 1,
    completed: 2
  }
  return [...list].sort((a, b) => {
    const ra = rank[a.status] ?? 9
    const rb = rank[b.status] ?? 9
    if (ra !== rb) return ra - rb
    return 0
  })
}

/** 在 previewTrips 中的全局索引，用于卡片入场动画的 stagger 延迟 */
const getGlobalIndex = (tripId: string) => previewTrips.value.findIndex(t => t.id === tripId)

// --- Data fetching ---

const fetchTrips = async (options?: { mode?: FetchMode }) => {
  if (!isLoggedIn.value) {
    loading.value = false
    error.value = false
    trips.value = []
    total.value = 0
    resetDemoState()
    return
  }

  const mode = options?.mode ?? 'full'
  const seq = ++fetchTripsSeq

  try {
    if (mode === 'full') loading.value = true
    error.value = false

    const query = keyword.value.trim()
    const res = await TripService.getTripList({
      page: 1,
      pageSize: HOME_FETCH_SIZE,
      keyword: query || undefined
    })

    if (seq !== fetchTripsSeq) return

    const list = res.list || []
    total.value = typeof res.total === 'number' ? res.total : list.length
    // 按状态排序后只保留首页预览条数；完整列表在 /pages/trip/list
    trips.value = sortTrips(list).slice(0, HOME_PREVIEW_LIMIT)

    // 有真实旅行：标记已毕业（永久资格），Demo 不再展示
    if (total.value > 0 && userStore.userInfo?.id) {
      markGraduated(userStore.userInfo.id)
    }

    // 契约：仅 total===0 且无搜索词时请求 Demo；搜索无结果不展示
    if (total.value === 0 && !query) {
      // 下拉刷新 / 重新进入：始终带 ETag 重校验，禁止 ready 后永不请求
      fetchDemoJourney({ force: mode === 'refresh' || mode === 'full' })
    } else {
      resetDemoState()
    }
  } catch (err) {
    if (seq !== fetchTripsSeq) return
    console.error('Fetch trips failed:', err)
    error.value = true
    // 真实列表失败时不展示 Demo，保留原错误态
    resetDemoState()
  } finally {
    if (seq === fetchTripsSeq) {
      loading.value = false
    }
  }
}

/**
 * 加载示例旅程（只在 total === 0、已登录、未毕业、无搜索词时调用）。
 * 失败 / 关闭 / 不可展示：静默降级，不 toast。
 */
const fetchDemoJourney = async (opts?: { force?: boolean }) => {
  if (demoState.value === 'loading') return
  // 非 force 且已 ready：仍允许后台静默重校验（force 由 full/refresh 触发）
  if (demoState.value === 'ready' && !opts?.force) {
    // 后台 ETag 校验：不闪 loading
    void revalidateDemoInBackground()
    return
  }

  const userId = userStore.userInfo?.id
  if (!userId || isGraduated(userId)) {
    resetDemoState()
    return
  }

  demoState.value = 'loading'
  try {
    const result = await DemoJourneyService.getJourney()
    if (result.status === 'displayable') {
      demoBundle.value = result.bundle
      demoState.value = 'ready'
    } else {
      // feature_off / unavailable：回退原空态
      resetDemoState()
      if (result.status === 'unavailable') {
        demoState.value = 'failed'
      }
    }
  } catch {
    resetDemoState()
    demoState.value = 'failed'
  }
}

/** 已展示时静默重校验（304 复用缓存；200 换新 Bundle） */
const revalidateDemoInBackground = async () => {
  const userId = userStore.userInfo?.id
  if (!userId || isGraduated(userId)) return
  try {
    const result = await DemoJourneyService.getJourney()
    if (result.status === 'displayable') {
      demoBundle.value = result.bundle
      demoState.value = 'ready'
    } else {
      resetDemoState()
    }
  } catch {
    // 保持现有 ready 展示，不因后台失败清空
  }
}

onShow(() => {
  now.value = new Date()
  if (!isLoggedIn.value) {
    loading.value = false
    error.value = false
    trips.value = []
    total.value = 0
    return
  }
  const shouldRefresh = uni.getStorageSync(TRIP_LIST_DIRTY_KEY)
  if (shouldRefresh) {
    uni.removeStorageSync(TRIP_LIST_DIRTY_KEY)
    keyword.value = ''
  }
  const mode: FetchMode = trips.value.length > 0 && !shouldRefresh ? 'silent' : 'full'
  Promise.allSettled([
    userStore.fetchUserInfo(),
    fetchTrips({ mode })
  ])
})

onPullDownRefresh(async () => {
  if (!isLoggedIn.value) {
    uni.stopPullDownRefresh()
    return
  }
  try {
    await Promise.allSettled([
      userStore.fetchUserInfo(),
      fetchTrips({ mode: 'refresh' })
    ])
  } finally {
    uni.stopPullDownRefresh()
  }
})

const onSearch = () => {
  fetchTrips({ mode: trips.value.length ? 'silent' : 'full' })
}

// --- Navigation & actions ---

/**
 * 「查看全部」→ 独立全部旅程列表页
 * 搜索态会把 keyword 带过去，列表页继续用 GET /trips 筛选
 */
const onViewAllTrips = async () => {
  const ok = await requireLogin({
    title: '登录后查看全部旅程',
    content: '查看全部旅程需要登录'
  })
  if (!ok) return
  const q = keyword.value.trim()
  const url = q
    ? `/pages/trip/list?keyword=${encodeURIComponent(q)}`
    : '/pages/trip/list'
  uni.navigateTo({ url })
}

const goToDetail = async (trip: { id: string }) => {
  const ok = await requireLogin({
    title: '登录后查看旅程',
    content: '查看旅程详情需要登录'
  })
  if (!ok) return
  uni.navigateTo({ url: `/pages/trip/detail?id=${trip.id}` })
}

const clearSearch = () => {
  keyword.value = ''
  homeHeaderRef.value?.closeSearch()
  fetchTrips({ mode: 'full' })
}

/** 进入示例旅程详情（独立路由，不触发业务接口） */
const goToDemo = () => {
  uni.navigateTo({ url: '/pages/trip/demo' })
}

const onTabChange = (key: string) => {
  if (key === 'profile') {
    uni.switchTab({ url: '/pages/profile/index' })
  }
}
</script>

<style scoped>
.home-hero {
  background:
    linear-gradient(135deg, rgba(251, 250, 246, 0.96), rgba(255, 255, 255, 0.98)),
    linear-gradient(180deg, rgba(79, 125, 255, 0.1), rgba(245, 230, 211, 0.08));
}

.section-heading {
  padding-top: 2px;
}

/* 扩大点击热区（≥ 约 44pt 高），用 padding 避免负 margin 超出父级裁剪 */
.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 8px;
  box-sizing: border-box;
}

.view-all-btn--active {
  opacity: 0.65;
}

.view-all-btn__text {
  font-size: 12px;
  font-weight: 500;
  color: #4f7dff; /* brand */
}

.trip-group {
  margin-bottom: 4px;
}

.trip-group__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 2px 10px;
}

.trip-group__title {
  font-size: 13px;
  font-weight: 600;
  /* textMutedStrong: #6E655C */
  color: #6E655C;
  letter-spacing: 0.02em;
}

.trip-group__count {
  font-size: 12px;
  font-weight: 500;
  /* textMutedStrong: #6E655C */
  color: #6E655C;
}

.card-enter {
  opacity: 0;
  transform: translateY(12px);
  animation: card-fade-up 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes card-fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-enter {
    opacity: 1;
    transform: none;
    animation: none;
  }
}

</style>
