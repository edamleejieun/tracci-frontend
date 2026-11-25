<template>
  <TracciBottomSheet
    :model-value="modelValue"
    max-height="70vh"
    padding-bottom="calc(24px + env(safe-area-inset-bottom))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="flex items-center justify-between mb-5">
      <text class="text-lg font-semibold text-primary">分享与导出</text>
      <view
        class="w-8 h-8 rounded-full bg-subtle flex-center active:opacity-80"
        @click="emit('update:modelValue', false)"
      >
        <view class="i-carbon-close text-secondary text-base" />
      </view>
    </view>

    <view class="flex flex-col gap-3">
      <view
        class="flex items-center gap-3 p-4 rounded-2xl bg-subtle/60 active:scale-[0.99] transition-transform"
        :class="actionBusy ? 'opacity-60' : ''"
        @click="handleSaveImage"
      >
        <view class="w-10 h-10 rounded-xl bg-white flex-center shrink-0">
          <view class="i-carbon-document-export text-brand text-lg" />
        </view>
        <view class="flex-1 min-w-0">
          <text class="text-sm font-medium text-primary block">导出行程单</text>
          <text class="text-xs text-muted block mt-0.5">生成行程单图片并保存到相册</text>
        </view>
      </view>

      <button
        class="share-forward-btn flex items-center gap-3 p-4 rounded-2xl bg-subtle/60 w-full text-left"
        open-type="share"
        @click="emit('update:modelValue', false)"
      >
        <view class="w-10 h-10 rounded-xl bg-white flex-center shrink-0">
          <view class="i-carbon-logo-wechat text-[#07C160] text-lg" />
        </view>
        <view class="flex-1 min-w-0">
          <text class="text-sm font-medium text-primary block">转发给好友</text>
          <text class="text-xs text-muted block mt-0.5">分享旅程卡片到微信</text>
        </view>
      </button>
    </view>

    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="itinerary-export-canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      :width="canvasWidth"
      :height="canvasHeight"
    />
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref, watch } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import { ExportService } from '@/services/export'
import type { ItineraryExportAssetsResponse } from '@/types/itineraryExport'
import { hasItineraryExportContent } from '@/utils/itineraryExportText'
import {
  ITINERARY_EXPORT_CANVAS_ID,
  estimateItineraryCanvasHeight,
  saveItineraryExportImageToAlbum
} from '@/utils/itineraryExportCanvas'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  modelValue: boolean
  tripId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const userStore = useUserStore()

const canvasId = ITINERARY_EXPORT_CANVAS_ID
const canvasWidth = 750
const canvasHeight = ref(1200)
const actionBusy = ref(false)
const cachedAssets = ref<ItineraryExportAssetsResponse | null>(null)

const instance = getCurrentInstance()

const loadAssets = async (): Promise<ItineraryExportAssetsResponse | null> => {
  if (cachedAssets.value) return cachedAssets.value
  if (!props.tripId) return null
  try {
    const assets = await ExportService.getItineraryExportAssets(props.tripId)
    cachedAssets.value = assets
    return assets
  } catch (error) {
    console.error('Load itinerary export assets failed:', error)
    uni.showToast({ title: '加载行程数据失败', icon: 'none' })
    return null
  }
}

watch(
  () => [props.modelValue, props.tripId] as const,
  ([visible, tripId]) => {
    if (visible && tripId) {
      cachedAssets.value = null
      void loadAssets()
    }
  }
)

const handleSaveImage = async () => {
  if (actionBusy.value) return
  actionBusy.value = true
  uni.showLoading({ title: '生成中...', mask: true })
  try {
    const assets = await loadAssets()
    if (!assets) return
    if (!hasItineraryExportContent(assets)) {
      uni.showToast({ title: '暂无行程安排', icon: 'none' })
      return
    }
    canvasHeight.value = estimateItineraryCanvasHeight(assets)
    await saveItineraryExportImageToAlbum(
      assets,
      instance?.proxy as WechatMiniprogram.Page.TrivialInstance | undefined,
      { creatorName: userStore.userInfo?.nickname || '旅人' }
    )
    uni.showToast({ title: '已保存到相册', icon: 'success' })
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Save itinerary image failed:', error)
    const message = error instanceof Error && error.message.includes('相册')
      ? '需要相册权限才能保存'
      : '保存失败，请重试'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    uni.hideLoading()
    actionBusy.value = false
  }
}
</script>

<style scoped>
.share-forward-btn {
  margin: 0;
  border: none;
  line-height: normal;
}

.share-forward-btn::after {
  border: none;
}

.itinerary-export-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}
</style>
