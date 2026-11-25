<template>
  <view class="px-5 mt-3">
    <view class="bg-card rounded-[20px] p-5" :style="{ boxShadow: '0 2px 16px -4px rgba(139, 115, 85, 0.06)' }">
      <!-- Title skeleton -->
      <view class="flex items-center justify-between mb-4">
        <view class="w-24 h-5 bg-subtle rounded-full animate-pulse" />
        <view class="w-16 h-4 bg-subtle rounded-full animate-pulse" />
      </view>

      <!-- Summary card skeleton -->
      <view class="rounded-2xl p-4 mb-4" style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)">
        <view class="flex items-start justify-between mb-3">
          <view class="flex-1">
            <view class="w-32 h-4 bg-[#E8E4DF] rounded-full animate-pulse mb-2" />
            <view class="w-20 h-3 bg-[#E8E4DF] rounded-full animate-pulse" />
          </view>
          <view class="w-14 h-14 rounded-2xl bg-[#E8E4DF] animate-pulse" />
        </view>
        <view class="w-20 h-5 bg-[#E8E4DF] rounded-full animate-pulse mb-1" />
        <view class="w-28 h-8 bg-[#E8E4DF] rounded-full animate-pulse mb-3" />
        <view class="w-full h-10 rounded-xl bg-[#E8E4DF]/50 animate-pulse" />
      </view>

      <!-- Daily cards skeleton -->
      <view class="w-16 h-4 bg-subtle rounded-full animate-pulse mb-3" />
      <scroll-view scroll-x class="whitespace-nowrap w-full" :show-scrollbar="false">
        <view class="flex gap-2" style="display: inline-flex">
          <view
            v-for="i in 4"
            :key="i"
            class="weather-skeleton-card bg-subtle rounded-2xl p-3 flex flex-col items-center animate-pulse"
          >
            <view class="w-10 h-3 bg-[#E8E4DF] rounded-full mb-1 mx-auto" />
            <view class="w-8 h-3 bg-[#E8E4DF] rounded-full mb-2 mx-auto" />
            <view class="w-8 h-8 rounded-full bg-[#E8E4DF] mx-auto mb-2" />
            <view class="w-14 h-4 bg-[#E8E4DF] rounded-full mx-auto" />
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.weather-skeleton-card {
  box-sizing: border-box;
  display: inline-block;
  width: 176rpx;
  min-width: 176rpx;
  max-width: 176rpx;
  height: 164rpx;
  min-height: 164rpx;
  max-height: 164rpx;
  margin-right: 16rpx;
  overflow: hidden;
}
</style>
