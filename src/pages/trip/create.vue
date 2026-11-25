<template>
  <view class="trip-create-page" :style="pageShellStyle">
    <!-- 顶部 Header -->
    <view
      class="trip-create-header shrink-0 bg-background/90 border-b border-warm-border/50"
      :style="{ paddingTop: navPaddingTop }"
    >
      <view class="px-4 pb-4">
        <view class="flex items-center gap-3">
          <view
            class="w-10 h-10 shrink-0 flex-center rounded-xl bg-white shadow-sm active:scale-95 transition-transform"
            @click="onBack"
          >
            <view class="i-carbon-chevron-left text-xl text-primary" />
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-xl font-semibold text-primary block">
              {{ isEdit ? '编辑旅行' : '创建旅行' }}
            </text>
            <text class="text-[13px] text-secondary block mt-0.5">
              把这段旅程，从这里开始留下
            </text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="trip-create-scroll"
      :show-scrollbar="false"
      :style="{ height: `${scrollBodyHeight}px` }"
    >
    <view class="px-4 pb-8 pt-4">
      <!-- 旅行封面 -->
      <view class="mb-4">
        <!-- 小程序 WXSS 不生成 aspect-ratio，需用 padding 比例盒保证可点区域 -->
        <view
          class="trip-create-cover w-full rounded-3xl shadow-card active:scale-[0.99] transition-transform"
        >
          <view class="trip-create-cover__inner" @tap.stop="onChooseCover">
          <template v-if="displayCoverUrl">
            <TracciImage
              :image="displayCoverUrl"
              mode="aspectFill"
              class="w-full h-full"
              custom-class="w-full h-full"
              style="display: block; width: 100%; height: 100%"
            />
            <view
              class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
            />
            <view
              v-if="!isUploadingCover"
              class="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 flex items-center gap-1.5"
              @tap.stop="onChooseCover"
            >
              <view class="i-carbon-image text-primary text-sm" />
              <text class="text-[13px] font-medium text-primary">更换封面</text>
            </view>
            <view
              v-if="isUploadingCover"
              class="absolute inset-0 bg-black/35 flex-col-center px-6 text-center"
            >
              <view class="i-carbon-circle-dash animate-spin text-white text-2xl mb-2" />
              <text class="text-sm font-medium text-white block">{{ coverUploadStatusText }}</text>
              <text class="text-xs text-white/80 block mt-1">{{ uploadProgress }}%</text>
            </view>
            <view
              v-if="isCoverUploadFailed"
              class="absolute inset-0 bg-black/45 flex-col-center px-6 text-center"
            >
              <view class="i-carbon-warning text-white text-2xl mb-2" />
              <text class="text-sm font-medium text-white block">封面上传失败</text>
              <text class="text-xs text-white/80 block mt-1 leading-relaxed">
                {{ coverUploadError || '请重新选择图片' }}
              </text>
            </view>
            <view
              v-if="!isUploadingCover"
              class="absolute top-3 right-3 w-7 h-7 bg-black/50 rounded-full flex-center z-10"
              @tap.stop="onClearCover"
            >
              <view class="i-carbon-close text-white text-sm" />
            </view>
          </template>

          <template v-else-if="isUploadingCover">
            <view class="absolute inset-0 bg-subtle flex-col-center">
              <view class="i-carbon-circle-dash animate-spin text-2xl text-brand mb-2" />
              <text class="text-sm font-medium text-brand">{{ coverUploadStatusText }}</text>
              <text class="text-xs text-muted mt-1">{{ uploadProgress }}%</text>
            </view>
          </template>

          <template v-else>
            <view class="absolute inset-0 bg-gradient-to-br from-warm-border via-subtle to-warm-border" />
            <view class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand/5" />
            <view class="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-brand/5" />
            <view class="absolute inset-0 flex-col-center">
              <view class="w-14 h-14 rounded-2xl bg-white shadow-sm flex-center mb-3">
                <view class="i-carbon-image text-2xl text-muted" />
              </view>
              <text class="text-[15px] font-medium text-secondary">选择一张旅行封面</text>
              <text class="text-[12px] text-muted mt-1">填写信息，开始创建旅行</text>
            </view>
            <view
              class="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 flex items-center gap-1.5"
              @tap.stop="onChooseCover"
            >
              <view class="i-carbon-image text-primary text-sm" />
              <text class="text-[13px] font-medium text-primary">选择封面</text>
            </view>
          </template>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 -->
      <view class="card-base p-4 mb-4">

        <!-- 旅行名称 -->
        <view class="mb-4">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-text-short-paragraph text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">旅行名称</text>
          </view>
          <input
            v-model="form.title"
            type="text"
            placeholder="例如：东京 5 日游、云南大理之旅"
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

        <!-- 目的地（POI 搜索） -->
        <view class="mb-4">
          <PoiSearchField
            v-model="selectedDestination"
            precision="city"
            placeholder="搜索城市或地区"
          />
        </view>

        <!-- 旅行日期 -->
        <view class="mb-4">
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-calendar text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">旅行日期</text>
          </view>
          <view class="p-3 input-surface">
            <view class="flex items-center gap-2">
              <picker mode="date" :value="form.startDate || undefined" class="flex-1" @change="onStartDateChange">
                <view
                  class="h-11 px-3 bg-white rounded-xl flex items-center justify-between box-border"
                  :class="
                    formErrors.startDate || formErrors.dateRange
                      ? 'ring-2 ring-danger/30 !bg-danger-subtle'
                      : ''
                  "
                >
                  <text
                    class="text-[14px]"
                    :class="form.startDate ? 'text-primary font-medium' : 'text-muted'"
                  >
                    {{ form.startDate || '开始日期' }}
                  </text>
                  <view class="i-carbon-calendar text-muted text-sm" />
                </view>
              </picker>
              <view class="w-5 h-px bg-warm-divider shrink-0" />
              <picker
                mode="date"
                :value="form.endDate || undefined"
                :start="form.startDate || undefined"
                class="flex-1"
                @change="onEndDateChange"
              >
                <view
                  class="h-11 px-3 bg-white rounded-xl flex items-center justify-between box-border"
                  :class="
                    formErrors.endDate || formErrors.dateRange
                      ? 'ring-2 ring-danger/30 !bg-danger-subtle'
                      : ''
                  "
                >
                  <text class="text-[14px]" :class="form.endDate ? 'text-primary font-medium' : 'text-muted'">
                    {{ form.endDate || '结束日期' }}
                  </text>
                  <view class="i-carbon-calendar text-muted text-sm" />
                </view>
              </picker>
            </view>
            <!-- 天数提示 -->
            <text
              v-if="form.startDate && form.endDate"
              class="text-xs text-muted block mt-2.5 text-center"
            >
              共 {{ tripDayCount }} 天
            </text>
          </view>
          <text
            v-if="formErrors.startDate || formErrors.endDate || formErrors.dateRange"
            class="text-[12px] text-danger mt-1.5 block"
          >
            {{ formErrors.dateRange || formErrors.startDate || formErrors.endDate }}
          </text>
        </view>

        <!-- 旅行状态（根据日期自动判断，不可手动修改） -->
        <view>
          <view class="flex items-center gap-2 mb-2">
            <view class="i-carbon-flag text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">旅行状态</text>
            <text class="text-[11px] text-muted">· 根据日期自动判断</text>
          </view>
          <view
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            :class="statusPillClass"
          >
            <view class="w-1.5 h-1.5 rounded-full" :class="statusDotClass" />
            <text>{{ statusLabel }}</text>
          </view>
        </view>
      </view>

      <!-- 创建后提示 -->
      <view
        v-if="!isEdit"
        class="card-base p-4 mb-4"
      >
        <view class="flex items-center gap-3">
          <view class="w-9 h-9 rounded-xl bg-brand/10 flex-center shrink-0">
            <view class="i-carbon-information text-brand text-lg" />
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-sm text-secondary block leading-relaxed">
              创建后可以继续添加行程、记录开支和写日志
            </text>
          </view>
        </view>
      </view>

      <!-- 编辑模式：成员与协作 -->
      <view v-if="isEdit && canManageMembers" class="card-base mb-4">
        <view
          class="p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
          @click="onGoToMembers"
        >
          <view class="flex items-center gap-3">
            <view class="w-10 h-10 rounded-xl bg-brand/10 flex-center">
              <view class="i-carbon-user-multiple text-brand text-lg" />
            </view>
            <view>
              <text class="text-sm font-medium text-primary block">管理成员角色</text>
              <text class="text-xs text-muted block mt-0.5">修改角色、移除成员、邀请好友</text>
            </view>
          </view>
          <view class="i-carbon-chevron-right text-muted" />
        </view>
      </view>

      <!-- 编辑模式：旅程动态入口 -->
      <view v-if="isEdit" class="card-base mb-4">
        <view
          class="p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
          @click="onOpenActivityLog"
        >
          <view class="flex items-center gap-3 flex-1 min-w-0">
            <view class="w-10 h-10 rounded-xl bg-warm-surface flex-center shrink-0">
              <view class="i-carbon-time text-secondary text-lg" />
            </view>
            <view class="flex-1 min-w-0">
              <text class="text-sm font-medium text-primary block">旅程动态</text>
              <text class="text-xs text-muted block mt-0.5">查看行程、开支和日志的编辑记录</text>
            </view>
          </view>
          <view class="i-carbon-chevron-right text-muted shrink-0" />
        </view>
      </view>

    </view>
    </scroll-view>

    <!-- 底部操作栏：文档流贴底 -->
    <view
      v-if="hasFooterActions"
      class="trip-create-footer"
      :style="footerBarStyle"
    >
      <view
        v-if="!isEdit || canUpdateTrip"
        class="trip-create-footer-btn trip-create-footer-btn--primary"
        :class="{ 'trip-create-footer-btn--disabled': !canSubmit || submitLoading }"
        @click="onSubmit"
      >
        <view
          v-if="submitLoading"
          class="i-carbon-circle-dash animate-spin text-white text-lg mr-2"
        />
        <text class="trip-create-footer-btn__text">
          {{ isEdit ? '保存修改' : '创建旅行' }}
        </text>
      </view>
      <view
        v-if="isEdit && canDeleteTrip"
        class="trip-create-footer-btn trip-create-footer-btn--danger"
        :class="{ 'trip-create-footer-btn--disabled': submitLoading }"
        @click="onDeleteTrip"
      >
        <view class="i-carbon-trash-can text-white/80 text-base mr-1.5" />
        <text class="trip-create-footer-btn__text">删除旅行</text>
      </view>
    </view>
    <WechatPrivacyPopup />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import TracciImage from '@/components/common/TracciImage.vue'
