<template>
  <view class="min-h-screen bg-warm-bg">
    <TracciPageHeader
      title="全部旅程"
      :subtitle="headerSubtitle"
      @back="onBack"
    />

    <!-- 搜索 + 状态筛选（对接 GET /trips: keyword / status） -->
    <view class="list-toolbar px-5 pt-3 pb-2 bg-warm-bg">
      <view class="search-bar">
        <view class="i-carbon-search search-bar__icon" aria-hidden="true" />
        <input
          v-model="keyword"
          class="search-bar__input"
          type="text"
          confirm-type="search"
          placeholder="搜索旅程名称"
          aria-label="搜索旅程名称"
          @confirm="onSearchConfirm"
          @blur="onSearchConfirm"
        />
        <view
          v-if="keyword"
          class="search-bar__clear"
          role="button"
          aria-label="清空搜索"
          @click="clearKeyword"
        >
          <view class="i-carbon-close-filled search-bar__clear-icon" />
        </view>
      </view>

      <scroll-view scroll-x class="status-scroll" :show-scrollbar="false">
        <view class="status-row">
          <view
            v-for="tab in statusTabs"
            :key="tab.value || 'all'"
            class="status-chip"
            :class="{ 'status-chip--active': statusFilter === tab.value }"
            role="button"
            :aria-label="tab.label"
            :aria-pressed="statusFilter === tab.value ? 'true' : 'false'"
            @click="onStatusChange(tab.value)"
          >
            <text class="status-chip__text">{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="px-5 pt-2 pb-8">
      <!-- Loading -->
      <view v-if="loading && trips.length === 0">
        <TripCardSkeleton v-for="i in 4" :key="i" />
      </view>

      <!-- Error -->
      <TracciError
        v-else-if="error && trips.length === 0"
        title="加载失败"
        message="无法获取旅程列表，请检查网络后重试"
        @retry="() => fetchTrips({ mode: 'full' })"
      />

      <!-- List -->
      <view v-else-if="trips.length > 0">
        <TripCard
          v-for="trip in trips"
          :key="trip.id"
          :trip="trip"
          @click="goToDetail"
        />

        <view v-if="loadingMore" class="list-footer">
          <text class="list-footer__text">加载更多…</text>
        </view>
        <view v-else-if="!hasMore && trips.length >= PAGE_SIZE" class="list-footer">
          <text class="list-footer__text">已经到底了</text>
        </view>
      </view>

      <!-- Empty: search / filter -->
      <view v-else-if="keyword.trim() || statusFilter" class="empty-state">
        <view class="empty-state__icon-wrap">
          <view class="i-carbon-search empty-state__icon" />
        </view>
        <text class="empty-state__title">未找到相关旅程</text>
        <text class="empty-state__desc">
          <template v-if="keyword.trim()">
            没有匹配「{{ keyword.trim() }}」的结果
          </template>
          <template v-else>
            当前筛选下暂无旅程
          </template>
        </text>
        <view
          class="empty-state__action"
          role="button"
          aria-label="清除筛选"
          @click="resetFilters"
        >
          <text class="empty-state__action-text">清除筛选</text>
        </view>
      </view>

      <!-- Empty: no trips at all -->
      <view v-else class="empty-state">
        <view class="empty-state__icon-wrap">
          <view class="i-carbon-map empty-state__icon" />
        </view>
        <text class="empty-state__title">还没有旅程</text>
        <text class="empty-state__desc">创建新旅程，或通过邀请码加入同伴的行程</text>
        <view
          class="empty-state__primary"
          role="button"
          aria-label="创建旅程"
          @click="goCreate"
        >
          <view class="i-carbon-add empty-state__primary-icon" />
          <text class="empty-state__primary-text">创建旅程</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import TracciPageHeader from '@/components/common/TracciPageHeader.vue'
import TripCard from '@/components/common/TripCard.vue'
import TripCardSkeleton from '@/components/common/TripCardSkeleton.vue'
import TracciError from '@/components/common/TracciError.vue'
import { TripService } from '@/services/trip'
import { useUserStore } from '@/stores/user'
import { guardProtectedPage } from '@/utils/guestAuth'
import { TRIP_LIST_DIRTY_KEY } from '@/constants/storageKeys'
import type { Trip, TripStatus } from '@/types/trip'

const PAGE_SIZE = 20

type FetchMode = 'full' | 'silent' | 'refresh' | 'more'
type StatusFilter = '' | TripStatus

interface StatusTab {
  value: StatusFilter
  label: string
}

const statusTabs: StatusTab[] = [
  { value: '', label: '全部' },
  { value: 'ongoing', label: '进行中' },
  { value: 'planning', label: '计划中' },
  { value: 'completed', label: '已完成' }
]

const userStore = useUserStore()
const trips = ref<Trip[]>([])
const keyword = ref('')
const statusFilter = ref<StatusFilter>('')
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(false)
const page = ref(1)
const total = ref(0)
let fetchSeq = 0
/** 避免搜索 blur/confirm 重复触发 */
let lastQueryKey = ''
/** 首页带入的 keyword，首次 onShow 用完后清除，避免覆盖用户后续清空 */
let pendingKeywordFromRoute: string | null = null
let initialRouteApplied = false

const hasMore = computed(() => trips.value.length < total.value)

const headerSubtitle = computed(() => {
  if (loading.value && trips.value.length === 0) return ''
  if (keyword.value.trim()) {
    return total.value > 0 ? `${total.value} 个结果` : ''
  }
  if (total.value > 0) return `共 ${total.value} 段`
  return ''
})

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

const mergeTrips = (existing: Trip[], incoming: Trip[]) => {
  const map = new Map<string, Trip>()
  for (const t of existing) map.set(t.id, t)
  for (const t of incoming) map.set(t.id, t)
  return sortTrips(Array.from(map.values()))
}

const buildQueryKey = (targetPage: number) =>
  `${statusFilter.value}|${keyword.value.trim()}|${targetPage}`

const fetchTrips = async (options?: {
  page?: number
  append?: boolean
  mode?: FetchMode
}) => {
  if (!userStore.isLogin()) {
    loading.value = false
    loadingMore.value = false
    error.value = false
    trips.value = []
    total.value = 0
    page.value = 1
    return
  }

  const targetPage = options?.page ?? 1
  const append = options?.append ?? false
  const mode = options?.mode ?? 'full'
  const seq = ++fetchSeq
  const queryKey = buildQueryKey(targetPage)

  try {
    if (mode === 'full') loading.value = true
    if (mode === 'more') loadingMore.value = true
    error.value = false

    const query = keyword.value.trim()
    const res = await TripService.getTripList({
      page: targetPage,
      pageSize: PAGE_SIZE,
      keyword: query || undefined,
      status: statusFilter.value || undefined
    })

    if (seq !== fetchSeq) return

    const list = res.list || []
    total.value = typeof res.total === 'number' ? res.total : list.length
    page.value = targetPage
    lastQueryKey = queryKey

    if (append) {
      trips.value = mergeTrips(trips.value, list)
    } else {
      trips.value = sortTrips(list)
    }
  } catch (err) {
    if (seq !== fetchSeq) return
    console.error('Fetch all trips failed:', err)
    if (!append) {
      error.value = true
    } else {
      uni.showToast({ title: '加载更多失败', icon: 'none' })
    }
  } finally {
    if (seq === fetchSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

onLoad((options) => {
  const raw = options?.keyword
  if (raw != null && String(raw).trim()) {
    try {
      pendingKeywordFromRoute = decodeURIComponent(String(raw)).trim()
    } catch {
      pendingKeywordFromRoute = String(raw).trim()
    }
  }
})

onShow(() => {
  if (!guardProtectedPage()) return

  if (!initialRouteApplied && pendingKeywordFromRoute) {
    keyword.value = pendingKeywordFromRoute
    pendingKeywordFromRoute = null
    initialRouteApplied = true
    fetchTrips({ page: 1, mode: 'full' })
    return
  }
  initialRouteApplied = true

  const shouldRefresh = uni.getStorageSync(TRIP_LIST_DIRTY_KEY)
  if (shouldRefresh) {
    uni.removeStorageSync(TRIP_LIST_DIRTY_KEY)
  }

  const mode: FetchMode =
    trips.value.length > 0 && !shouldRefresh ? 'silent' : 'full'
  fetchTrips({ page: 1, mode })
})

onPullDownRefresh(async () => {
  try {
    await fetchTrips({ page: 1, mode: 'refresh' })
  } finally {
    uni.stopPullDownRefresh()
  }
})

onReachBottom(() => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  fetchTrips({ page: page.value + 1, append: true, mode: 'more' })
})

const onStatusChange = (value: StatusFilter) => {
  if (statusFilter.value === value) return
  statusFilter.value = value
  fetchTrips({ page: 1, mode: trips.value.length ? 'silent' : 'full' })
}

const onSearchConfirm = () => {
  const key = buildQueryKey(1)
  // 与当前已成功请求一致时跳过（避免 blur+confirm 双触发）
  if (key === lastQueryKey && !error.value) return
  fetchTrips({ page: 1, mode: trips.value.length ? 'silent' : 'full' })
}

const clearKeyword = () => {
  if (!keyword.value) return
  keyword.value = ''
  fetchTrips({ page: 1, mode: 'full' })
}

const resetFilters = () => {
  keyword.value = ''
  statusFilter.value = ''
  fetchTrips({ page: 1, mode: 'full' })
}

const goToDetail = (trip: { id: string }) => {
  uni.navigateTo({ url: `/pages/trip/detail?id=${trip.id}` })
}

const goCreate = () => {
  uni.navigateTo({ url: '/pages/trip/create' })
}

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}
</script>

<style scoped>
.list-toolbar {
  border-bottom: 1px solid rgba(237, 232, 226, 0.9);
}

.search-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.06);
  border: 1px solid rgba(232, 228, 222, 0.6);
  margin-bottom: 12px;
}

