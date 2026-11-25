<template>
  <view class="day-tab-content">
    <!-- ========== 行程 ========== -->
    <view v-if="activeTab === 'itinerary'" class="day-section">
      <view class="section-body">
        <view
          v-if="sortedNodes.length === 0"
          class="rounded-2xl bg-warm-surface/60 py-8 px-4 text-center"
        >
          <text class="text-sm text-muted block mb-4">这一天还没有安排</text>
          <view
            v-if="!readonly && !isFutureDay"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand/10 text-brand text-[13px] font-medium active:scale-95 transition-transform"
            @click="emit('addNode')"
          >
            <view class="i-carbon-add text-sm" />
            <text>添加行程</text>
          </view>
        </view>

        <template v-else>
          <view class="relative ml-4 pl-6">
            <view
              class="absolute left-0 top-2 bottom-2 w-px"
              style="background: linear-gradient(to bottom, rgba(229,229,234,0.8), rgba(229,229,234,0.4), transparent)"
            />

            <ItineraryNodeCard
              v-for="(node, nodeIdx) in sortedNodes"
              :key="node.id"
              :node="node"
              :status="nodeStatusMap[node.id]"
              :is-first="nodeIdx === 0"
              :is-last="nodeIdx === sortedNodes.length - 1"
              @edit="!readonly && emit('editNode', node)"
              @delete="!readonly && emit('deleteNode', node)"
              @move-up="!readonly && emit('moveUp', node, nodeIdx)"
              @move-down="!readonly && emit('moveDown', node, nodeIdx)"
            />

          </view>
        </template>
      </view>
    </view>

    <!-- ========== 开支 ========== -->
    <view v-if="activeTab === 'expense'" class="day-section">
      <view class="section-body">
        <TracciLoading v-if="loadingExpenses" text="加载开支中..." />
        <view
          v-else-if="expenses.length === 0"
          class="rounded-2xl bg-warm-surface/60 py-8 px-4 text-center"
        >
          <text class="text-sm text-muted block mb-4">暂无开支记录</text>
          <view
            v-if="!readonly && !isFutureDay"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand/10 text-brand text-[13px] font-medium active:scale-95 transition-transform"
            @click="emit('addExpense')"
          >
            <view class="i-carbon-add text-sm" />
            <text>记一笔</text>
          </view>
        </view>

        <view v-else class="space-y-2">
          <view
            v-for="item in expenses"
            :key="item.id"
            class="expense-row flex items-center gap-3 p-3 rounded-2xl bg-white active:scale-[0.99] transition-transform"
            :class="{ 'expense-row--group': isGroupExpenseScope(item.expenseScope) }"
            @click="!readonly && emit('editExpense', item)"
            @longpress="!readonly && emit('deleteExpense', item)"
          >
            <view
              class="w-9 h-9 rounded-xl flex-center text-base shrink-0"
              :style="{
                backgroundColor: `${getCategoryConfig(item.category).color}15`,
                color: getCategoryConfig(item.category).color
              }"
            >
              {{ getCategoryConfig(item.category).emoji }}
            </view>

            <view class="flex-1 min-w-0">
              <text class="text-[14px] font-medium text-primary block truncate">
                {{ item.note?.trim() || getCategoryConfig(item.category).name }}
              </text>
              <text class="text-xs text-muted block mt-0.5">{{ formatTime(item.spentAt) }}</text>
            </view>

            <view class="text-right shrink-0 flex items-center gap-1">
              <view
                v-if="isGroupExpenseScope(item.expenseScope)"
                class="i-carbon-group-account text-success text-[13px]"
              />
              <text class="text-[15px] font-semibold text-primary block">
                -¥{{ item.amountInput }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 日志 ========== -->
    <view v-if="activeTab === 'journal'" class="day-section">
      <view class="section-body">
        <TracciLoading v-if="loadingJournals" text="加载日志中..." />
        <view
          v-else-if="journals.length === 0"
          class="rounded-2xl bg-warm-surface/60 py-8 px-4 text-center"
        >
          <text class="text-sm text-muted block mb-4">暂无旅行日志</text>
          <view
            v-if="!readonly && !isFutureDay"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand/10 text-brand text-[13px] font-medium active:scale-95 transition-transform"
            @click="emit('addJournal')"
          >
            <view class="i-carbon-edit text-sm" />
            <text>写日志</text>
          </view>
        </view>

        <view v-else class="space-y-3">
          <JournalCard
            v-for="log in journals"
            :key="log.id"
            :log="log"
            @edit="!readonly && emit('editJournal', log)"
            @delete="!readonly && emit('deleteJournal', log)"
            @toggle-highlight="!readonly && emit('toggleHighlight', log)"
            @preview="(payload: { photos: any; index: number }) => emit('previewJournal', log, payload.photos, payload.index)"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TripDay, ItineraryNode } from '@/types/itinerary'
import type { TripStatus } from '@/types/trip'
import type { ExpenseItem } from '@/types/expense'
import { isGroupExpenseScope } from '@/types/expense'
import type { TravelLogItem } from '@/types/journal'
import { computeNodeStatuses } from '@/utils/itineraryStatus'
import { getCategoryConfig } from '@/constants/expense'
import TracciLoading from '@/components/common/TracciLoading.vue'
import ItineraryNodeCard from './itinerary/ItineraryNodeCard.vue'
import JournalCard from './journal/JournalCard.vue'

const props = defineProps<{
  day: TripDay
  activeTab: 'itinerary' | 'journal' | 'expense'
  expenses: ExpenseItem[]
  journals: TravelLogItem[]
  loadingExpenses?: boolean
  loadingJournals?: boolean
  tripStatus?: TripStatus
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'addNode'): void
  (e: 'editNode', node: ItineraryNode): void
  (e: 'deleteNode', node: ItineraryNode): void
  (e: 'moveUp', node: ItineraryNode, index: number): void
  (e: 'moveDown', node: ItineraryNode, index: number): void
  (e: 'addExpense'): void
  (e: 'editExpense', item: ExpenseItem): void
  (e: 'deleteExpense', item: ExpenseItem): void
  (e: 'addJournal'): void
  (e: 'editJournal', log: TravelLogItem): void
  (e: 'deleteJournal', log: TravelLogItem): void
  (e: 'toggleHighlight', log: TravelLogItem): void
  (e: 'previewJournal', log: TravelLogItem, photos: unknown[], index: number): void
}>()

/** 今天及过去的日期应始终提供添加入口；未来日期仅在有数据时提供 */
const isFutureDay = computed(() => {
  if (!props.day?.date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayStart = new Date(props.day.date.replace(/-/g, '/'))
  dayStart.setHours(0, 0, 0, 0)
  return dayStart.getTime() > today.getTime()
})

const sortedNodes = computed(() => {
  if (!props.day?.nodes) return []
  return [...props.day.nodes].sort((a, b) => a.sortOrder - b.sortOrder)
})

const nodeStatusMap = computed(() => {
  if (!props.day) return {}
  // 只读（含示例旅程）：节点态不按真实「今天」推算，避免固定剧本日期被墙钟带偏
  return computeNodeStatuses(props.day, props.tripStatus, {
    ignoreWallClock: !!props.readonly
  })
})

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

</script>

<style scoped>
.day-section {
  min-height: 160px;
}

.section-body {
  padding: 0 4px 14px;
}

/* 群组支出左侧强调色条 */
.expense-row {
  position: relative;
  overflow: hidden;
}

.expense-row--group::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: rgba(34, 197, 94, 0.35);
  border-radius: 0 2px 2px 0;
}
</style>
