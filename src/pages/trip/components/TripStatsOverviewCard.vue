<template>
  <view class="px-5 mt-3 relative z-20 mb-2">
    <view
      class="glass-surface rounded-[20px] px-4 py-4"
      :style="{ boxShadow: glassShadow }"
    >
      <view class="flex items-stretch justify-around">
        <view class="flex flex-col items-center justify-center flex-1 min-w-0">
          <view class="h-5 flex-center gap-1.5 mb-1">
            <view class="i-carbon-wallet text-brand text-base shrink-0" />
            <text class="text-[11px] leading-none text-muted">总花费</text>
            <view
              v-if="hasGroupExpenses"
              class="px-1 py-px rounded-full bg-successBg text-success text-[10px] font-medium leading-tight"
            >
              AA
            </view>
          </view>
          <text class="h-6 text-base leading-6 font-semibold text-primary truncate max-w-full">
            {{ totalExpenseText }}
          </text>
        </view>

        <view class="w-px h-10 bg-border shrink-0" />

        <view class="flex flex-col items-center justify-center flex-1 min-w-0">
          <view class="h-5 flex-center gap-1.5 mb-1">
            <view class="i-carbon-map text-brand text-base shrink-0" />
            <text class="text-[11px] leading-none text-muted">行程</text>
          </view>
          <text class="h-6 text-base leading-6 font-semibold text-primary">{{ nodeCount }} 个</text>
        </view>

        <view class="w-px h-10 bg-border shrink-0" />

        <view class="flex flex-col items-center justify-center flex-1 min-w-0">
          <view class="h-5 flex-center gap-1.5 mb-1">
            <view class="i-carbon-book text-brand text-base shrink-0" />
            <text class="text-[11px] leading-none text-muted">日志</text>
          </view>
          <text class="h-6 text-base leading-6 font-semibold text-primary">{{ journalCount }} 篇</text>
        </view>
      </view>

      <!-- AA 结算入口（仅有群组支出时显示） -->
      <view
        v-if="hasGroupExpenses"
        class="mt-3 pt-3 border-t border-warm-border/60 flex items-center justify-between active:scale-[0.98] transition-transform"
        @click="emit('showSettlement')"
      >
        <view class="flex items-center gap-1.5">
          <view class="i-carbon-group-account text-success text-sm" />
          <text class="text-xs text-secondary">AA 结算</text>
        </view>
        <view class="flex items-center gap-1">
          <text class="text-xs text-muted">查看分摊明细</text>
          <view class="i-carbon-chevron-right text-muted text-[11px]" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DESIGN_SHADOWS } from '@/constants/designTokens'
import { formatCurrency } from '@/utils/format'

const glassShadow = DESIGN_SHADOWS.glass

const props = withDefaults(
  defineProps<{
    totalCny?: string
    nodeCount?: number
    journalCount?: number
    hasGroupExpenses?: boolean
  }>(),
  {
    totalCny: '0',
    nodeCount: 0,
    journalCount: 0,
    hasGroupExpenses: false
  }
)

const emit = defineEmits<{
  (e: 'showSettlement'): void
}>()

const totalExpenseText = computed(() => {
  const num = Number(props.totalCny)
  if (!props.totalCny || Number.isNaN(num)) return '¥0.00'
  if (num >= 1000) {
    return `¥${num.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`
  }
  return formatCurrency(props.totalCny)
})
</script>