.search-bar__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #6e655c;
}

.search-bar__input {
  flex: 1;
  height: 40px;
  min-width: 0;
  margin-left: 8px;
  font-size: 14px;
  color: #2f2a25;
  background: transparent;
}

.search-bar__clear {
  width: 36px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: -6px;
}

.search-bar__clear:active {
  opacity: 0.7;
}

.search-bar__clear-icon {
  width: 16px;
  height: 16px;
  color: #6e655c;
}

.status-scroll {
  width: 100%;
  white-space: nowrap;
}

.status-row {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(232, 228, 222, 0.85);
  flex-shrink: 0;
}

.status-chip--active {
  background: rgba(79, 125, 255, 0.12);
  border-color: rgba(79, 125, 255, 0.35);
}

.status-chip:active {
  opacity: 0.85;
}

.status-chip__text {
  font-size: 13px;
  font-weight: 500;
  color: #6e655c;
  line-height: 1;
}

.status-chip--active .status-chip__text {
  color: #4f7dff;
  font-weight: 600;
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0 8px;
}

.list-footer__text {
  font-size: 12px;
  color: #6e655c;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 16px 24px;
}

.empty-state__icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #faf8f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-state__icon {
  font-size: 24px;
  color: #6e655c;
}

.empty-state__title {
  font-size: 16px;
  font-weight: 600;
  color: #2f2a25;
  margin-bottom: 6px;
}

.empty-state__desc {
  font-size: 13px;
  color: #6e655c;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 20px;
  max-width: 280px;
}

.empty-state__action {
  height: 40px;
  padding: 0 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(79, 125, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state__action:active {
  opacity: 0.8;
}

.empty-state__action-text {
  font-size: 13px;
  font-weight: 500;
  color: #4f7dff;
}

.empty-state__primary {
  height: 44px;
  padding: 0 24px;
  border-radius: 14px;
  background: #4f7dff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 125, 255, 0.28);
}

.empty-state__primary:active {
  opacity: 0.9;
}

.empty-state__primary-icon {
  font-size: 16px;
  color: #ffffff;
  margin-right: 4px;
}

.empty-state__primary-text {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}
</style>
