<template>
  <view class="min-h-screen bg-background pb-safe">
    <TracciPageHeader title="旅程动态" @back="onBack" />

    <view class="px-5 pt-4">
      <ActivityLogList v-if="tripId" :key="tripId" :trip-id="tripId" />
      <view v-else class="py-20 flex-col-center">
        <view class="i-carbon-warning text-4xl text-disabled mb-3" />
        <text class="text-sm text-muted">缺少旅行信息</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TracciPageHeader from '@/components/common/TracciPageHeader.vue'
import ActivityLogList from './components/ActivityLogList.vue'

const tripId = ref('')

onLoad((options) => {
  if (options?.tripId) {
    tripId.value = String(options.tripId)
  }
})

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}
</script>
