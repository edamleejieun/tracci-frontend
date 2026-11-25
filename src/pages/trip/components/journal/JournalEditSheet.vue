<template>
  <TracciBottomSheet
    :model-value="modelValue"
    max-height="85vh"
    content-class="flex flex-col min-h-0"
    padding-bottom="0"
    :show-handle="true"
    :prevent-close="!!loading || isUploading || isPickingImage"
    @update:model-value="emit('update:modelValue', $event)"
  >
      <!-- 标题栏 -->
      <view class="flex items-center justify-between mb-4 shrink-0 min-h-8">
        <view class="w-8" />
        <text class="text-[17px] font-semibold text-primary">{{ initialData ? '编辑日志' : '写新日志' }}</text>
        <view class="flex items-center gap-1" @click="isHighlight = !isHighlight">
          <view
            :class="
              isHighlight ? 'i-carbon-star-filled text-brand' : 'i-carbon-star text-muted'
            "
            class="text-lg transition-colors"
          />
        </view>
      </view>

      <scroll-view
        scroll-y
        class="flex-1 min-h-0 mb-4"
        style="max-height: 58vh"
        @touchmove.stop="allowSheetScroll"
      >
        <!-- 内容输入区 -->
        <view class="sheet-field-block p-4 mb-4">
          <textarea
            v-model="content"
            class="w-full h-32 text-base text-primary leading-relaxed"
            placeholder="记录下这一刻的见闻与感受..."
            placeholder-class="text-muted"
            :maxlength="2000"
            :cursor-spacing="100"
            :show-confirm-bar="false"
          />
          <text class="text-xs text-muted block text-right mt-2">{{ content.length }}/2000</text>
        </view>

        <!-- 图片上传区 -->
        <view class="mb-4">
          <view class="flex items-center mb-2">
            <text class="text-sm font-medium text-primary">图片</text>
            <text class="text-xs text-muted ml-2">最多 9 张</text>
          </view>
          <view class="flex flex-wrap gap-2">
            <!-- 已有图片 (编辑模式) -->
            <view
              v-for="(photo, index) in existingPhotos"
              :key="photo.fileId"
              class="relative w-20 h-20"
            >
              <JournalPhotoThumb
                :photo="photo"
                class="w-full h-full rounded-xl overflow-hidden"
                custom-class="w-full h-full rounded-xl overflow-hidden"
                style="display: block; width: 100%; height: 100%"
                @click="previewExistingImage(index)"
              />
              <view
                class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex-center z-10"
                @click.stop="removeExistingPhoto(index)"
              >
                <view class="i-carbon-close text-white text-xs"></view>
              </view>
            </view>

            <!-- 新上传的图片 -->
            <JournalUploadThumb
              v-for="(file, index) in uploadFiles"
              :key="file.id"
              :file="file"
              @remove="removeFile(index)"
              @retry="retryUpload(index)"
            />

            <!-- 添加按钮 -->
            <view
              v-if="existingPhotos.length + uploadFiles.length < 9"
              class="w-20 h-20 sheet-upload flex-center flex-col active:opacity-80 transition-colors"
              @click="onAddImage"
            >
              <view class="i-carbon-add text-muted text-xl mb-1"></view>
              <text class="text-[10px] text-muted">添加图片</text>
            </view>
          </view>
        </view>

        <!-- 此刻心情 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-primary block mb-2">此刻心情</text>
          <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
            <view class="flex gap-2 pb-1">
              <view
                v-for="item in JOURNAL_MOOD_OPTIONS"
                :key="item.code"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all active:scale-95"
                :class="
                  selectedMood === item.code
                    ? 'bg-brand/10 border-brand'
                    : 'sheet-chip-idle border-transparent'
                "
                @click="toggleMood(item.code)"
              >
                <text class="text-base">{{ item.emoji }}</text>
                <text
                  class="text-[13px]"
                  :class="selectedMood === item.code ? 'text-brand font-medium' : 'text-muted'"
                >
                  {{ item.label }}
                </text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 其他信息区 -->
        <view class="flex flex-col gap-3">
          <!-- 日志时间 -->
          <view class="sheet-field-row flex items-center p-3">
            <view class="i-carbon-time text-secondary mr-3 text-lg"></view>
            <picker mode="date" :value="logDate" @change="onDateChange" class="mr-2">
              <text class="text-primary text-sm">{{ logDate }}</text>
            </picker>
            <picker mode="time" :value="logTimeStr" @change="onTimeChange" class="flex-1">
              <text class="text-primary text-sm">{{ logTimeStr }}</text>
            </picker>
          </view>

          <!-- 地点（POI 搜索） -->
          <PoiSearchField
            v-model="selectedPlace"
            precision="poi"
            :city="tripPoiSearchCity"
            :destination-scope="tripDestination"
            label="位置"
            :placeholder="tripPoiSearchCity ? `在${tripPoiSearchCity}搜索地点` : '搜索景点、餐厅或地址'"
          />

          <!-- 仅自己可见（仅多人协作行程展示，对齐 iOS visibilitySection） -->
          <view
            v-if="isCollaborative"
            class="sheet-field-row flex items-center justify-between p-3"
          >
            <view class="flex items-center gap-2 min-w-0 mr-3">
              <view class="i-carbon-locked text-secondary text-lg shrink-0" />
              <view class="min-w-0">
                <text class="text-sm font-medium text-primary block">仅自己可见</text>
                <text class="text-xs text-muted block">其他行程成员不会看到这篇日志</text>
              </view>
            </view>
            <view
              class="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0"
              :class="isPrivate ? 'bg-brand' : 'bg-[#E5E0D8]'"
              @click="isPrivate = !isPrivate"
            >
              <view
                class="w-5 h-5 rounded-full bg-white shadow transition-transform"
                :class="isPrivate ? 'translate-x-5' : 'translate-x-0'"
              />
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部安全区适配 & 保存按钮 -->
      <view class="safe-pb shrink-0 mt-2">
        <view
          class="w-full bg-brand text-white rounded-full py-4 flex-center font-medium text-lg transition-transform"
          :class="!canSave ? 'opacity-70' : 'active:scale-95'"
          @click="save"
        >
          <view
            v-if="props.loading || isUploading"
            class="i-carbon-circle-dash animate-spin mr-2"
          ></view>
          {{ saveButtonText }}
        </view>
      </view>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import PoiSearchField from '@/components/location/PoiSearchField.vue'
