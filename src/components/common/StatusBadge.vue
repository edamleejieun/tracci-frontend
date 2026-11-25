<template>
  <view
    class="status-badge"
    :class="[
      `status-badge--${variant}`,
      { 'status-badge--dot': showDot }
    ]"
  >
    <view
      v-if="showDot"
      class="status-badge__dot"
    />
    <text class="status-badge__text">
      <slot />
    </text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type StatusVariant = 'success' | 'warning' | 'coming-soon'

const props = withDefaults(
  defineProps<{
    variant?: StatusVariant
    /** 是否显示左侧小圆点 */
    dot?: boolean
  }>(),
  {
    variant: 'success',
    dot: true
  }
)

const showDot = computed(() => props.dot && props.variant !== 'coming-soon')
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.status-badge--success {
  background-color: rgba(34, 197, 94, 0.1);
}

.status-badge--warning,
.status-badge--coming-soon {
  background-color: rgba(245, 158, 11, 0.1);
}

.status-badge__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #22C55E;
}

.status-badge--warning .status-badge__dot {
  background-color: #F59E0B;
}

.status-badge__text {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

.status-badge--success .status-badge__text {
  color: #16A34A;
}

.status-badge--warning .status-badge__text,
.status-badge--coming-soon .status-badge__text {
  color: #B45309;
}
</style>
