<template>
  <view class="min-h-screen bg-background">
    <!-- 顶部 Header -->
    <view
      class="sticky top-0 z-30 bg-background/90 border-b border-warm-border/50"
      :style="{ paddingTop: navPaddingTop }"
    >
      <view class="px-5 pb-4">
        <view class="flex items-center gap-3">
          <view
            class="w-10 h-10 shrink-0 flex-center rounded-xl bg-white shadow-sm active:scale-95 transition-transform"
            @click="onBack"
          >
            <view class="i-carbon-chevron-left text-xl text-primary" />
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-xl font-semibold text-primary block">
              {{ isEdit ? '编辑行程' : '添加行程' }}
            </text>
            <text class="text-[13px] text-secondary block mt-0.5">
              记录这一天的一个目的地
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="px-5 pb-36">
      <!-- 所属日期 -->
      <view class="mb-5 mt-2">
        <text class="text-[13px] font-medium text-secondary mb-2 block">所属日期</text>
        <view
          class="card-base p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
          @click="toggleDayPicker"
        >
          <view class="flex items-center gap-3 min-w-0">
            <view
              class="w-10 h-10 rounded-xl bg-brand/10 flex-center shrink-0"
            >
              <text class="text-[14px] font-semibold text-brand">
                {{ selectedDay?.dayIndex ?? '-' }}
              </text>
            </view>
            <view class="min-w-0">
              <text class="text-[15px] font-medium text-primary block">
                第{{ selectedDay?.dayIndex ?? '—' }}天
              </text>
              <text v-if="selectedDay" class="text-[13px] text-muted block mt-0.5 truncate">
                {{ formatItineraryDayDate(selectedDay.date) }} ·
                {{ formatItineraryWeekday(selectedDay.date) }}
              </text>
              <text v-else class="text-[13px] text-muted block mt-0.5">加载中...</text>
            </view>
          </view>
          <view
            class="i-carbon-chevron-right text-muted text-lg shrink-0 transition-transform"
            :class="isDayPickerOpen ? 'rotate-90' : ''"
          />
        </view>

        <view v-if="isDayPickerOpen && tripDays.length > 0" class="mt-2 card-base p-2">
          <view
            v-for="day in tripDays"
            :key="day.id"
            class="flex items-center gap-3 p-3 rounded-xl transition-colors"
            :class="day.id === dayId ? 'bg-brand/10' : 'active:bg-subtle'"
            @click="onSelectDay(day)"
          >
            <view
              class="w-8 h-8 rounded-lg flex-center shrink-0 text-[13px] font-semibold"
              :class="day.id === dayId ? 'bg-brand text-white' : 'bg-subtle text-secondary'"
            >
              <text>{{ day.dayIndex }}</text>
            </view>
            <view class="min-w-0 flex-1">
              <text
                class="text-[14px]"
                :class="day.id === dayId ? 'text-brand font-medium' : 'text-primary'"
              >
                第{{ day.dayIndex }}天
              </text>
              <text class="text-[13px] text-muted ml-2">
                {{ formatItineraryDayDate(day.date) }} · {{ formatItineraryWeekday(day.date) }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 -->
      <view class="card-base p-5 mb-5">
        <!-- 节点类型 -->
        <view class="mb-5">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-tag text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">类型</text>
          </view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="type in nodeTypes"
              :key="type.value"
              class="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 active:scale-95"
              :class="getTypeChipClass(type)"
              @click="onSelectType(type)"
            >
              <view :class="type.icon" class="text-base" />
              <text class="text-[14px] font-medium">{{ type.label }}</text>
            </view>
          </view>
        </view>

        <!-- 地点（POI）：所有类型核心，文案随类型变化 -->
        <view class="mb-5">
          <PoiSearchField
            v-model="selectedPlace"
            precision="poi"
            :city="tripPoiSearchCity"
            :destination-scope="tripDestination"
            :label="locationFieldLabel"
            :placeholder="locationFieldPlaceholder"
          />
        </view>

        <!-- 交通工具（type=transport） -->
        <view v-if="form.type === 'transport'" class="mb-5">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-train text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">交通工具</text>
          </view>
          <view class="flex flex-wrap gap-2 mb-3">
            <view
              v-for="mode in transportModes"
              :key="mode.value"
              class="flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-200 active:scale-95"
              :class="
                details.mode === mode.value
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-subtle border-transparent text-secondary'
              "
              @click="onSelectTransportMode(mode.value)"
            >
              <view :class="mode.icon" class="text-sm" />
              <text class="text-[13px] font-medium">{{ mode.label }}</text>
            </view>
          </view>

          <view v-if="details.mode === 'flight'" class="mb-3">
            <view class="mb-3">
              <text class="text-[12px] text-muted mb-1.5 block">航班号 · 可选</text>
              <input
                v-model="details.flightNo"
                class="h-11 px-4 input-surface text-[14px] box-border w-full"
                placeholder="如 MU523"
                maxlength="50"
              />
            </view>
            <view>
              <text class="text-[12px] text-muted mb-1.5 block">航司 · 可选</text>
              <input
                v-model="details.airline"
                class="h-11 px-4 input-surface text-[14px] box-border w-full"
                placeholder="如 东航"
                maxlength="100"
              />
            </view>
          </view>

          <view v-if="details.mode === 'train' || details.mode === 'hsr'" class="mb-3">
            <text class="text-[12px] text-muted mb-1.5 block">车次 · 可选</text>
            <input
              v-model="details.trainNo"
              class="h-11 px-4 input-surface text-[14px] box-border w-full"
              placeholder="如 G123"
              maxlength="50"
            />
          </view>

          <view v-if="details.mode === 'bus'" class="mb-3">
            <text class="text-[12px] text-muted mb-1.5 block">班次 · 可选</text>
            <input
              v-model="details.busNo"
              class="h-11 px-4 input-surface text-[14px] box-border w-full"
              placeholder="选填"
              maxlength="50"
            />
          </view>

          <view class="mb-3">
            <text class="text-[12px] text-muted mb-1.5 block">出发地备注 · 可选</text>
            <input
              v-model="details.departureName"
              class="h-11 px-4 input-surface text-[14px] box-border w-full"
              placeholder="如航站楼 / 站台"
              maxlength="100"
            />
          </view>
          <view class="mb-3">
            <text class="text-[12px] text-muted mb-1.5 block">到达地备注 · 可选</text>
            <input
              v-model="details.arrivalName"
              class="h-11 px-4 input-surface text-[14px] box-border w-full"
              placeholder="选填"
              maxlength="100"
            />
          </view>
          <view v-if="showsTransportSeatField">
            <text class="text-[12px] text-muted mb-1.5 block">座位 · 可选</text>
            <input
              v-model="details.seatInfo"
              class="h-11 px-4 input-surface text-[14px] box-border w-full"
              placeholder="选填"
              maxlength="100"
            />
          </view>
        </view>

        <!-- 住宿信息：离店日 + 入住/退房时间（不再展示下方通用开始/结束） -->
        <view v-if="form.type === 'hotel'" class="mb-5">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-hotel text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">住宿信息</text>
          </view>
          <view>
            <view class="mb-3">
              <text class="text-[12px] text-muted mb-1.5 block">离店日期 · 可选</text>
              <picker
                mode="date"
                :value="details.checkOutDate || minCheckOutDate"
                :start="minCheckOutDate"
                :end="maxCheckOutDate"
                @change="onHotelCheckOutDateChange"
              >
                <view class="h-11 px-4 input-surface flex items-center justify-between box-border">
                  <text
                    class="text-[13px]"
                    :class="details.checkOutDate ? 'text-primary' : 'text-muted'"
                  >
                    {{
                      details.checkOutDate
                        ? `${details.checkOutDate}${hotelNightsHint ? ' · ' + hotelNightsHint : ''}`
                        : '选填 · 跨天后每天显示住宿'
                    }}
                  </text>
                  <view class="i-carbon-calendar text-muted text-sm" />
                </view>
              </picker>
              <view
                v-if="details.checkOutDate"
                class="mt-1.5"
                @click="details.checkOutDate = ''"
              >
                <text class="text-[12px] text-brand">清除离店日期</text>
              </view>
            </view>
            <view class="mb-3">
              <text class="text-[12px] text-muted mb-1.5 block">确认号 · 可选</text>
              <input
                v-model="details.confirmationCode"
                class="h-11 px-4 input-surface text-[14px] box-border w-full"
                placeholder="选填"
                maxlength="50"
              />
            </view>
            <view class="flex gap-3">
              <picker
                mode="time"
                :value="details.checkInTime || ''"
                class="flex-1"
                @change="onHotelCheckInChange"
              >
                <view class="h-11 px-4 input-surface flex items-center justify-between box-border">
                  <text
                    class="text-[13px]"
                    :class="details.checkInTime ? 'text-primary' : 'text-muted'"
                  >
                    {{ details.checkInTime || '入住时间' }}
                  </text>
                  <view class="i-carbon-time text-muted text-sm" />
                </view>
              </picker>
              <picker
                mode="time"
                :value="details.checkOutTime || ''"
                class="flex-1"
                @change="onHotelCheckOutChange"
              >
                <view class="h-11 px-4 input-surface flex items-center justify-between box-border">
                  <text
                    class="text-[13px]"
                    :class="details.checkOutTime ? 'text-primary' : 'text-muted'"
                  >
                    {{ details.checkOutTime || '退房时间' }}
                  </text>
                  <view class="i-carbon-time text-muted text-sm" />
                </view>
              </picker>
            </view>
          </view>
        </view>

        <!-- 时间：非住宿。交通显示出发/到达；其它显示开始/结束 -->
        <view v-if="form.type !== 'hotel'" class="mb-5">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-time text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">
              {{ form.type === 'transport' ? '出发 / 到达' : '时间' }}
            </text>
            <text class="text-[12px] text-muted font-normal">可选</text>
          </view>
          <view class="flex gap-3">
            <picker
              mode="time"
              :value="form.startTime"
              class="flex-1"
              @change="onStartTimeChange"
            >
              <view
                class="h-12 px-4 input-surface flex items-center justify-between box-border"
                :class="
                  formErrors.startTime || formErrors.timeRange
                    ? 'ring-2 ring-danger/30 !bg-danger-subtle'
                    : ''
                "
              >
                <text
                  class="text-[14px]"
                  :class="form.startTime ? 'text-primary' : 'text-muted'"
                >
                  {{ form.startTime || (form.type === 'transport' ? '出发' : '开始') }}
                </text>
                <view class="i-carbon-time text-muted text-sm" />
              </view>
            </picker>
            <text class="text-[13px] text-muted shrink-0 self-center">至</text>
            <picker
              mode="time"
              :value="form.endTime"
              :start="form.startTime"
              class="flex-1"
              @change="onEndTimeChange"
            >
              <view
                class="h-12 px-4 input-surface flex items-center justify-between box-border"
                :class="
                  formErrors.endTime || formErrors.timeRange
                    ? 'ring-2 ring-danger/30 !bg-danger-subtle'
                    : ''
                "
              >
                <text class="text-[14px]" :class="form.endTime ? 'text-primary' : 'text-muted'">
                  {{ form.endTime || (form.type === 'transport' ? '到达' : '结束') }}
                </text>
                <view class="i-carbon-time text-muted text-sm" />
              </view>
            </picker>
          </view>
          <text v-if="formErrors.timeRange" class="text-[12px] text-danger mt-1.5 block">
            {{ formErrors.timeRange }}
          </text>
        </view>

        <!-- 名称：交通不展示（地点名兜底）；其它类型可选 -->
        <view v-if="form.type !== 'transport'" class="mb-5">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-ticket text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">{{ titleFieldLabel }}</text>
            <text class="text-[12px] text-muted font-normal">可选</text>
          </view>
          <input
            v-model="form.title"
            type="text"
            :placeholder="titleFieldPlaceholder"
            placeholder-class="text-muted"
            class="w-full h-12 px-4 input-surface text-[15px] text-primary box-border"
            :class="formErrors.title ? 'ring-2 ring-danger/30 !bg-danger-subtle' : ''"
            maxlength="100"
            @input="clearFieldError('title')"
          />
          <text v-if="formErrors.title" class="text-[12px] text-danger mt-1.5 block">
            {{ formErrors.title }}
          </text>
        </view>

        <!-- 备注 -->
        <view>
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-chat text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">备注</text>
            <text class="text-[12px] text-muted font-normal">可选</text>
          </view>
          <textarea
            v-model="form.note"
            placeholder="想记住什么？"
            placeholder-class="text-muted"
            class="w-full px-4 py-3 input-surface text-[15px] text-primary box-border leading-relaxed"
            :maxlength="500"
          />
        </view>
      </view>

      <!-- 删除（仅编辑态） -->
      <view v-if="isEdit" class="mb-6">
        <view
          class="py-4 flex items-center justify-center gap-1.5 active:bg-danger/5 rounded-2xl transition-colors"
          @click="onDeleteNode"
        >
          <view class="i-carbon-trash-can text-danger/60 text-base" />
          <text class="text-[15px] text-danger/70">删除此行程</text>
        </view>
      </view>
    </view>

    <!-- 底部保存 -->
    <view class="fixed bottom-0 left-0 right-0 z-50">
      <view class="absolute inset-0 bg-background/90 border-t border-warm-border/50" />
      <view class="relative px-5 pt-4 pb-safe">
        <TracciButton
          block
          size="lg"
          custom-class="!rounded-2xl !h-[52px]"
          :loading="submitLoading"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ isEdit ? '保存修改' : '保存行程' }}
        </TracciButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TracciButton from '@/components/common/TracciButton.vue'
