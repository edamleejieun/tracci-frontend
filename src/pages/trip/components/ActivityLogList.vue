<template>
  <view class="activity-log-page">
    <!-- 加载态 -->
    <TracciLoading v-if="loading && filteredLogs.length === 0" text="加载旅程动态..." />

    <!-- 错误态 -->
    <TracciError
      v-else-if="error && filteredLogs.length === 0"
      title="加载失败"
      message="无法获取旅程动态，请重试"
      @retry="fetchLogs(false)"
    />

    <!-- 无数据 -->
    <template v-else-if="!loading && !error && filteredLogs.length === 0">
      <view class="activity-empty p-8 text-center">
        <view class="w-20 h-20 mx-auto mb-4 rounded-full bg-warm-surface flex-center">
          <view class="i-carbon-activity text-3xl text-disabled" />
        </view>
        <text class="text-base font-medium text-primary block mb-2">暂无旅程动态</text>
        <text class="text-sm text-muted block leading-relaxed">
          行程、开支和旅行日志的编辑记录将在这里展示
        </text>
      </view>
    </template>

    <!-- 活动列表 -->
    <template v-else>
      <!-- 记录数 -->
      <view class="activity-count-bar">
        <text class="activity-count-text">共 {{ filteredLogs.length }} 条动态</text>
      </view>

      <!-- 时间线列表 -->
      <view class="activity-timeline">
        <view
          v-for="(log, index) in filteredLogs"
          :key="log.id"
          class="activity-entry"
        >
          <!-- 时间线节点 -->
          <view class="activity-timeline-node">
            <view class="activity-timeline-dot" />
            <view v-if="index < filteredLogs.length - 1" class="activity-timeline-line" />
          </view>

          <!-- 内容卡片 -->
          <view class="activity-card">
            <!-- 头部：头像 + 摘要 -->
            <view class="activity-card-header">
              <view class="activity-avatar">
                <text class="activity-avatar-text">{{ getInitial(log.actor.nickname) }}</text>
              </view>
              <view class="activity-card-body">
                <text class="activity-summary">
                  <text class="activity-summary-name">{{ log.actor.nickname }}</text>
                  {{ log.summary }}
                </text>
                <text class="activity-time">{{ formatTime(log.createdAt) }}</text>
              </view>
            </view>

            <!-- 字段变更 -->
            <view
              v-if="log.fieldChanges && log.fieldChanges.length > 0"
              class="activity-changes"
            >
              <view
                v-for="(change, cIndex) in log.fieldChanges"
                :key="cIndex"
                class="activity-change-row"
              >
                <text class="activity-change-field">{{ change.field }}</text>
                <view class="activity-change-arrow">
                  <view class="i-carbon-arrow-right" />
                </view>
                <text
                  v-if="change.oldValue"
                  class="activity-change-old"
                >{{ change.oldValue }}</text>
                <text
                  v-if="change.newValue"
                  class="activity-change-new"
                  :class="{ 'activity-change-new--added': !change.oldValue }"
                >{{ change.newValue }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="activity-load-more">
        <view
          class="activity-load-more-btn"
          :class="{ 'activity-load-more-btn--loading': loadingMore }"
          @click="loadMore"
        >
          <view v-if="loadingMore" class="i-carbon-circle-dash animate-spin mr-2" />
          <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TracciLoading from '@/components/common/TracciLoading.vue'
import TracciError from '@/components/common/TracciError.vue'
import { CollaborationService } from '@/services/collaboration'
import type { ActivityLog } from '@/types/collaboration'

/**
 * 服务端已默认只返回旅程内容动态；这里保留兜底过滤，兼容旧数据或旧服务端。
 */
const CONTENT_TARGET_TYPES = new Set([
  'TRIP',
  'ITINERARY_NODE',
  'EXPENSE',
  'JOURNAL',
])

const props = withDefaults(
  defineProps<{
    tripId: string
    /** 是否仅显示旅程内容动态（默认 true，排除邀请/成员管理类日志） */
    contentOnly?: boolean
  }>(),
  {
    contentOnly: true
  }
)

const loading = ref(true)
const error = ref(false)
const loadingMore = ref(false)
const logs = ref<ActivityLog[]>([])
const currentPage = ref(1)
const totalCount = ref(0)
const pageSize = 50

const hasMore = computed(() => logs.value.length < totalCount.value)

/** 过滤后的日志列表 */
const filteredLogs = computed(() => {
  if (!props.contentOnly) return logs.value
  return logs.value.filter(log => CONTENT_TARGET_TYPES.has((log.targetType || '').toUpperCase()))
})

const fetchLogs = async (reset = true) => {
  if (!props.tripId) return
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    }
    error.value = false

    const res = await CollaborationService.getActivityLogs(props.tripId, {
      page: currentPage.value,
      pageSize
    })

    if (reset) {
      logs.value = res.list || []
    } else {
      logs.value = [...logs.value, ...(res.list || [])]
    }
    totalCount.value = res.total || 0
  } catch (err) {
    console.error('Fetch activity logs failed:', err)
    error.value = true
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  currentPage.value++
  await fetchLogs(false)
}