import JournalPhotoThumb from './JournalPhotoThumb.vue'
import JournalUploadThumb from './JournalUploadThumb.vue'
import type { TravelLogItem, CreateTravelLogRequest, UpdateTravelLogRequest } from '@/types/journal'
import type { JournalPhotoItem } from '@/types/file'
import type { PlaceInfo } from '@/types/location'
import type { TripDestination } from '@/types/trip'
import { useImageUpload } from '@/composables/useImageUpload'
import { getImageDisplayUrlCandidates, resolveImageSrcFromCandidates } from '@/utils/image'
import { enrichJournalPhotoWithAccessUrl, normalizeJournalPhotos } from '@/utils/journalPhoto'
import {
  buildJournalLocationSubmitPayload,
  parsePlaceFromJournal
} from '@/utils/journalLocation'
import { getTripPoiSearchCity, parseDestinationFromTrip } from '@/utils/destination'
import { utcToLocalDate, utcToLocalTime, localToUtcIso } from '@/utils/timezone'
import { TripService } from '@/services/trip'
import { FileService } from '@/services/file'
import { JOURNAL_MOOD_OPTIONS, type JournalMoodCode } from '@/constants/journal'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  initialData?: TravelLogItem | null
  tripId: string
  /** 新建时默认日期（YYYY-MM-DD），不传则使用当天 */
  defaultDate?: string
  /** 是否多人协作行程：仅协作行程展示「仅自己可见」开关 */
  isCollaborative?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: CreateTravelLogRequest | UpdateTravelLogRequest): void
}>()

const content = ref('')
const selectedPlace = ref<PlaceInfo | null>(null)
const tripPoiSearchCity = ref<string>()
const tripDestination = ref<TripDestination | null>(null)
const isHighlight = ref(false)
/** 仅自己可见（私密）；对齐 iOS JournalFormView 的 visibility 开关 */
const isPrivate = ref(false)
const selectedMood = ref<JournalMoodCode | null>(null)
const logDate = ref('')
const logTimeStr = ref('')

const allowSheetScroll = () => {}

const existingPhotos = ref<JournalPhotoItem[]>([])
const isPickingImage = ref(false)

const { uploadFiles, chooseImages, removeFile, retryUpload, resetUploads } = useImageUpload()

const isUploading = computed(() => {
  return uploadFiles.value.some(f => f.status === 'uploading' || f.status === 'waiting')
})

const hasFailedUploads = computed(() => {
  return uploadFiles.value.some(f => f.status === 'failed')
})

const canSave = computed(() => {
  if (props.loading || isUploading.value) return false
  if (hasFailedUploads.value) return false
  const hasContent = content.value.trim().length > 0
  const hasImages = existingPhotos.value.length > 0 || uploadFiles.value.length > 0
  return hasContent || hasImages
})