import PoiSearchField from '@/components/location/PoiSearchField.vue'
import { ItineraryService } from '@/services/itinerary'
import { TripService } from '@/services/trip'
import { getTripPoiSearchCity, parseDestinationFromTrip } from '@/utils/destination'
import type { PlaceInfo } from '@/types/location'
import type { TripDestination } from '@/types/trip'
import {
  buildNodeLocationSubmitPayload,
  parsePlaceFromNode
} from '@/utils/nodeLocation'
import { guardProtectedPage } from '@/utils/guestAuth'
import type {
  CreateItineraryNodeRequest,
  ItineraryNode,
  ItineraryNodeDetails,
  ItineraryNodeType,
  NodeLocation,
  TransportMode,
  TripDay,
  UpdateItineraryNodeRequest
} from '@/types/itinerary'
import { TRANSPORT_MODE_OPTIONS } from '@/types/itinerary'
import { formatItineraryDayDate, formatItineraryWeekday } from '@/utils/itineraryStatus'

interface PickerChangeEvent {
  detail: {
    value: string
  }
}

interface FormErrors {
  title?: string
  startTime?: string
  endTime?: string
  timeRange?: string
}

interface NodeTypeOption {
  label: string
  value: ItineraryNodeType
  icon: string
}

interface NodeEditForm {
  title: string
  type: ItineraryNodeType
  startTime: string
  endTime: string
  note: string
}

