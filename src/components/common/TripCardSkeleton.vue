<template>
  <view class="card-base p-4 flex gap-4 mb-4">
    <!-- Cover thumbnail placeholder -->
    <view class="w-[88px] h-[88px] rounded-2xl skeleton-block flex-shrink-0" />

    <!-- Info placeholders -->
    <view class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
      <view>
        <!-- Title + badge -->
        <view class="flex items-center gap-2 mb-2">
          <view class="h-4 w-28 skeleton-block rounded" />
          <view class="h-4 w-12 skeleton-block rounded-full" />
        </view>
        <!-- Destination -->
        <view class="flex items-center gap-1 mb-1.5">
          <view class="w-3 h-3 skeleton-block rounded" />
          <view class="h-3 w-20 skeleton-block rounded" />
        </view>
        <!-- Date -->
        <view class="flex items-center gap-1">
          <view class="w-3 h-3 skeleton-block rounded" />
          <view class="h-3 w-24 skeleton-block rounded" />
        </view>
      </view>
      <!-- Stats -->
      <view class="flex items-center gap-2">
        <view class="h-3 w-8 skeleton-block rounded" />
        <view class="w-0.5 h-0.5 rounded-full bg-border" />
        <view class="h-3 w-12 skeleton-block rounded" />
      </view>
    </view>

    <!-- Chevron placeholder -->
    <view class="flex items-center">
      <view class="w-5 h-5 skeleton-block rounded" />
    </view>
  </view>
</template>

<script setup lang="ts">
// Skeleton placeholder for TripCard — no props needed
</script>

<style scoped>
.skeleton-block {
  background: linear-gradient(
    90deg,
    #f5f2ee 25%,
    #ede8e2 50%,
    #f5f2ee 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
    background: #ede8e2;
  }
}
</style>
