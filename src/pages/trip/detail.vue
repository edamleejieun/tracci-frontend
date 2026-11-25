<template>
  <view class="min-h-screen bg-background pb-safe relative">
    <!-- 沉浸式 Header -->
    <TripDetailHeader
      :nav-padding-top="navPaddingTop"
      :cover-photo="trip?.coverPhoto"
      :loading="loadingTrip"
      :error="tripError"
      :error-title="tripErrorTitle"
      :error-message="tripErrorMessage"
      :title="trip?.title"
      :destination-display="tripDestinationDisplayName"
      :date-range-text="tripDateRangeText"
      :total-days="trip?.totalDays"
      :status="trip?.status"
      :current-day="tripCurrentDay"
      :show-actions="!isSharedViewer"
      :member-count="memberCount"
      :can-share="canManageShare || canInvite"
      :can-edit="canUpdateTrip"
      @back="onBack"
      @members="onGoToMembers"
      @share="onShareTrip"
      @settings="onEditTrip"
    />

    <!-- 玻璃数据概览（共享查看者隐藏，成员可见） -->
    <TripStatsOverviewCard
      v-if="trip && !tripError && !loadingTrip && !isSharedViewer"
      :total-cny="trip.totalCny"
      :node-count="trip.nodeCount || 0"
      :journal-count="trip.journalCount || 0"
      :has-group-expenses="hasGroupExpenses"
      @show-settlement="onShowSettlement"
    />

    <!-- 出行天气模块（共享查看者隐藏，成员可见） -->
    <TripWeatherSection
      v-if="trip && !tripError && !loadingTrip && !isSharedViewer"
      :trip-id="tripId"
      :start-date="trip.startDate"
      :end-date="trip.endDate"
      :trip-has-edit-permission="canWriteContent"
      @edit-trip="onEditTrip"
    />

    <!-- 内容区 -->
    <template v-if="!tripError && !loadingTrip && trip">
      <view class="detail-body px-5 pt-6 pb-8">
        <!-- 加载态 -->
        <TracciLoading v-if="loadingItinerary" text="加载行程中..." />

        <!-- 错误态 -->
        <TracciError
          v-else-if="itineraryError"
          title="加载行程失败"
          message="无法获取行程数据，请重试"
          @retry="loadTripPage()"
        />

        <!-- 无行程天 -->
        <view v-else-if="itineraryDays.length === 0" class="py-12 text-center">
          <view class="w-20 h-20 mx-auto mb-4 rounded-full bg-warm-surface flex-center">
            <view class="i-carbon-map text-3xl text-disabled" />
          </view>
          <text class="text-base font-medium text-primary block mb-2">暂无行程数据</text>
          <text class="text-sm text-muted block leading-relaxed">
            确认旅行日期后即可开始添加行程
          </text>
        </view>

        <!-- 日期范围 + 当日内容 Tab -->
        <template v-else>
          <view class="trip-workspace-sticky">
            <scroll-view
              scroll-x
              enable-flex
              class="whitespace-nowrap"
              :show-scrollbar="false"
            >
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
                  <view
                    v-if="isTodayDay(day)"
                    class="w-1.5 h-1.5 rounded-full bg-brand"
                  />
                </view>
              </view>
            </scroll-view>

            <TripDetailContentTabs
              v-if="!isSharedViewer"
              v-model="selectedContentTab"
            />
          </view>

          <!-- 选中天的内容 -->
          <view
            v-if="selectedDay"
            :key="`${selectedDayId}-${selectedContentTab}`"
            class="tab-fade-in"
          >
            <DayTabContent
              :day="selectedDay"
              :active-tab="selectedContentTab"
              :expenses="dayExpenses"
              :journals="dayJournals"
              :loading-expenses="loadingExpenses"
              :loading-journals="loadingJournals"
              :trip-status="trip?.status"
              :readonly="isReadonly"
              @add-node="onAddNode"
              @edit-node="onEditNode"
              @delete-node="onDeleteNode"
              @move-up="onMoveNodeUp"
              @move-down="onMoveNodeDown"
              @add-expense="onAddExpense(selectedDay?.date)"
              @edit-expense="onEditExpense"
              @delete-expense="onDeleteExpense"
              @add-journal="onAddJournal(selectedDay?.date)"
              @edit-journal="onEditJournal"
              @delete-journal="onDeleteJournal"
              @toggle-highlight="onToggleJournalHighlight"
              @preview-journal="onPreviewJournalPhotos"
            />

            <!-- 共享查看者登录引导 -->
            <view v-if="isSharedViewer" class="mt-6 mb-2">
              <GuestLoginPrompt
                icon="i-carbon-user-avatar"
                title="登录后开启你的旅程"
                description="登录后即可创建自己的旅程，记录每一站行程与开支。"
                hint="当前为分享查看模式，仅可浏览行程安排"
              />
            </view>
          </view>
        </template>
      </view>
    </template>

    <!-- 错误态内容区 -->
    <view v-else-if="tripError && !loadingTrip" class="px-5 py-8">
      <TracciError
        :title="tripErrorTitle"
        :message="tripErrorMessage"
        :retry-text="isSharedViewer ? '去登录' : '返回首页'"
        @retry="isSharedViewer ? navigateToLogin() : onBack()"
      />
      <view v-if="isSharedViewer" class="mt-6">
        <GuestLoginPrompt
          icon="i-carbon-map"
          title="登录后查看好友旅程"
          description="登录后即可查看好友分享的完整旅程，并创建你自己的旅行记录。"
          hint="当前为分享查看模式，需要登录后才能查看"
        />
      </view>
    </view>

    <WechatPrivacyPopup />
    <TripShareSheet v-model="showShareSheet" :trip-id="tripId" />

    <!-- 邀请弹层 -->
    <InviteSheet
      v-model="showInviteSheet"
      :trip-id="tripId"
    />

    <!-- AA 结算弹层 -->
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
        <SettlementView ref="settlementRef" :trip-id="tripId" />
      </scroll-view>
    </TracciBottomSheet>

    <canvas
      :canvas-id="tripShareCanvasId"
      :id="tripShareCanvasId"
      class="trip-share-canvas"
      :style="{ width: '500px', height: '400px' }"
      :width="500"
      :height="400"
    />

    <!-- 开支编辑弹层 -->
    <ExpenseBottomSheet
      v-model="expenseSheetVisible"
      :loading="expenseSubmitting"
      :initial-data="expenseEditData"
      :members="members"
      :current-member-id="currentMemberId"
      :default-date="expenseDefaultDate"
      @save="onSaveExpense"
    />

    <!-- 日志编辑弹层 -->
    <JournalEditSheet
      v-model="journalSheetVisible"
      :loading="journalSaving"
      :initial-data="journalEditData"
      :trip-id="tripId"
      :default-date="journalDefaultDate"
      :is-collaborative="memberCount > 1"
      @save="onSaveJournal"
    />

    <!-- 悬浮新建按钮 -->
    <TracciFAB
      v-if="trip && !tripError && !loadingTrip && !isReadonly && !showInviteSheet"
      :actions="fabActions"
      @action="onFabAction"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, getCurrentInstance } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import { buildDefaultShareAppMessage, buildTripShareAppMessage } from '@/utils/wechatShare'