const tripId = ref('')
const dayId = ref('')
const originalDayId = ref('')
const nodeId = ref('')

const isEdit = computed(() => !!nodeId.value)

const nodeTypes: NodeTypeOption[] = [
  { label: '交通', value: 'transport', icon: 'i-carbon-train' },
  { label: '餐饮', value: 'restaurant', icon: 'i-carbon-restaurant' },
  { label: '景点', value: 'attraction', icon: 'i-carbon-camera' },
  { label: '住宿', value: 'hotel', icon: 'i-carbon-hotel' },
  { label: '购物', value: 'shopping', icon: 'i-carbon-shopping-bag' },
  { label: '其他', value: 'other', icon: 'i-carbon-box' }
]

const transportModes = TRANSPORT_MODE_OPTIONS

const form = ref<NodeEditForm>({
  title: '',
  type: 'attraction',
  startTime: '',
  endTime: '',
  note: ''
})

/** 表单侧 details 编辑态（提交时再组装） */
const details = ref<ItineraryNodeDetails>({
  mode: 'flight',
  flightNo: '',
  airline: '',
  trainNo: '',
  busNo: '',
  departureName: '',
  arrivalName: '',
  seatInfo: '',
  confirmationCode: '',
  checkInTime: '',
  checkOutTime: '',
  checkOutDate: ''
})

