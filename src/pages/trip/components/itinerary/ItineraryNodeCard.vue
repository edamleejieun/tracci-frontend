<template>
  <view class="relative pl-1">
    <!-- 时间线圆点 -->
    <view
      class="absolute w-2.5 h-2.5 rounded-full border-2 box-border z-10"
      :class="dotClass"
      style="left: -24px; top: 36rpx; transform: translateX(-50%)"
    >
      <view
        v-if="status === 'completed'"
        class="i-carbon-checkmark text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]"
      />
    </view>

    <!-- 节点卡片 -->
    <view
      class="node-card p-4 transition-all active:scale-[0.995] mb-3"
      :class="cardClass"
      @click="onCardTap"
    >
      <view class="flex items-start justify-between gap-2">
        <view class="flex-1 min-w-0">
          <!-- 时间 + 类型 + 状态 -->
          <view class="flex items-center flex-wrap gap-2 mb-1.5">
            <text class="text-xs font-medium" :class="timeTextClass">{{ timeDisplay }}</text>
            <view
              class="px-2 py-0.5 rounded-full text-[10px] font-medium"
              :style="{ backgroundColor: typeStyle.bg, color: typeStyle.text }"
            >
              {{ typeStyle.label }}
            </view>
            <view
              v-if="status === 'current'"
              class="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-medium"
            >
              进行中
            </view>
            <view
              v-else-if="status === 'completed'"
              class="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-medium"
            >
              已完成
            </view>
            <view
              v-else-if="status === 'upcoming' || status === 'pending'"
              class="px-2 py-0.5 rounded-full bg-subtle text-muted text-[10px] font-medium"
            >
              未开始
            </view>
          </view>

          <!-- 标题 -->
          <text
            class="text-[15px] font-medium block mb-0.5"
            :class="titleClass"
          >
            {{ displayName }}
          </text>

          <!-- 地点 -->
          <view v-if="locationDisplayText" class="flex items-center gap-1 mb-1">
            <view class="i-carbon-location text-muted text-xs shrink-0" />
            <text class="text-xs flex-1" :class="mutedTextClass">{{ locationDisplayText }}</text>
          </view>

          <!-- 类型扩展摘要（航班号/车次/确认号等） -->
          <text
            v-if="detailsSummary"
            class="text-xs leading-relaxed line-clamp-2 mb-0.5"
            :class="mutedTextClass"
          >
            {{ detailsSummary }}
          </text>

          <!-- 备注摘要 -->
          <text
            v-if="node.note"
            class="text-xs leading-relaxed line-clamp-2"
            :class="mutedTextClass"
          >
            {{ node.note }}
          </text>
        </view>

        <!-- 更多 -->
        <view
          class="w-8 h-8 rounded-full flex-center shrink-0 active:bg-subtle transition-colors"
          @click.stop="onMore"
        >
          <view class="i-carbon-overflow-menu-vertical text-muted text-base" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getNodeTypeStyle } from '@/constants/designTokens'
import {
  formatNodeDetailsSummary,
  transportModeLabel,
  type ItineraryNode
} from '@/types/itinerary'
import type { ItineraryNodeStatus } from '@/utils/itineraryStatus'
import { getNodeDisplayName, getNodeLocationDisplayText } from '@/utils/nodeLocation'

const props = withDefaults(
  defineProps<{
    node: ItineraryNode
    status?: ItineraryNodeStatus
    isFirst?: boolean
    isLast?: boolean
  }>(),
  {
    status: 'upcoming',
    isFirst: false,
    isLast: false
  }
)

const emit = defineEmits<{
  (e: 'edit', node: ItineraryNode): void
  (e: 'delete', node: ItineraryNode): void
  (e: 'moveUp', node: ItineraryNode): void
  (e: 'moveDown', node: ItineraryNode): void
}>()

const typeStyle = computed(() => {
  const base = getNodeTypeStyle(props.node.type)
  if (props.node.type === 'transport') {
    const modeLabel = transportModeLabel(props.node.details?.mode)
    if (modeLabel) {
      return { ...base, label: modeLabel }
    }
  }
  return base
})

const locationDisplayText = computed(() => getNodeLocationDisplayText(props.node))

const displayName = computed(() => getNodeDisplayName(props.node))

const detailsSummary = computed(() => formatNodeDetailsSummary(props.node))

const timeDisplay = computed(() => {
  if (props.node.startTime && props.node.endTime) {
    return `${props.node.startTime} - ${props.node.endTime}`
  }
  if (props.node.startTime) return props.node.startTime
  return '时间待定'
})

const dotClass = computed(() => {
  switch (props.status) {
    case 'completed':
      return 'bg-[#2E7D32] border-[#2E7D32]'
    case 'current':
      return 'bg-brand border-brand'
    case 'upcoming':
      return 'bg-white border-brand'
    default:
      return 'bg-background border-warm-border'
  }
})

const cardClass = computed(() => {
  if (props.status === 'current') return 'ring-1 ring-brand/20'
  if (props.status === 'completed') return 'opacity-80'
  return ''
})

const titleClass = computed(() =>
  props.status === 'completed'
    ? 'text-muted line-through decoration-[#C4BEB5]'
    : 'text-primary'
)

const timeTextClass = computed(() =>
  props.status === 'completed' ? 'text-muted' : 'text-secondary'
)

const mutedTextClass = computed(() =>
  props.status === 'completed' ? 'text-[#C4BEB5]' : 'text-muted'
)

const onCardTap = () => {
  emit('edit', props.node)
}

const onMore = () => {
  const itemList: string[] = ['编辑']
  if (!props.isFirst) itemList.push('上移')
  if (!props.isLast) itemList.push('下移')
  itemList.push('删除')

  uni.showActionSheet({
    itemList,
    success: res => {
      const action = itemList[res.tapIndex]
      if (action === '编辑') emit('edit', props.node)
      else if (action === '上移') emit('moveUp', props.node)
      else if (action === '下移') emit('moveDown', props.node)
      else if (action === '删除') emit('delete', props.node)
    }
  })
}
</script>

<style scoped>
.node-card {
  border-radius: 20px;
  background: #fff;
  box-shadow: inset 0 -1px 0 rgba(237, 232, 226, 0.78);
}
</style>
