<template>
  <view class="flex-col-center py-12 px-6 transition-opacity duration-300">
    <view class="i-carbon-warning text-disabled text-5xl mb-4"></view>
    <text class="text-lg font-medium text-primary mb-1">{{ title }}</text>
    <text class="text-sm text-secondary mb-6 text-center max-w-[80%]">{{ message }}</text>

    <TracciButton v-if="showRetry" size="sm" type="outline" @click="$emit('retry')">
      {{ retryText }}
    </TracciButton>
  </view>
</template>

<script setup lang="ts">
import TracciButton from './TracciButton.vue'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    showRetry?: boolean
    retryText?: string
  }>(),
  {
    title: '加载失败',
    message: '出了一点小问题，请稍后重试',
    showRetry: true,
    retryText: '重试'
  }
)

defineEmits<{
  (e: 'retry'): void
}>()
</script>