const formErrors = ref<FormErrors>({})
const selectedPlace = ref<PlaceInfo | null>(null)
const tripPoiSearchCity = ref<string | undefined>()
const tripDestination = ref<TripDestination | null>(null)
const tripDays = ref<TripDay[]>([])
const isDayPickerOpen = ref(false)
const pageLoading = ref(false)
const submitLoading = ref(false)

const statusBarHeight = ref(0)
const capsuleBottom = ref(0)

const selectedDay = computed(() => tripDays.value.find(d => d.id === dayId.value))

/** 标题可选：有地点即可提交（与 iOS / 后端一致） */
const canSubmit = computed(() => {
  if (!dayId.value || submitLoading.value || pageLoading.value) return false
  return !!selectedPlace.value?.name?.trim()
})

const locationFieldLabel = computed(() => {
  if (form.value.type === 'transport') return '主要地点'
  if (form.value.type === 'hotel') return '酒店地点'
  return '地点'
})

const locationFieldPlaceholder = computed(() => {
  if (form.value.type === 'transport') {
    return tripPoiSearchCity.value
      ? `在${tripPoiSearchCity.value}搜索机场、车站`
      : '搜索机场、车站或上车点'
  }
  if (form.value.type === 'hotel') {
    return tripPoiSearchCity.value
      ? `在${tripPoiSearchCity.value}搜索酒店`
      : '搜索酒店或住宿地点'
  }
  return tripPoiSearchCity.value
    ? `在${tripPoiSearchCity.value}搜索地点`
    : '搜索景点、餐厅或地址'
})

