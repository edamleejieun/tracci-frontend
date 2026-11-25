<template>
  <view class="flex-col-center py-12 px-6 transition-opacity duration-300">
    <view class="i-carbon-circle-dash animate-spin text-primary text-3xl mb-4"></view>
    <text class="text-sm text-muted">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: '加载中...'
  }
)
</script>
