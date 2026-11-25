<!-- DESIGN_RADIUS.xxl → rounded-[28px]（skeleton 圆角对齐 featured card） -->
<template>
  <view class="featured-skeleton relative overflow-hidden rounded-[28px] mb-4 shadow-elevated">
    <view class="featured-skeleton__body relative h-[240px] flex flex-col justify-between p-5">
      <!-- Top pills -->
      <view class="flex items-center gap-2">
        <view class="h-6 w-16 skeleton-block rounded-full" />
        <view class="h-6 w-20 skeleton-block rounded-full" />
      </view>

      <!-- Bottom meta -->
      <view>
        <view class="h-8 w-40 skeleton-block rounded mb-3" />
        <view class="h-3.5 w-28 skeleton-block rounded mb-2" />
        <view class="h-3 w-32 skeleton-block rounded mb-4" />
        <view class="flex items-center gap-2">
          <view class="h-7 w-16 skeleton-block rounded-full" />
          <view class="h-7 w-14 skeleton-block rounded-full" />
          <view class="h-7 w-14 skeleton-block rounded-full" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// FeaturedTripCard 占位骨架，避免加载完成时大图卡跳动
</script>

<style scoped>
/* DESIGN_COLORS.warmDivider 系暖灰：#E8E2DA / #D9D2C8 / #CFC7BC */
.featured-skeleton {
  background: linear-gradient(140deg, #E8E2DA 0%, #D9D2C8 55%, #CFC7BC 100%);
}

.featured-skeleton__body {
  /* overlay 使用 textPrimary 的不同透明度 → rgba(47,42,37, xxx) */
  background: linear-gradient(
    to top,
    rgba(47, 42, 37, 0.28) 0%,
    rgba(47, 42, 37, 0.08) 45%,
    rgba(47, 42, 37, 0.04) 100%
  );
}

.skeleton-block {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.22) 25%,
    rgba(255, 255, 255, 0.38) 50%,
    rgba(255, 255, 255, 0.22) 75%
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
    background: rgba(255, 255, 255, 0.28);
  }
}
</style>