const titleFieldLabel = computed(() => {
  if (form.value.type === 'hotel') return '住宿名称'
  return '行程标题'
})

const titleFieldPlaceholder = computed(() => {
  if (form.value.type === 'hotel') return '留空则使用酒店名称'
  return '例如：洱海骑行、浅草寺'
})

/** 座位仅飞机/火车/高铁/大巴 */
const showsTransportSeatField = computed(() => {
  const mode = details.value.mode
  return mode === 'flight' || mode === 'train' || mode === 'hsr' || mode === 'bus'
})

const navPaddingTop = computed(() => {
  if (capsuleBottom.value) return `${capsuleBottom.value + 4}px`
  return `${statusBarHeight.value + 8}px`
})

onMounted(() => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    if (menuButtonInfo) {
      capsuleBottom.value = menuButtonInfo.bottom
    }
    // #endif
  } catch {
    /* ignore */
  }
})

const isTypeSelected = (type: NodeTypeOption) => form.value.type === type.value

const getTypeChipClass = (type: NodeTypeOption) => {
  if (isTypeSelected(type)) {
    return 'bg-brand/10 border-brand text-brand'
  }
  return 'bg-subtle border-transparent text-secondary'
}

const onSelectType = (type: NodeTypeOption) => {
  form.value.type = type.value
  if (type.value === 'transport') {
    if (!details.value.mode) details.value.mode = 'flight'
    form.value.title = ''
  }
  if (type.value === 'hotel') {
    // 住宿不使用通用结束时间；入住时间与 startTime 对齐
    form.value.endTime = ''
    if (!details.value.checkInTime && form.value.startTime) {
      details.value.checkInTime = form.value.startTime
    } else if (details.value.checkInTime) {
      form.value.startTime = details.value.checkInTime
    }
  }
}

const onSelectTransportMode = (mode: TransportMode) => {
  details.value.mode = mode
  // 切换工具时清理不适用字段
  if (mode !== 'flight') {
    details.value.flightNo = ''
    details.value.airline = ''
  }
  if (mode !== 'train' && mode !== 'hsr') {
    details.value.trainNo = ''
  }
  if (mode !== 'bus') {
    details.value.busNo = ''
  }
  if (mode === 'driving' || mode === 'other') {
    details.value.seatInfo = ''
  }
}

const onHotelCheckInChange = (e: PickerChangeEvent) => {
  details.value.checkInTime = e.detail.value
  // 入住时间同步为节点 startTime，时间轴可展示
  form.value.startTime = e.detail.value
  form.value.endTime = ''
}

const onHotelCheckOutChange = (e: PickerChangeEvent) => {
  details.value.checkOutTime = e.detail.value
  // 退房只写 details，不占用 endTime
  form.value.endTime = ''
}

