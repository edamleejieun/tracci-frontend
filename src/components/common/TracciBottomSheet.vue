<template>
  <view
    v-if="mounted"
    class="fixed inset-0"
    :style="{ zIndex }"
  >
    <view
      class="sheet-mask absolute inset-0 transition-opacity duration-300"
      :class="animated ? 'opacity-100' : 'opacity-0'"
      @click="onMaskClick"
      @touchmove.stop.prevent="preventBackgroundMove"
    />

    <!-- fitContent：用 flex 贴底，面板高度随内容，避免 absolute 撑满留白 -->
    <view
      v-if="fitContent"
      class="absolute inset-0 flex flex-col justify-end pointer-events-none"
    >
      <view
        class="sheet-panel sheet-panel--fit w-full pointer-events-auto transition-transform duration-300 box-border"
        :class="[
          animated ? 'translate-y-0' : 'translate-y-full',
          contentClass
        ]"
        :style="panelStyle"
        @click.stop
        @touchstart="onPanelTouchStart"
        @touchmove.stop.prevent="onPanelTouchMove"
        @touchend="onPanelTouchEnd"
      >
        <view
          v-if="showHandle"
          class="w-12 h-1.5 bg-warm-divider rounded-full mx-auto mt-2 mb-3 shrink-0"
        />
        <view class="w-full shrink-0 box-border min-w-0">
          <slot />
        </view>
      </view>
    </view>

    <view
      v-else
      class="sheet-panel absolute bottom-0 left-0 right-0 rounded-t-[28px] flex flex-col transition-transform duration-300 box-border overflow-hidden w-full"
      :class="[
        animated ? 'translate-y-0' : 'translate-y-full',
        contentClass
      ]"
      :style="panelStyle"
      @click.stop
      @touchstart="onPanelTouchStart"
      @touchmove.stop.prevent="onPanelTouchMove"
      @touchend="onPanelTouchEnd"
    >
      <view
        v-if="showHandle"
        class="w-12 h-1.5 bg-warm-divider rounded-full mx-auto mt-2 mb-4 shrink-0"
      />
      <view class="w-full shrink-0 box-border min-w-0">
        <slot />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    showHandle?: boolean
    /** 如 85vh、70% */
    maxHeight?: string
    paddingX?: string
    paddingBottom?: string
    zIndex?: number
    preventClose?: boolean
    contentClass?: string
    /** 面板高度随内容收缩，避免短表单被撑出大块空白 */
    fitContent?: boolean
  }>(),
  {
    showHandle: true,
    maxHeight: '',
    paddingX: '24px',
    paddingBottom: '32px',
    zIndex: 50,
    preventClose: false,
    contentClass: '',
    fitContent: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const mounted = ref(false)
const animated = ref(false)
const swipeTranslateY = ref(0)
let touchStartY = 0
let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

const panelStyle = computed(() => {
  const style: Record<string, string> = {
    paddingLeft: props.paddingX,
    paddingRight: props.paddingX,
    paddingBottom: props.paddingBottom
  }
  if (props.maxHeight) {
    style.maxHeight = props.maxHeight
  }
  if (swipeTranslateY.value > 0) {
    style.transform = `translateY(${swipeTranslateY.value}px)`
  }
  return style
})

watch(
  () => props.modelValue,
  open => {
    if (openTimer) clearTimeout(openTimer)
    if (closeTimer) clearTimeout(closeTimer)

    if (open) {
      mounted.value = true
      nextTick(() => {
        openTimer = setTimeout(() => {
          animated.value = true
        }, 50)
      })
    } else {
      animated.value = false
      closeTimer = setTimeout(() => {
        mounted.value = false
      }, 300)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
})

const close = () => {
  if (props.preventClose) return
  emit('update:modelValue', false)
  emit('close')
}

const onMaskClick = () => {
  close()
}

const preventBackgroundMove = () => {}

/** 下拉手势关闭：记录起始触摸点 */
const onPanelTouchStart = (e: { touches?: Array<{ clientY: number }> }) => {
  if (props.preventClose) return
  const touch = e.touches?.[0]
  if (touch) {
    touchStartY = touch.clientY
  }
}

/** 下拉手势关闭：实时跟随位移（仅向下拖拽） */
const onPanelTouchMove = (e: { touches?: Array<{ clientY: number }> }) => {
  if (props.preventClose || touchStartY === 0) return
  const touch = e.touches?.[0]
  if (touch) {
    const deltaY = touch.clientY - touchStartY
    if (deltaY > 0) {
      swipeTranslateY.value = deltaY
    }
  }
}

/** 下拉手势关闭：超过阈值则关闭，否则回弹 */
const onPanelTouchEnd = () => {
  if (swipeTranslateY.value > 80) {
    close()
  }
  swipeTranslateY.value = 0
  touchStartY = 0
}
</script>

<style scoped>
.sheet-mask {
  background: rgba(47, 42, 37, 0.34);
}

.sheet-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 250, 248, 1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 -18px 42px -28px rgba(47, 42, 37, 0.42);
}

.sheet-panel--fit {
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  max-height: 90vh;
  overflow-y: auto;
  flex-shrink: 0;
}
</style>