import {
  renderTripShareCardImage,
  TRIP_SHARE_CANVAS_ID
} from '@/utils/tripShareCanvas'
import TracciLoading from '@/components/common/TracciLoading.vue'
import TracciError from '@/components/common/TracciError.vue'
import GuestLoginPrompt from '@/components/common/GuestLoginPrompt.vue'
import WechatPrivacyPopup from '@/components/privacy/WechatPrivacyPopup.vue'
import TripDetailHeader from './components/TripDetailHeader.vue'
import TripStatsOverviewCard from './components/TripStatsOverviewCard.vue'
import DayTabContent from './components/DayTabContent.vue'
import TripDetailContentTabs from './components/TripDetailContentTabs.vue'
import ExpenseBottomSheet from './components/expense/ExpenseBottomSheet.vue'
import JournalEditSheet from './components/journal/JournalEditSheet.vue'
import TripWeatherSection from './components/weather/TripWeatherSection.vue'
import TripShareSheet from './components/TripShareSheet.vue'
import InviteSheet from './components/InviteSheet.vue'
import TracciFAB from '@/components/common/TracciFAB.vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import SettlementView from './components/SettlementView.vue'
import type { FabAction } from '@/components/common/TracciFAB.vue'
import { TripService } from '@/services/trip'
import { ItineraryService } from '@/services/itinerary'
import { ExpenseService } from '@/services/expense'
import { JournalService } from '@/services/journal'
import { FileService } from '@/services/file'
import { CollaborationService } from '@/services/collaboration'
import { formatDateRangeShort } from '@/utils/format'
import { getTripDestinationDisplayName } from '@/utils/destination'
import { HttpError } from '@/utils/http'
import { guardProtectedPage, navigateToLogin } from '@/utils/guestAuth'
import { useUserStore } from '@/stores/user'
import {
  formatItineraryDayDate,
  formatItineraryWeekday
} from '@/utils/itineraryStatus'
import { utcToLocalDate } from '@/utils/timezone'
import {
  enrichJournalPhotoWithAccessUrl,
  normalizeJournalPhotos,
  normalizeTravelLogPhotos
} from '@/utils/journalPhoto'
import { getImageDisplayUrlCandidates, resolveImageSrcFromCandidates } from '@/utils/image'
import { getNodeDisplayName } from '@/utils/nodeLocation'
import type { Trip, TripPermission } from '@/types/trip'
import type { TripDay, ItineraryNode } from '@/types/itinerary'
import { isHotelStayPrimary, isHotelStayProjection } from '@/types/itinerary'
import type { ExpenseItem, CreateExpenseRequest } from '@/types/expense'
import { isGroupExpenseScope } from '@/types/expense'
import type { TravelLogItem, CreateTravelLogRequest, UpdateTravelLogRequest } from '@/types/journal'
import type { JournalPhotoItem } from '@/types/file'
import type { TripMember } from '@/types/collaboration'