import WechatPrivacyPopup from '@/components/privacy/WechatPrivacyPopup.vue'
import PoiSearchField from '@/components/location/PoiSearchField.vue'
import { TripService } from '@/services/trip'
import type {
  CreateTripRequest,
  TripAccess,
  TripDestination,
  TripPermission,
  TripStatus
} from '@/types/trip'
import {
  buildDestinationSubmitPayload,
  parseDestinationFromTrip
} from '@/utils/destination'
import { useImageUpload } from '@/composables/useImageUpload'
import { TRIP_LIST_DIRTY_KEY } from '@/constants/storageKeys'
import { getImagePreviewUrl, getTripCoverPreviewUrl } from '@/utils/image'
import { computeTripStatusFromDates } from '@/utils/tripStatus'
import { guardProtectedPage } from '@/utils/guestAuth'
import { HttpError } from '@/utils/http'

interface PickerChangeEvent {
  detail: {
    value: string | number
  }
}

interface FormErrors {
  title?: string
  startDate?: string
  endDate?: string
  dateRange?: string
}

const form = ref<CreateTripRequest>({
  title: '',
  startDate: '',
  endDate: '',
  baseCurrency: 'CNY',
  coverFileId: undefined
})

const markTripListDirty = () => {
  uni.setStorageSync(TRIP_LIST_DIRTY_KEY, '1')
}