const onHotelCheckOutDateChange = (e: PickerChangeEvent) => {
  details.value.checkOutDate = e.detail.value
}

/** 当前所选入住日的日期 yyyy-MM-dd */
const checkInDate = computed(() => selectedDay.value?.date || '')

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const minCheckOutDate = computed(() => {
  if (!checkInDate.value) return '2000-01-01'
  return addDays(checkInDate.value, 1)
})

const maxCheckOutDate = computed(() => {
  if (tripDays.value.length === 0) return '2099-12-31'
  const last = tripDays.value[tripDays.value.length - 1]?.date
  if (!last) return '2099-12-31'
  // 最后一晚可住在旅程结束日 → 离店日 = 结束日 + 1
  return addDays(last, 1)
})

const hotelNightsHint = computed(() => {
  if (!checkInDate.value || !details.value.checkOutDate) return ''
  const a = new Date(`${checkInDate.value}T00:00:00`).getTime()
  const b = new Date(`${details.value.checkOutDate}T00:00:00`).getTime()
  const nights = Math.round((b - a) / (24 * 3600 * 1000))
  return nights > 0 ? `住 ${nights} 晚` : ''
})

const trimOrUndefined = (value?: string): string | undefined => {
  const t = value?.trim()
  return t ? t : undefined
}

const buildDetailsPayload = (): ItineraryNodeDetails | Record<string, never> | undefined => {
  if (form.value.type === 'transport') {
    const mode = (details.value.mode || 'flight') as TransportMode
    const seatAllowed =
      mode === 'flight' || mode === 'train' || mode === 'hsr' || mode === 'bus'
    const payload: ItineraryNodeDetails = {
      kind: 'transport',
      mode,
      flightNo: mode === 'flight' ? trimOrUndefined(details.value.flightNo) : undefined,
      airline: mode === 'flight' ? trimOrUndefined(details.value.airline) : undefined,
      trainNo:
        mode === 'train' || mode === 'hsr'
          ? trimOrUndefined(details.value.trainNo)
          : undefined,
      busNo: mode === 'bus' ? trimOrUndefined(details.value.busNo) : undefined,
      departureName: trimOrUndefined(details.value.departureName),
      arrivalName: trimOrUndefined(details.value.arrivalName),
      seatInfo: seatAllowed ? trimOrUndefined(details.value.seatInfo) : undefined
    }
    return payload
  }
  if (form.value.type === 'hotel') {
    const payload: ItineraryNodeDetails = {
      kind: 'hotel',
      confirmationCode: trimOrUndefined(details.value.confirmationCode),
      checkInTime: trimOrUndefined(details.value.checkInTime),
      checkOutTime: trimOrUndefined(details.value.checkOutTime),
      checkOutDate: trimOrUndefined(details.value.checkOutDate)
    }
    const hasContent =
      !!payload.confirmationCode ||
      !!payload.checkInTime ||
      !!payload.checkOutTime ||
      !!payload.checkOutDate
    // 编辑时无内容传 {} 清空；创建时无内容可不传
    if (!hasContent) {
      return isEdit.value ? {} : undefined
    }
    return payload
  }
  // 其它类型：编辑时清空可能残留的 details
  return isEdit.value ? {} : undefined
}

const toggleDayPicker = () => {
  if (tripDays.value.length === 0) return
  isDayPickerOpen.value = !isDayPickerOpen.value
}

const onSelectDay = (day: TripDay) => {
  dayId.value = day.id
  isDayPickerOpen.value = false
  // 入住日变更后，离店日若不晚于新入住日则清空
  if (
    details.value.checkOutDate &&
    day.date &&
    details.value.checkOutDate <= day.date
  ) {
    details.value.checkOutDate = ''
  }
}

const clearFieldError = (key: keyof FormErrors) => {
  if (formErrors.value[key]) {
    formErrors.value = { ...formErrors.value, [key]: undefined }
  }
  if (key === 'startTime' || key === 'endTime') {
    formErrors.value = { ...formErrors.value, timeRange: undefined }
  }
}