// ── 系统尺寸 ──
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

const instance = getCurrentInstance()
const userStore = useUserStore()
const tripShareCanvasId = TRIP_SHARE_CANVAS_ID

// ── 日期工具 ──
const formatDayDate = formatItineraryDayDate
const formatWeekday = formatItineraryWeekday
type TripDetailContentTab = 'itinerary' | 'journal' | 'expense'

const isTodayDay = (day: TripDay) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayStart = new Date(day.date.replace(/-/g, '/'))
  dayStart.setHours(0, 0, 0, 0)
  return dayStart.getTime() === today.getTime()
}

// ── 行程数据 ──
const tripId = ref('')
const trip = ref<Trip | null>(null)
const tripShareImageUrl = ref('')
const tripShareImageKey = ref('')

/** 是否为分享查看者（只读、只看行程） */
const isSharedViewer = ref(false)

// ── 成员与协作 ──
const members = ref<TripMember[]>([])
const memberCount = ref(0)
const showInviteSheet = ref(false)
const showSettlementSheet = ref(false)
const settlementRef = ref<InstanceType<typeof SettlementView> | null>(null)

/** 是否存在群组支出 */
const hasGroupExpenses = computed(() =>
  expenses.value.some(e => isGroupExpenseScope(e.expenseScope))
)

const hasPermission = (permission: TripPermission) =>
  trip.value?.access?.permissions.includes(permission) ?? false

const canWriteContent = computed(() => hasPermission('trip.content.edit'))
const canUpdateTrip = computed(() => hasPermission('trip.update'))
const canInvite = computed(() => hasPermission('trip.invitation.create'))
const canManageShare = computed(() => hasPermission('trip.share.manage'))

/** 当前用户在成员列表中的 memberId */
const currentMemberId = computed(() => {
  if (!userStore.userInfo?.id || members.value.length === 0) return undefined
  const member = members.value.find(m => m.userId === userStore.userInfo!.id)
  return member?.id
})

/** 是否只读（查看者） */
const isReadonly = computed(() => {
  return isSharedViewer.value || !canWriteContent.value
})

useWechatShare({
  getShareAppMessage: () => {
    if (trip.value && tripId.value) {
      return buildTripShareAppMessage({
        id: tripId.value,
        title: trip.value.title,
        coverPhoto: trip.value.coverPhoto,
        imageUrl: tripShareImageUrl.value
      })
    }
    if (tripId.value) {
      return buildTripShareAppMessage({ id: tripId.value, title: '我的旅行' })
    }
    return buildDefaultShareAppMessage()
  }
})

const loadingTrip = ref(true)
const tripError = ref(false)
const tripErrorTitle = ref('旅行加载失败')
const tripErrorMessage = ref('暂时无法加载这次旅行，请稍后重试。')
const showShareSheet = ref(false)

