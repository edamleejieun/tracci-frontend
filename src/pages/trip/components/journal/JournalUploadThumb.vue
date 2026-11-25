<template>
  <view class="relative w-20 h-20 rounded-xl overflow-hidden bg-subtle">
    <image
      v-if="displaySrc && !failed"
      :src="displaySrc"
      class="w-full h-full"
      mode="aspectFill"
      :class="{ 'opacity-50': file.status !== 'uploaded' }"
      lazy-load
      fade-show
      @error="failed = true"
    />
    <view v-else class="w-full h-full flex-col-center bg-subtle">
      <view class="i-carbon-image text-xl text-[#C4BEB5]" />
    </view>

    <view
      v-if="file.status === 'uploading' || file.status === 'waiting'"
      class="absolute inset-0 bg-black/30 flex-center flex-col"
    >
      <view class="i-carbon-circle-dash animate-spin text-white text-lg mb-1" />
      <text class="text-[10px] text-white">{{ file.progress }}%</text>
    </view>

    <view
      v-if="file.status === 'failed'"
      class="absolute inset-0 bg-black/50 flex-center flex-col"
      @click.stop="emit('retry')"
    >
      <view class="i-carbon-warning text-red-400 text-lg mb-1" />
      <text class="text-[10px] text-white">重试</text>
    </view>

    <view
      class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex-center z-10"
      @click.stop="emit('remove')"
    >
      <view class="i-carbon-close text-white text-xs" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LocalUploadFile } from '@/types/file'
import {
  getImageDisplayUrlCandidates,
  getImageThumbnailUrl,
  getLocalUploadDisplayUrl,
  resolveImageSrcFromCandidates
} from '@/utils/image'

const props = defineProps<{
  file: LocalUploadFile
}>()

const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'retry'): void
}>()

const failed = ref(false)
const displaySrc = ref('')
let resolveSeq = 0

const resolveDisplay = async () => {
  const seq = ++resolveSeq
  failed.value = false

  const local = props.file.localPath
  if (local && props.file.status !== 'uploaded') {
    displaySrc.value = local
    return
  }

  const candidates = [
    ...getImageDisplayUrlCandidates(props.file),
    getLocalUploadDisplayUrl(props.file)
  ].filter(Boolean)
  const unique = [...new Set(candidates)] as string[]

  const src = await resolveImageSrcFromCandidates(unique)
  if (seq !== resolveSeq) return
  displaySrc.value = src
  if (!src) failed.value = true
}

watch(
  () => [props.file.localPath, props.file.status, getImageThumbnailUrl(props.file)],
  resolveDisplay,
  { immediate: true }
)
</script>
