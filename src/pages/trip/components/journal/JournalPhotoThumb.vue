<template>
  <view
    :class="customClass"
    class="journal-photo-thumb overflow-hidden"
    style="display: flex; width: 100%; height: 100%; min-height: inherit"
    @click="emit('click')"
  >
    <image
      v-if="displaySrc && !failed"
      :src="displaySrc"
      mode="aspectFill"
      lazy-load
      fade-show
      :show-menu-by-longpress="true"
      style="width: 100%; height: 100%; min-height: inherit; display: block; flex: 1"
      @load="onLoadSuccess"
      @error="onLoadError"
    />
    <view
      v-else
      class="w-full h-full flex-col-center bg-subtle"
      style="width: 100%; height: 100%; min-height: inherit; flex: 1"
    >
      <view class="i-carbon-image text-xl text-[#C4BEB5]" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JournalPhotoItem } from '@/types/file'
import { FileService } from '@/services/file'
import { getImageDisplayUrlCandidates, resolveImageSrcFromCandidates } from '@/utils/image'
import {
  enrichJournalPhotoWithAccessUrl,
  normalizeJournalPhoto
} from '@/utils/journalPhoto'

const props = defineProps<{
  photo: JournalPhotoItem
  customClass?: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const failed = ref(false)
const displaySrc = ref('')
const sourceCandidates = ref<string[]>([])
let resolveSeq = 0

const resolveDisplaySrc = async () => {
  const seq = ++resolveSeq
  failed.value = false

  const normalized = normalizeJournalPhoto(props.photo)
  if (!normalized) {
    displaySrc.value = ''
    failed.value = true
    return
  }

  let candidates = getImageDisplayUrlCandidates(normalized)
  if (!candidates.length) {
    const enriched = await enrichJournalPhotoWithAccessUrl(normalized, fileId =>
      FileService.getAccessUrl(fileId)
    )
    if (seq !== resolveSeq) return
    candidates = getImageDisplayUrlCandidates(enriched)
  }

  if (seq !== resolveSeq) return
  sourceCandidates.value = candidates

  if (candidates[0]) {
    displaySrc.value = candidates[0]
  } else {
    displaySrc.value = ''
    failed.value = true
    console.warn('[journalPhoto] all display candidates failed', {
      fileId: normalized.fileId,
      candidates
    })
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

watch(() => props.photo, resolveDisplaySrc, { immediate: true, deep: true })
</script>