const tripDateRangeText = computed(() => {
  if (!trip.value) return ''
  return formatDateRangeShort(trip.value.startDate, trip.value.endDate)
})

const tripDestinationDisplayName = computed(() => {
  if (!trip.value) return ''
  return getTripDestinationDisplayName(trip.value)
})

const tripCurrentDay = computed(() => {
  if (!trip.value?.startDate || trip.value.status !== 'ongoing') return 1
  const start = new Date(trip.value.startDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, Math.min(diff, trip.value.totalDays || diff))
})

// ── 行程天 ──
const itineraryDays = ref<TripDay[]>([])
const loadingItinerary = ref(true)
const itineraryError = ref(false)
const selectedDayId = ref('')
const selectedContentTab = ref<TripDetailContentTab>('itinerary')

const selectedDay = computed(() =>
  itineraryDays.value.find(d => d.id === selectedDayId.value) ?? null
)

const pickInitialDayId = (): string => {
  if (itineraryDays.value.length === 0) return ''
  // 优先选中今天（若今天在旅程范围内）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const byDate = itineraryDays.value.find(d => d.date === todayStr)
  if (byDate) return byDate.id
  // 回退到旅程当前天
  if (tripCurrentDay.value) {
    const match = itineraryDays.value.find(d => d.dayIndex === tripCurrentDay.value)
    if (match) return match.id
  }
  return itineraryDays.value[0].id
}