const selectedDestination = ref<TripDestination | null>(null)

const formErrors = ref<FormErrors>({})

const tripId = ref('')
const tripAccess = ref<TripAccess | null>(null)
const pageLoading = ref(false)
const submitLoading = ref(false)
const isEdit = computed(() => !!tripId.value)

// ── 协作（编辑模式） ──
const hasPermission = (permission: TripPermission) =>
  tripAccess.value?.permissions.includes(permission) ?? false

const canUpdateTrip = computed(() => hasPermission('trip.update'))
const canDeleteTrip = computed(() => hasPermission('trip.delete'))
const canManageMembers = computed(() => hasPermission('trip.members.manage'))

const onGoToMembers = () => {
  if (!tripId.value || !canManageMembers.value) {
    uni.showToast({ title: '你没有管理成员的权限', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/trip/members?tripId=${tripId.value}`
  })
}

const statusBarHeight = ref(0)
const capsuleBottom = ref(0)
const windowHeight = ref(0)
const safeAreaBottom = ref(0)
/** 实测顶栏高度，用于计算 scroll-view */
const headerHeightPx = ref(96)

const instance = getCurrentInstance()

/** 计算旅行总天数 */
const tripDayCount = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const start = new Date(form.value.startDate)
  const end = new Date(form.value.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, diff)
})

const computedStatus = computed<TripStatus>(() => {
  const fromDates = computeTripStatusFromDates(form.value.startDate, form.value.endDate)
  return fromDates ?? 'planning'
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = { planning: '计划中', ongoing: '进行中', completed: '已完成' }
  return labels[computedStatus.value] || '计划中'
})

const statusPillClass = computed(() => {
  const map: Record<string, string> = {
    planning: 'bg-warm-surface text-secondary',
    ongoing: 'bg-brand/10 text-brand',
    completed: 'bg-subtle text-secondary'
  }
  return map[computedStatus.value] || map.planning
})

const statusDotClass = computed(() => {
  const map: Record<string, string> = {
    planning: 'bg-amber-500',
    ongoing: 'bg-brand',
    completed: 'bg-secondary'
  }
  return map[computedStatus.value] || map.planning
})

const canSubmit = computed(() => {
  return (
    (!isEdit.value || canUpdateTrip.value) &&
    !!form.value.title.trim() &&
    !!form.value.startDate &&
    !!form.value.endDate &&
    !isUploadingCover.value &&
    !isCoverUploadFailed.value &&
    !submitLoading.value &&
    !pageLoading.value
  )
})

const navPaddingTop = computed(() => {
  if (capsuleBottom.value) return `${capsuleBottom.value + 4}px`
  return `${statusBarHeight.value + 8}px`
})

/** 实测底栏高度（避免估算偏大导致按钮下方整块留白） */
const footerHeightPx = ref(72)
const hasFooterActions = computed(
  () => !isEdit.value || canUpdateTrip.value || canDeleteTrip.value
)

const footerHeightFallback = computed(() => {
  if (!hasFooterActions.value) return 0
  const btnH = 48
  const pt = 12
  const pb = 12
  const gap = 8
  const btnCount = isEdit.value
    ? Number(canUpdateTrip.value) + Number(canDeleteTrip.value)
    : 1
  return pt + pb + btnCount * btnH + (btnCount > 1 ? gap : 0) + safeAreaBottom.value
})

const pageShellStyle = computed(() => ({
  height: `${windowHeight.value || 667}px`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#FFFFFF'
}))

const scrollBodyHeight = computed(() => {
  if (!windowHeight.value) return 400
  const footerH = footerHeightPx.value || footerHeightFallback.value
  return Math.max(windowHeight.value - headerHeightPx.value - footerH, 200)
})

const footerBarStyle = computed(() => ({
  flexShrink: '0',
  paddingTop: '12px',
  paddingLeft: '16px',
  paddingRight: '16px'
}))

const measurePageLayout = () => {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    if (instance?.proxy) {
      query.in(instance.proxy)
    }
    query.select('.trip-create-header').boundingClientRect()
    query.select('.trip-create-footer').boundingClientRect()
    query.exec(results => {
      const headerRect = results?.[0]
      const footerRect = results?.[1]
      if (headerRect && headerRect.height > 0) {
        headerHeightPx.value = headerRect.height
      }
      if (footerRect && footerRect.height > 0) {
        footerHeightPx.value = footerRect.height
      }
    })
  })
}

const initPageMetrics = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    windowHeight.value = systemInfo.windowHeight || 0
    safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    if (menuButtonInfo) {
      capsuleBottom.value = menuButtonInfo.bottom
    }
    // #endif
  } catch {
    /* ignore */
  }
  footerHeightPx.value = footerHeightFallback.value
  measurePageLayout()
}

onMounted(() => {
  initPageMetrics()
})

onReady(() => {
  initPageMetrics()
})

watch([isEdit, canUpdateTrip, canDeleteTrip], () => {
  footerHeightPx.value = footerHeightFallback.value
  nextTick(() => measurePageLayout())
})

// 封面图相关
const originalCoverUrl = ref('')
const originalCoverFileId = ref<string | undefined>()
const { uploadFiles, chooseImages, resetUploads } = useImageUpload()

const displayCoverUrl = computed(() => {
  if (uploadFiles.value.length > 0) {
    const file = uploadFiles.value[0]
    return file.status === 'uploaded' && getImagePreviewUrl(file)
      ? getImagePreviewUrl(file)
      : file.localPath
  }
  return originalCoverUrl.value
})

const isUploadingCover = computed(() => {
  if (uploadFiles.value.length > 0) {
    return uploadFiles.value[0].status === 'uploading' || uploadFiles.value[0].status === 'waiting'
  }
  return false
})

const isCoverUploadFailed = computed(() => {
  if (uploadFiles.value.length > 0) {
    return uploadFiles.value[0].status === 'failed'
  }
  return false
})

const coverUploadError = computed(() => {
  if (uploadFiles.value.length > 0) {
    return uploadFiles.value[0].error || ''
  }
  return ''
})

const uploadProgress = computed(() => {
  if (uploadFiles.value.length > 0) {
    return uploadFiles.value[0].progress || 0
  }
  return 0
})

const coverUploadStatusText = computed(() => {
  return uploadProgress.value > 0 ? '上传封面中' : '准备上传'
})

watch(
  () => uploadFiles.value,
  files => {
    if (files.length > 0) {
      const file = files[0]
      if (file.status === 'uploaded' && file.fileId) {
        form.value.coverFileId = file.fileId
      } else if (file.status === 'failed') {
        uni.showToast({ title: file.error || '封面上传失败', icon: 'none' })
        form.value.coverFileId = originalCoverFileId.value
      }
    }
  },
  { deep: true }
)

const onChooseCover = () => {
  if (isEdit.value && !canUpdateTrip.value) {
    uni.showToast({ title: '你没有修改旅行信息的权限', icon: 'none' })
    return
  }
  if (isUploadingCover.value) return
  resetUploads()
  chooseImages(1, 'TRIP_COVER', tripId.value || undefined)
}

const onClearCover = () => {
  if (isEdit.value && !canUpdateTrip.value) {
    uni.showToast({ title: '你没有修改旅行信息的权限', icon: 'none' })
    return
  }
  resetUploads()
  originalCoverUrl.value = ''
  originalCoverFileId.value = undefined
  form.value.coverFileId = undefined
}

const clearFieldError = (key: keyof FormErrors) => {
  if (formErrors.value[key]) {
    formErrors.value = { ...formErrors.value, [key]: undefined }
  }
  if (key === 'startDate' || key === 'endDate') {
    formErrors.value = {
      ...formErrors.value,
      startDate: undefined,
      endDate: undefined,
      dateRange: undefined
    }
  }
}

const validateForm = (): boolean => {
  const errors: FormErrors = {}

  if (!form.value.title.trim()) {
    errors.title = '请输入旅行名称'
  }
  if (!form.value.startDate) {
    errors.startDate = '请选择开始日期'
  }
  if (!form.value.endDate) {
    errors.endDate = '请选择结束日期'
  }
  if (form.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate) {
    errors.dateRange = '结束日期不能早于开始日期'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const CONTENT_SECURITY_REJECTED_CODE = 42225
const CONTENT_SECURITY_REJECTED_MESSAGE = '你发布的内容含违规信息'

const getSubmitErrorMessage = (error: unknown) => {
  if (error instanceof HttpError && error.code === CONTENT_SECURITY_REJECTED_CODE) {
    return CONTENT_SECURITY_REJECTED_MESSAGE
  }
  return '操作失败，请稍后重试'
}

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const onOpenActivityLog = () => {
  if (!tripId.value) return
  uni.navigateTo({ url: `/pages/trip/activity-log?tripId=${tripId.value}` })
}

onLoad(options => {
  if (!guardProtectedPage()) return
  initPageMetrics()
  const id = options?.id
  if (typeof id === 'string' && id) {
    tripId.value = id
    fetchTripDetail()
  }
})

const fetchTripDetail = async () => {
  try {
    pageLoading.value = true
    const trip = await TripService.getTripDetail(tripId.value)
    tripAccess.value = trip.access ?? null
    form.value = {
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverFileId: trip.coverPhoto?.fileId,
      baseCurrency: trip.baseCurrency || 'CNY'
    }
    selectedDestination.value = parseDestinationFromTrip(trip)
    originalCoverFileId.value = trip.coverPhoto?.fileId
    if (getTripCoverPreviewUrl(trip)) {
      originalCoverUrl.value = getTripCoverPreviewUrl(trip)
    }
  } catch (error) {
    console.error('Fetch trip detail failed:', error)
    uni.showToast({ title: '旅行加载失败', icon: 'none' })
  } finally {
    pageLoading.value = false
  }
}

const isDateValue = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const getPickerStringValue = (e: PickerChangeEvent) => String(e?.detail?.value ?? '')

const onStartDateChange = (e: PickerChangeEvent) => {
  const startDate = getPickerStringValue(e)
  if (!isDateValue(startDate)) {
    console.warn('[trip:create] invalid start date picker value', e)
    return
  }
  form.value.startDate = startDate
  if (form.value.endDate && form.value.endDate < startDate) {
    form.value.endDate = ''
  }
  clearFieldError('startDate')
}

const onEndDateChange = (e: PickerChangeEvent) => {
  const endDate = getPickerStringValue(e)
  if (!isDateValue(endDate)) {
    console.warn('[trip:create] invalid end date picker value', e)
    return
  }
  form.value.endDate = endDate
  clearFieldError('endDate')
}

const onSubmit = async () => {
  if (isEdit.value && !canUpdateTrip.value) {
    uni.showToast({ title: '你没有保存修改的权限', icon: 'none' })
    return
  }
  if (submitLoading.value || !canSubmit.value) return
  if (!validateForm()) {
    const firstError =
      formErrors.value.title ||
      formErrors.value.dateRange ||
      formErrors.value.startDate ||
      formErrors.value.endDate
    if (firstError) {
      uni.showToast({ title: firstError, icon: 'none' })
    }
    return
  }
  if (isUploadingCover.value) {
    uni.showToast({ title: '封面图正在上传中，请稍候', icon: 'none' })
    return
  }
  if (isCoverUploadFailed.value) {
    uni.showToast({ title: '请重新选择封面或清除失败图片', icon: 'none' })
    return
  }

  try {
    submitLoading.value = true
    const payload: CreateTripRequest = {
      ...form.value,
      ...buildDestinationSubmitPayload(selectedDestination.value)
    }
    if (isEdit.value) {
      await TripService.updateTrip(tripId.value, payload, { noToast: true })
      markTripListDirty()
      uni.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: `/pages/trip/detail?id=${tripId.value}` })
      }, 800)
    } else {
      const res = await TripService.createTrip(payload, { noToast: true })
      markTripListDirty()
      uni.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: `/pages/trip/detail?id=${res.id}` })
      }, 800)
    }
  } catch (error) {
    console.error('Create trip failed:', error)
    uni.showToast({ title: getSubmitErrorMessage(error), icon: 'none' })
    submitLoading.value = false
  }
}

const onDeleteTrip = () => {
  if (submitLoading.value) return
  if (!canDeleteTrip.value) {
    uni.showToast({ title: '你没有删除旅行的权限', icon: 'none' })
    return
  }
  uni.showModal({
    title: '删除旅行',
    content: '确定要删除这次旅行吗？相关行程节点、开支和日志也会被删除。',
    confirmColor: '#EF4444',
    success: async res => {
      if (!res.confirm) return

      try {
        submitLoading.value = true
        await TripService.deleteTrip(tripId.value)
        markTripListDirty()
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } catch (error) {
        console.error('Delete trip failed:', error)
        uni.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
        submitLoading.value = false
      }
    }
  })
}
</script>

<style scoped>
.trip-create-page {
  width: 100%;
  box-sizing: border-box;
}

.trip-create-scroll {
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* 16:9 比例盒：子节点均为 absolute，不能依赖 Uno aspect-*（小程序端不产出） */
.trip-create-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  overflow: hidden;
  box-sizing: border-box;
}

.trip-create-cover__inner {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.trip-create-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.trip-create-footer-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: transform 150ms ease;
}

.trip-create-footer-btn:active:not(.trip-create-footer-btn--disabled) {
  transform: scale(0.98);
}

.trip-create-footer-btn__text {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

.trip-create-footer-btn--primary {
  background-color: #4F7DFF;
  box-shadow: 0 4px 14px rgba(79, 125, 255, 0.25);
}

.trip-create-footer-btn--primary .trip-create-footer-btn__text {
  color: #ffffff;
}

.trip-create-footer-btn--danger {
  background-color: #EF4444;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.2);
}

.trip-create-footer-btn--danger .trip-create-footer-btn__text {
  color: #ffffff;
}

.trip-create-footer-btn--disabled {
  opacity: 0.5;
}
</style>
