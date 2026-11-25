<template>
  <view
    class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
    :class="
      transparent
        ? 'bg-transparent'
        : 'bg-background border-b border-subtle'
    "
  >
    <!-- 顶部状态栏安全区 -->
    <view class="w-full safe-pt" style="padding-top: env(safe-area-inset-top, 44px)"></view>

    <!-- 导航栏内容区 (高度 44px 适配大多数场景) -->
    <view class="h-11 px-4 flex items-center justify-between relative">
      <!-- 左侧操作区 -->
      <view class="w-16 flex items-center justify-start z-10" @click="handleBack">
        <view
          v-if="showBack"
          class="w-8 h-8 flex-center -ml-2 rounded-full active:bg-subtle transition-colors"
        >
          <view
            class="i-carbon-chevron-left text-2xl"
            :class="transparent ? 'text-white' : 'text-primary'"
          ></view>
        </view>
        <slot name="left"></slot>
      </view>

      <!-- 居中标题 -->
      <view class="absolute inset-0 flex-center pointer-events-none px-16">
        <text
          class="text-lg font-bold truncate transition-colors duration-300"
          :class="transparent ? 'text-white' : 'text-primary'"
        >
          {{ title }}
        </text>
      </view>

      <!-- 右侧操作区 -->
      <view class="w-16 flex items-center justify-end z-10">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    transparent?: boolean
  }>(),
  {
    title: '',
    showBack: false,
    transparent: false
  }
)

const emit = defineEmits<{
  (e: 'back'): void
}>()

const handleBack = () => {
  if (props.showBack) {
    emit('back')
    uni.navigateBack({ delta: 1 })
  }
}
</script>
