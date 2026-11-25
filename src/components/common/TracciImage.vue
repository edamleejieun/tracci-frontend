<template>
  <view
    :class="customClass"
    style="display: flex; width: 100%; height: 100%; min-height: inherit"
  >
    <image
      v-if="displaySrc && !failed"
      :src="displaySrc"
      :mode="mode"
      :lazy-load="lazyLoad"
      :fade-show="fadeShow"
      :show-menu-by-longpress="showMenuByLongpress"
      style="width: 100%; height: 100%; min-height: inherit; display: block; flex: 1"
      @load="onLoadSuccess"
      @error="onLoadError"
    />
    <slot v-else>
      <view class="w-full h-full flex-col-center bg-subtle" style="flex: 1">
        <view class="i-carbon-image text-2xl text-disabled" />
      </view>
    </slot>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BaseImageParams } from '@/utils/image'
import type { CoverPhoto } from '@/types/trip'
import { getImageDisplayUrlCandidates, resolveImageSrcFromCandidates } from '@/utils/image'

const props = withDefaults(
  defineProps<{
    image?: BaseImageParams | CoverPhoto | string | null
    urls?: string[]
    mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix' | 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right'
    customClass?: string
    /**
     * 微信原生 lazy-load：图片所在区域距离视口一定阈值内才加载。
     * 仅对小程序端生效，H5 端由浏览器原生懒加载负责。
     * 默认开启，避免首屏以外的图片抢占带宽。
     */
    lazyLoad?: boolean
    /**
     * 渐显动画：图片加载完成后淡入，避免空白闪烁。
     * 默认开启。
     */
    fadeShow?: boolean
    /**
     * 长按显示菜单（保存图片等），默认 false。
     * 日志、封面预览等场景由调用方按需开启。
     */
    showMenuByLongpress?: boolean
  }>(),
  {
    image: null,
    urls: () => [],
    mode: 'aspectFill',
    customClass: '',
    lazyLoad: true,
    fadeShow: true,
    showMenuByLongpress: false
  }
)

const failed = ref(false)
const displaySrc = ref('')
const sourceCandidates = ref<string[]>([])
let resolveSeq = 0

const resolveDisplaySrc = () => {
  const seq = ++resolveSeq
  failed.value = false

  const candidates = [
    ...props.urls,
    ...getImageDisplayUrlCandidates(props.image)
  ].filter(Boolean)
  sourceCandidates.value = [...new Set(candidates)]

  if (seq !== resolveSeq) return

  if (sourceCandidates.value[0]) {
    displaySrc.value = sourceCandidates.value[0]
  } else {
    displaySrc.value = ''
    failed.value = true
  }
}

const onLoadSuccess = () => {
  failed.value = false
}

const onLoadError = async () => {
  const seq = resolveSeq
  const failedSrc = displaySrc.value
  const fallbackSrc = await resolveImageSrcFromCandidates(sourceCandidates.value)
  if (seq !== resolveSeq) return

  if (fallbackSrc && fallbackSrc !== failedSrc) {
    displaySrc.value = fallbackSrc
    failed.value = false
    return
  }

  failed.value = true
  displaySrc.value = ''
}

watch(() => [props.image, props.urls], resolveDisplaySrc, { immediate: true, deep: true })
</script>