const saveButtonText = computed(() => {
  if (props.loading) return '保存中...'
  if (isUploading.value) return '图片上传中...'
  if (hasFailedUploads.value) return '有图片上传失败'
  return '发布日志'
})

const fetchTripScope = async () => {
  if (!props.tripId) return
  try {
    const trip = await TripService.getTripDetail(props.tripId)
    tripDestination.value = parseDestinationFromTrip(trip)
    tripPoiSearchCity.value = getTripPoiSearchCity(trip)
  } catch (error) {
    console.error('Fetch trip for journal POI scope failed:', error)
    tripDestination.value = null
    tripPoiSearchCity.value = undefined
  }
}

const resetForm = () => {
  content.value = ''
  selectedPlace.value = null
  isHighlight.value = false
  isPrivate.value = false
  selectedMood.value = null
  existingPhotos.value = []
  resetUploads()

  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, -1)
  const parts = localISOTime.split('T')
  logDate.value = props.defaultDate || parts[0]
  logTimeStr.value = parts[1].substring(0, 5)
}

watch(
  () => props.modelValue,
  async val => {
    if (!val) return

    await fetchTripScope()

    if (props.initialData) {
      content.value = props.initialData.content
      selectedPlace.value = parsePlaceFromJournal(props.initialData)
      isHighlight.value = props.initialData.isHighlight || false
      isPrivate.value = props.initialData.visibility === 'private'
      selectedMood.value = (props.initialData.mood as JournalMoodCode | null) || null
      existingPhotos.value = normalizeJournalPhotos(props.initialData.photos)
      resetUploads()

      if (props.initialData.occurredAt) {
        logDate.value = utcToLocalDate(props.initialData.occurredAt)
        logTimeStr.value = utcToLocalTime(props.initialData.occurredAt)
      }
    } else {
      resetForm()
    }
  }
)

const onDateChange = (e: { detail: { value: string } }) => {
  logDate.value = e.detail.value
}

const onTimeChange = (e: { detail: { value: string } }) => {
  logTimeStr.value = e.detail.value
}

const toggleMood = (code: JournalMoodCode) => {
  selectedMood.value = selectedMood.value === code ? null : code
}

const onAddImage = async () => {
  const currentTotal = existingPhotos.value.length + uploadFiles.value.length
  isPickingImage.value = true
  try {
    await chooseImages(9 - currentTotal, 'JOURNAL_PHOTO', props.tripId)
  } finally {
    isPickingImage.value = false
  }
}

const removeExistingPhoto = (index: number) => {
  existingPhotos.value.splice(index, 1)
}

const previewExistingImage = async (index: number) => {
  const enriched = await Promise.all(
    existingPhotos.value.map(p =>
      enrichJournalPhotoWithAccessUrl(p, fileId => FileService.getAccessUrl(fileId))
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

const save = () => {
  if (!canSave.value) {
    if (
      !content.value.trim() &&
      existingPhotos.value.length === 0 &&
      uploadFiles.value.length === 0
    ) {
      uni.showToast({ title: '写点什么或添加图片吧', icon: 'none' })
    }
    return
  }

  const occurredAt = localToUtcIso(logDate.value, logTimeStr.value)

  // 收集所有已完成上传的 fileIds（未完成上传的图片不发送，避免后端拒绝 PENDING 文件）
  const uploadedFileIds = uploadFiles.value
    .filter(f => f.status === 'uploaded' && f.fileId)
    .map(f => f.fileId as string)

  const fileIds = [
    ...existingPhotos.value.map(p => p.fileId),
    ...uploadedFileIds
  ]

  const locationPayload = buildJournalLocationSubmitPayload(selectedPlace.value, {
    clearOnEmpty: !!props.initialData
  })

  emit('save', {
    content: content.value.trim(),
    ...locationPayload,
    isHighlight: isHighlight.value,
    mood: selectedMood.value,
    occurredAt,
    fileIds,
    // 私密时发 'private'；取消私密时省略字段，由后端按默认（公开）处理
    visibility: isPrivate.value ? 'private' : undefined
  })
}
</script>

<style scoped>
.sheet-field-block {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.58);
}

.sheet-upload {
  border-radius: 14px;
  border: 1px dashed rgba(232, 228, 222, 0.95);
  background: rgba(255, 255, 255, 0.72);
}

.sheet-chip-idle {
  background: rgba(255, 255, 255, 0.72);
}

.sheet-field-row {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.58);
}
</style>