const validateForm = (): boolean => {
  const errors: FormErrors = {}
  const hasPlace = !!selectedPlace.value?.name?.trim()
  if (!hasPlace) {
    errors.title = '请选择地点'
  }
  // 住宿不校验通用开始/结束时间区间
  if (
    form.value.type !== 'hotel' &&
    form.value.startTime &&
    form.value.endTime &&
    form.value.endTime < form.value.startTime
  ) {
    errors.timeRange = form.value.type === 'transport'
      ? '到达时间不能早于出发时间'
      : '结束时间不能早于开始时间'
  }
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else if (tripId.value) {
    uni.redirectTo({ url: `/pages/trip/detail?id=${tripId.value}` })
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const fetchTripDays = async () => {
  if (!tripId.value) return
  try {
    const itinerary = await ItineraryService.getItinerary(tripId.value)
    tripDays.value = (itinerary.days || []).sort((a, b) => a.dayIndex - b.dayIndex)
    if (!dayId.value && tripDays.value.length > 0) {
      dayId.value = tripDays.value[0].id
    }
  } catch (error) {
    console.error('Fetch itinerary days failed:', error)
    uni.showToast({ title: '行程日期加载失败', icon: 'none' })
  }
}

const fetchTripSearchCity = async () => {
  if (!tripId.value) return
  try {
    const trip = await TripService.getTripDetail(tripId.value)
    tripDestination.value = parseDestinationFromTrip(trip)
    tripPoiSearchCity.value = getTripPoiSearchCity(trip)
  } catch (error) {
    console.error('Fetch trip for POI city scope failed:', error)
    tripDestination.value = null
    tripPoiSearchCity.value = undefined
  }
}

onLoad(async options => {
  if (!guardProtectedPage()) return
  if (!options) return

  tripId.value = options.tripId || ''
  dayId.value = options.dayId || ''
  originalDayId.value = options.dayId || ''
  nodeId.value = options.nodeId || ''

  await Promise.all([fetchTripDays(), fetchTripSearchCity()])

  if (isEdit.value) {
    const editData = uni.getStorageSync('edit_node_data')
    if (editData) {
      fillForm(editData as ItineraryNode)
      uni.removeStorageSync('edit_node_data')
    } else {
      await fetchNodeForEdit()
    }
  }
})

const fillForm = (node: ItineraryNode) => {
  const d = node.details
  const hotelIn = (d?.checkInTime || node.startTime || '').trim()
  form.value = {
    title: node.title,
    type: node.type,
    startTime: node.type === 'hotel' ? hotelIn : node.startTime || '',
    endTime: node.type === 'hotel' ? '' : node.endTime || '',
    note: node.note || ''
  }
  details.value = {
    mode: (d?.mode as TransportMode) || 'flight',
    flightNo: d?.flightNo || '',
    airline: d?.airline || '',
    trainNo: d?.trainNo || '',
    busNo: d?.busNo || '',
    departureName: d?.departureName || '',
    arrivalName: d?.arrivalName || '',
    seatInfo: d?.seatInfo || '',
    confirmationCode: d?.confirmationCode || '',
    checkInTime: hotelIn,
    checkOutTime: d?.checkOutTime || '',
    checkOutDate: d?.checkOutDate || '',
    stayGroupId: d?.stayGroupId,
    stayRole: d?.stayRole,
    totalNights: d?.totalNights
  }
  selectedPlace.value = parsePlaceFromNode(node)
  if (node.tripDayId) {
    dayId.value = node.tripDayId
  }
}

const fetchNodeForEdit = async () => {
  if (!tripId.value || !dayId.value || !nodeId.value) return

  try {
    pageLoading.value = true
    const itinerary = await ItineraryService.getItinerary(tripId.value)
    const day = itinerary.days.find(item => item.id === dayId.value)
    const node = day?.nodes.find(item => item.id === nodeId.value)
    if (node) {
      fillForm(node)
    } else {
      uni.showToast({ title: '节点不存在', icon: 'none' })
    }
  } catch (error) {
    console.error('Fetch node failed:', error)
  } finally {
    pageLoading.value = false
  }
}

const onStartTimeChange = (e: PickerChangeEvent) => {
  form.value.startTime = e.detail.value
  clearFieldError('startTime')
  if (form.value.endTime && form.value.endTime < form.value.startTime) {
    form.value.endTime = ''
  }
}

const onEndTimeChange = (e: PickerChangeEvent) => {
  form.value.endTime = e.detail.value
  clearFieldError('endTime')
}

const buildSubmitData = (): CreateItineraryNodeRequest | UpdateItineraryNodeRequest => {
  const locationPayload = buildNodeLocationSubmitPayload(selectedPlace.value, {
    clearOnEmpty: isEdit.value
  })
  const detailsPayload = buildDetailsPayload()
  const isHotel = form.value.type === 'hotel'
  // 住宿：时间轴用入住时间；退房只写 details.checkOutTime，不写 endTime
  const startTime = isHotel
    ? details.value.checkInTime || form.value.startTime || ''
    : form.value.startTime || ''
  const endTime = isHotel ? '' : form.value.endTime || ''

  const payload: UpdateItineraryNodeRequest = {
    // 交通不展示标题字段，强制空串（展示用地点名兜底）
    title: form.value.type === 'transport' ? '' : form.value.title.trim(),
    type: form.value.type,
    ...locationPayload
  }

  if (startTime) {
    payload.startTime = startTime
  } else if (isEdit.value) {
    // 编辑时允许清空开始时间
    ;(payload as UpdateItineraryNodeRequest).startTime = ''
  }

  if (isHotel) {
    // 始终清空 endTime，避免与退房时间混淆
    if (isEdit.value) {
      ;(payload as UpdateItineraryNodeRequest).endTime = ''
    }
  } else if (endTime) {
    payload.endTime = endTime
  } else if (isEdit.value) {
    ;(payload as UpdateItineraryNodeRequest).endTime = ''
  }

  if (form.value.note?.trim()) {
    payload.note = form.value.note.trim()
  } else if (isEdit.value) {
    payload.note = ''
  }

  if (detailsPayload !== undefined) {
    payload.details = detailsPayload
  }

  if (isEdit.value) return payload

  return {
    ...payload,
    type: form.value.type,
    location: locationPayload.location as NodeLocation
  }
}

const onSubmit = async () => {
  if (!validateForm()) {
    const firstError = formErrors.value.title || formErrors.value.timeRange
    if (firstError) {
      uni.showToast({ title: firstError, icon: 'none' })
    }
    return
  }

  try {
    submitLoading.value = true
    const submitData = buildSubmitData()
    const dayChanged = isEdit.value && dayId.value !== originalDayId.value

    if (isEdit.value && dayChanged) {
      await ItineraryService.addItineraryNode(tripId.value, dayId.value, submitData)
      await ItineraryService.deleteItineraryNode(
        tripId.value,
        originalDayId.value,
        nodeId.value
      )
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else if (isEdit.value) {
      await ItineraryService.updateItineraryNode(
        tripId.value,
        dayId.value,
        nodeId.value,
        submitData
      )
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await ItineraryService.addItineraryNode(tripId.value, dayId.value, submitData)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Submit node failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const onDeleteNode = () => {
  const stayRole = details.value.stayRole
  const stayGroupId = details.value.stayGroupId
  // 编辑页若打开的是中间夜：禁止删除
  if (form.value.type === 'hotel' && stayRole === 'stay') {
    uni.showModal({
      title: '无法单独删除当晚住宿',
      content: '中间夜住宿由连住生成，请修改离店日期；或从入住日删除整段住宿。',
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
  const isPrimary = form.value.type === 'hotel' && !!stayGroupId && stayRole !== 'stay'
  uni.showModal({
    title: isPrimary ? '删除整段住宿？' : '删除行程节点',
    content: isPrimary
      ? '将删除该段连住的所有住宿记录，删除后无法恢复。'
      : `确定要删除「${form.value.title || '此行程'}」吗？`,
    confirmColor: '#EF4444',
    confirmText: isPrimary ? '删除整段' : '删除',
    success: async res => {
      if (!res.confirm) return

      try {
        submitLoading.value = true
        await ItineraryService.deleteItineraryNode(
          tripId.value,
          originalDayId.value || dayId.value,
          nodeId.value
        )
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)
      } catch (error) {
        console.error('Delete node failed:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}
</script>
