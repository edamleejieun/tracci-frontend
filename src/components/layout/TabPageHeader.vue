<template>
  <view class="px-5 pb-4" :style="{ paddingTop: `${insetTop}px` }">
    <text class="text-2xl font-semibold text-primary tracking-tight block">{{ title }}</text>
    <text v-if="description" class="text-[13px] text-secondary mt-1 block">{{ description }}</text>
  </view>
</template>

<script setup lang="ts">
import { usePageTopInset } from '@/composables/usePageTopInset'

defineProps<{
  title: string
  description?: string
}>()

const { insetTop } = usePageTopInset()
</script>