watch(
  () => itineraryDays.value,
  days => {
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

// ── 开支数据 ──
const expenses = ref<ExpenseItem[]>([])
const loadingExpenses = ref(false)

const dayExpenses = computed(() => {
  if (!selectedDay.value) return []
  return expenses.value.filter(e => {
    if (!e.spentAt) return false
    return utcToLocalDate(e.spentAt) === selectedDay.value!.date
  })
})

// ── 日志数据 ──
const journals = ref<TravelLogItem[]>([])
const loadingJournals = ref(false)

const dayJournals = computed(() => {
  if (!selectedDay.value) return []
  return journals.value.filter(j => {
    if (!j.occurredAt) return false
    return utcToLocalDate(j.occurredAt) === selectedDay.value!.date
  })
})

// ── 开支弹层 ──
const expenseSheetVisible = ref(false)
const expenseSubmitting = ref(false)
const expenseEditData = ref<ExpenseItem | null>(null)
const expenseDefaultDate = ref<string>()

// ── 日志弹层 ──
const journalSheetVisible = ref(false)
const journalSaving = ref(false)
const journalEditData = ref<TravelLogItem | null>(null)
const journalDefaultDate = ref<string>()

// ── FAB 动作 ──
const fabActions: FabAction[] = [
  { key: 'itinerary', icon: 'i-carbon-map', label: '行程', iconBg: 'bg-brand/10', iconColor: 'text-brand' },
  { key: 'expense', icon: 'i-carbon-wallet', label: '开支', iconBg: 'bg-featured/10', iconColor: 'text-featured' },
  { key: 'journal', icon: 'i-carbon-notebook', label: '日志', iconBg: 'bg-success/10', iconColor: 'text-success' },
]

// ── 数据加载 ──
onLoad(options => {
  if (options?.id) tripId.value = options.id
  if (options?.visitor === 'guest') isSharedViewer.value = true
})

onShow(() => {
  if (!isSharedViewer.value && !guardProtectedPage()) return
  if (tripId.value) {
    loadTripPage(!!trip.value)
  } else {
    tripError.value = true
    tripErrorTitle.value = '缺少旅行信息'
    tripErrorMessage.value = '没有找到要查看的旅行。'
    loadingTrip.value = false
    loadingItinerary.value = false
  }
})

const onDataChanged = () => {
  fetchTripDetail()
}

const loadTripPage = async (silent = false) => {
  const ok = await fetchTripDetail(silent)
  if (ok) {
    const tasks = [fetchItinerary(silent)]
    // 共享查看者不需要加载开支和日志
    if (!isSharedViewer.value) {
      tasks.push(fetchExpenses(silent), fetchJournals(silent), fetchMembers())
    }
    await Promise.all(tasks)
  } else if (!silent) {
    itineraryDays.value = []
    loadingItinerary.value = false
  }
}

const fetchMembers = async () => {
  try {
    members.value = await CollaborationService.getMembers(tripId.value)
    memberCount.value = members.value.length
  } catch (err) {
    console.error('Fetch members failed:', err)
    // 成员列表仅用于展示和 AA 成员选择，失败时保留旧数据；权限始终来自 trip.access。
  }
}

// ── 结算 ──
const onShowSettlement = () => {
  showSettlementSheet.value = true
  setTimeout(() => {
    settlementRef.value?.fetchSettlement()
  }, 100)
}

// ── 导航 ──
const onBack = () => {
  // 共享查看者统一返回首页（游客模式）
  if (isSharedViewer.value) {
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const onGoToMembers = () => {
  uni.navigateTo({
    url: `/pages/trip/members?tripId=${tripId.value}`
  })
}

const onEditTrip = () => {
  if (!trip.value) return
  if (!canUpdateTrip.value) {
    uni.showToast({ title: '你没有修改旅行信息的权限', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/trip/create?id=${trip.value.id}` })
}

const onShareTrip = () => {
  if (!trip.value) return
  const itemList = [
    ...(canManageShare.value ? ['分享旅程'] : []),
    ...(canInvite.value ? ['邀请好友'] : [])
  ]
  if (itemList.length === 0) {
    uni.showToast({ title: '你没有分享或邀请权限', icon: 'none' })
    return
  }
  uni.showActionSheet({
    itemList,
    success: (res) => {
      const selectedAction = itemList[res.tapIndex]
      if (selectedAction === '分享旅程') {
        void prepareTripShareImage()
        showShareSheet.value = true
      } else if (selectedAction === '邀请好友') {
        showInviteSheet.value = true
      }
    }
  })
}

const prepareTripShareImage = async () => {
  // #ifndef MP-WEIXIN
  return
  // #endif

  if (!trip.value) return
  const key = `${trip.value.id}:${trip.value.title}:${trip.value.coverPhoto?.fileId || ''}`
  if (tripShareImageUrl.value && tripShareImageKey.value === key) return
  tripShareImageKey.value = key
  try {
    tripShareImageUrl.value = await renderTripShareCardImage(
      {
        title: trip.value.title,
        coverPhoto: trip.value.coverPhoto
      },
      instance?.proxy as WechatMiniprogram.Page.TrivialInstance | undefined
    )
  } catch (error) {
    console.warn('[tripShare] prepare share image failed', error)
    tripShareImageUrl.value = ''
    tripShareImageKey.value = ''
  }
}

// ── API 调用 ──
const fetchTripDetail = async (silent = false) => {
  try {
    if (!silent) loadingTrip.value = true
    tripError.value = false
    trip.value = await TripService.getTripDetail(tripId.value, {
      noAuth: isSharedViewer.value
    })
    void prepareTripShareImage()
    return true
  } catch (error) {
    console.error('Fetch trip detail failed:', error)
    trip.value = null
    tripError.value = true
    if (error instanceof HttpError && (error.code === 40301 || error.statusCode === 403)) {
      if (isSharedViewer.value) {
        tripErrorTitle.value = '需要登录查看'
        tripErrorMessage.value = '登录后即可查看好友分享的旅程。'
      } else {
        tripErrorTitle.value = '无权限访问'
        tripErrorMessage.value = '你没有权限查看这次旅行。'
      }
    } else if (error instanceof HttpError && (error.code === 40401 || error.statusCode === 404)) {
      tripErrorTitle.value = '旅行不存在'
      tripErrorMessage.value = '这次旅行不存在，可能已被删除。'
    } else {
      tripErrorTitle.value = '旅行加载失败'
      tripErrorMessage.value = '暂时无法加载这次旅行，请稍后重试。'
    }
    return false
  } finally {
    if (!silent) loadingTrip.value = false
  }
}

const fetchItinerary = async (silent = false) => {
  try {
    if (!silent) loadingItinerary.value = true
    itineraryError.value = false
    const res = await ItineraryService.getItinerary(tripId.value, {
      noAuth: isSharedViewer.value
    })
    itineraryDays.value = (res.days || []).sort((a, b) => a.dayIndex - b.dayIndex)
  } catch (error) {
    console.error('Fetch itinerary failed:', error)
    itineraryError.value = true
  } finally {
    if (!silent) loadingItinerary.value = false
  }
}

const fetchExpenses = async (silent = false) => {
  try {
    if (!silent) loadingExpenses.value = true
    const res = await ExpenseService.getExpenses(tripId.value, { pageSize: 500 })
    expenses.value = res.list || []
  } catch (error) {
    console.error('Fetch expenses failed:', error)
  } finally {
    if (!silent) loadingExpenses.value = false
  }
}

const fetchJournals = async (silent = false) => {
  try {
    if (!silent) loadingJournals.value = true
    const res = await JournalService.getJournals(tripId.value)
    const sorted = (res.list || []).sort((a: TravelLogItem, b: TravelLogItem) => {
      const ta = (a.occurredAt || '').replace('Z', '')
      const tb = (b.occurredAt || '').replace('Z', '')
      return tb.localeCompare(ta)
    })
    journals.value = await enrichJournalPhotos(sorted)
  } catch (error) {
    console.error('Fetch journals failed:', error)
  } finally {
    if (!silent) loadingJournals.value = false
  }
}

const enrichJournalPhotos = async (logs: TravelLogItem[]): Promise<TravelLogItem[]> => {
  return Promise.all(
    logs.map(async log => {
      const photos = normalizeJournalPhotos(log.photos)
      if (!photos.length) return { ...log, photos: undefined }
      const enriched = await Promise.all(
        photos.map(p => enrichJournalPhotoWithAccessUrl(p, fid => FileService.getAccessUrl(fid)))
      )
      return { ...log, photos: enriched }
    })
  )
}

// ── 行程节点操作 ──
const onAddNode = () => {
  if (!selectedDay.value) return
  uni.navigateTo({
    url: `/pages/itinerary/node-edit?tripId=${tripId.value}&dayId=${selectedDay.value.id}`
  })
}

const onEditNode = (node: ItineraryNode) => {
  if (!selectedDay.value) return
  uni.setStorageSync('edit_node_data', node)
  uni.navigateTo({
    url: `/pages/itinerary/node-edit?tripId=${tripId.value}&dayId=${selectedDay.value.id}&nodeId=${node.id}`
  })
}

const onDeleteNode = (node: ItineraryNode) => {
  if (!selectedDay.value) return
  // 中间夜投影：不可单独删除
  if (isHotelStayProjection(node)) {
    uni.showModal({
      title: '无法单独删除当晚住宿',
      content: '中间夜住宿由连住生成，请打开编辑修改离店日期；或从入住日删除整段住宿。',
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
  const isPrimary = isHotelStayPrimary(node)
  const nights = node.details?.totalNights
  uni.showModal({
    title: isPrimary ? '删除整段住宿？' : '删除行程节点',
    content: isPrimary
      ? nights && nights > 1
        ? `将删除全部 ${nights} 晚住宿记录，删除后无法恢复。`
        : '将删除该段住宿，删除后无法恢复。'
      : `确定要删除「${getNodeDisplayName(node)}」吗？`,
    confirmColor: '#EF4444',
    confirmText: isPrimary ? '删除整段' : '删除',
    success: async res => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '删除中...' })
        await ItineraryService.deleteItineraryNode(tripId.value, selectedDay.value!.id, node.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchItinerary(true)
        onDataChanged()
      } catch (error) {
        console.error('Delete node failed:', error)
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const onMoveNodeUp = async (node: ItineraryNode, index: number) => {
  if (!selectedDay.value || index === 0) return
  const newNodes = [...selectedDay.value.nodes]
  const temp = newNodes[index - 1]
  newNodes[index - 1] = newNodes[index]
  newNodes[index] = temp
  await reorderNodes(selectedDay.value, newNodes)
}

const onMoveNodeDown = async (node: ItineraryNode, index: number) => {
  if (!selectedDay.value || index === selectedDay.value.nodes.length - 1) return
  const newNodes = [...selectedDay.value.nodes]
  const temp = newNodes[index + 1]
  newNodes[index + 1] = newNodes[index]
  newNodes[index] = temp
  await reorderNodes(selectedDay.value, newNodes)
}

const reorderNodes = async (day: TripDay, newNodes: ItineraryNode[]) => {
  try {
    uni.showLoading({ title: '排序中...' })
    await ItineraryService.reorderItineraryNodes(tripId.value, day.id, {
      nodeIds: newNodes.map(n => n.id)
    })
    fetchItinerary(true)
    onDataChanged()
  } catch (error) {
    console.error('Reorder failed:', error)
  } finally {
    uni.hideLoading()
  }
}

// ── 开支操作 ──
const onAddExpense = (defaultDate?: string) => {
  expenseEditData.value = null
  expenseDefaultDate.value = defaultDate
  expenseSheetVisible.value = true
}

const onEditExpense = (item: ExpenseItem) => {
  expenseEditData.value = item
  expenseDefaultDate.value = undefined
  expenseSheetVisible.value = true
}

const onDeleteExpense = (item: ExpenseItem) => {
  uni.showModal({
    title: '删除开支',
    content: `确定要删除这笔 ¥${item.amountInput} 的开支吗？`,
    confirmColor: '#EF4444',
    success: async res => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '删除中...' })
        await ExpenseService.deleteExpense(tripId.value, item.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchExpenses(true)
        onDataChanged()
      } catch (err) {
        console.error('Delete expense failed:', err)
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const onSaveExpense = async (data: unknown) => {
  try {
    expenseSubmitting.value = true
    if (expenseEditData.value) {
      await ExpenseService.updateExpense(tripId.value, expenseEditData.value.id, data as never)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await ExpenseService.createExpense(tripId.value, data as CreateExpenseRequest)
      uni.showToast({ title: '记账成功', icon: 'success' })
    }
    expenseSheetVisible.value = false
    fetchExpenses(true)
    onDataChanged()
  } catch (err) {
    console.error('Save expense failed:', err)
  } finally {
    expenseSubmitting.value = false
  }
}

// ── 日志操作 ──
const onAddJournal = (defaultDate?: string) => {
  journalEditData.value = null
  journalDefaultDate.value = defaultDate
  journalSheetVisible.value = true
}

const onFabAction = (key: string) => {
  const currentDate = selectedDay.value?.date
  switch (key) {
    case 'itinerary':
      selectedContentTab.value = 'itinerary'
      onAddNode()
      break
    case 'expense':
      selectedContentTab.value = 'expense'
      onAddExpense(currentDate)
      break
    case 'journal':
      selectedContentTab.value = 'journal'
      onAddJournal(currentDate)
      break
  }
}

const onEditJournal = (log: TravelLogItem) => {
  journalEditData.value = log
  journalDefaultDate.value = undefined
  journalSheetVisible.value = true
}

const onDeleteJournal = (log: TravelLogItem) => {
  uni.showModal({
    title: '删除日志',
    content: '确定要删除这条旅行日志吗？',
    confirmColor: '#EF4444',
    success: async res => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '删除中...' })
        await JournalService.deleteJournal(tripId.value, log.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchJournals(true)
        onDataChanged()
      } catch (e) {
        console.error('Delete journal failed:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const onToggleJournalHighlight = async (log: TravelLogItem) => {
  const oldVal = log.isHighlight
  log.isHighlight = !oldVal
  try {
    await JournalService.updateJournal(tripId.value, log.id, { isHighlight: log.isHighlight })
    uni.showToast({ title: log.isHighlight ? '已设为精选' : '已取消精选', icon: 'none' })
  } catch {
    log.isHighlight = oldVal
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const onSaveJournal = async (data: CreateTravelLogRequest | UpdateTravelLogRequest) => {
  try {
    journalSaving.value = true
    const saved = journalEditData.value
      ? await JournalService.updateJournal(tripId.value, journalEditData.value.id, data)
      : await JournalService.createJournal(tripId.value, data)

    const [enriched] = await enrichJournalPhotos([saved])
    upsertJournalInList(enriched)

    uni.showToast({
      title: journalEditData.value ? '修改成功' : '发布成功',
      icon: 'success'
    })
    journalSheetVisible.value = false
    await fetchJournals(true)
    onDataChanged()
  } catch (e) {
    console.error('Save journal failed:', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    journalSaving.value = false
  }
}

const upsertJournalInList = (log: TravelLogItem) => {
  const normalized = normalizeTravelLogPhotos(log)
  const idx = journals.value.findIndex(j => j.id === normalized.id)
  if (idx >= 0) {
    journals.value.splice(idx, 1, normalized)
  } else {
    journals.value.unshift(normalized)
  }
}

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
</script>

<style scoped>
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

.trip-share-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
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

/* 天级 Tab Chip */
.day-chip--active {
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(79, 125, 255, 0.16);
}

.day-chip--idle {
  background: rgba(251, 250, 246, 0.76);
}
</style>
