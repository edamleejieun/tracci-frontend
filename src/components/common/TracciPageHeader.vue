<template>
  <view
    class="sticky top-0 z-30 bg-background border-b border-subtle"
    :style="{ paddingTop: navPaddingTop }"
  >
    <view class="flex items-center gap-1 px-4 pb-3 min-h-[44px]">
      <view
        class="w-10 h-10 shrink-0 flex-center rounded-full active:bg-subtle transition-colors -ml-2"
        @click="emit('back')"
      >
        <view class="i-carbon-chevron-left text-xl text-primary" />
      </view>

      <view class="flex-1 min-w-0">
        <text v-if="titleEn" class="text-[11px] text-muted uppercase tracking-wider block">
          {{ titleEn }}
        </text>
        <text class="text-base font-semibold text-primary tracking-tight block truncate">
          {{ title }}
        </text>
        <text
          v-if="subtitle"
          class="text-[12px] text-secondary block mt-0.5 truncate"
        >
          {{ subtitle }}
        </text>
      </view>

      <view class="shrink-0 flex-center">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** 可选英文主标题（统计/导出页双语风格） */
    titleEn?: string
  }>(),
  {
    subtitle: '',
    titleEn: ''
  }
)

const emit = defineEmits<{
  (e: 'back'): void
}>()

const statusBarHeight = ref(0)
const capsuleBottom = ref(0)

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

const navPaddingTop = computed(() => {
  if (capsuleBottom.value) return `${capsuleBottom.value + 4}px`
  return `${statusBarHeight.value + 8}px`
})
</script>