onMounted(() => {
  fetchLogs()
})

defineExpose({ fetchLogs })

const getInitial = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* ── 空态 ── */
.activity-empty {
  border-radius: 24px;
  background: rgba(251, 250, 246, 0.72);
}

/* ── 记录数条 ── */
.activity-count-bar {
  padding: 0 5px 12px;
}

.activity-count-text {
  font-size: 13px;
  font-weight: 500;
  color: #9B958C;
}

/* ── 时间线 ── */
.activity-timeline {
  position: relative;
  padding-left: 28px;
}

.activity-timeline-node {
  position: absolute;
  left: 11px;
  top: 20px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.activity-timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4F7DFF;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(79, 125, 255, 0.2);
  flex-shrink: 0;
}

.activity-timeline-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(180deg, #EDE8E2 0%, rgba(237, 232, 226, 0) 100%);
  min-height: 20px;
}

/* ── 单条动态 ── */
.activity-entry {
  position: relative;
  padding-bottom: 16px;
}

.activity-entry:last-child {
  padding-bottom: 0;
}

.activity-entry:last-child .activity-timeline-line {
  display: none;
}

.activity-card {
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.06);
}

.activity-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(79, 125, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-avatar-text {
  font-size: 14px;
  font-weight: 700;
  color: #4F7DFF;
}

.activity-card-body {
  flex: 1;
  min-width: 0;
}

.activity-summary {
  font-size: 14px;
  color: #2F2A25;
  line-height: 1.55;
  display: block;
}

.activity-summary-name {
  font-weight: 600;
}

.activity-time {
  font-size: 12px;
  color: #9B958C;
  display: block;
  margin-top: 3px;
}

/* ── 字段变更 ── */
.activity-changes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #FAF8F5;
  font-size: 13px;
  line-height: 1.4;
}

.activity-change-field {
  font-size: 12px;
  color: #9B958C;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 48px;
}

.activity-change-arrow {
  color: #C4BEB5;
  flex-shrink: 0;
  font-size: 12px;
}

.activity-change-old {
  color: #9B958C;
  text-decoration: line-through;
  text-decoration-color: #C4BEB5;
}

.activity-change-new {
  font-weight: 600;
  color: #4F7DFF;
}

.activity-change-new--added {
  color: #22C55E;
}

/* ── 加载更多 ── */
.activity-load-more {
  padding-top: 16px;
  padding-bottom: 4px;
}

.activity-load-more-btn {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  background: #F2F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #7A746B;
  transition: transform 150ms ease, opacity 150ms ease;
}

.activity-load-more-btn:active:not(.activity-load-more-btn--loading) {
  transform: scale(0.98);
}

.activity-load-more-btn--loading {
  opacity: 0.6;
}
</style>
