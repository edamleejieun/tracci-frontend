<template>
  <view class="relative pl-1">
    <!-- 时间线圆点 -->
    <view
      class="absolute w-2 h-2 rounded-full bg-white border border-brand/60 box-border z-10"
      style="left: -22px; top: 32rpx"
    />

    <view
      class="journal-card p-4 active:scale-[0.995] transition-transform"
      @click="emit('edit', log)"
    >
      <!-- 顶栏 -->
      <view class="flex items-start justify-between gap-2 mb-3">
        <view class="flex-1 min-w-0">
          <view class="flex items-center flex-wrap gap-2">
            <text class="text-xs text-muted">{{ timeOnly }}</text>
            <view v-if="locationDisplay" class="flex items-center gap-1 min-w-0">
              <view class="w-1 h-1 rounded-full bg-[#D4CFC7] shrink-0" />
              <view class="i-carbon-location text-muted text-xs shrink-0" />
              <text class="text-xs text-muted truncate">{{ locationDisplay }}</text>
            </view>
            <text v-if="authorName" class="text-xs text-muted">· {{ authorName }}</text>
          </view>
        </view>
        <view class="flex items-center gap-2 shrink-0">
          <view
            v-if="isPrivate"
            class="flex items-center px-2 py-0.5 rounded-full bg-[#EFEFEF]"
          >
            <view class="i-carbon-locked text-muted text-xs" />
          </view>
          <view
            v-if="moodBadge"
            class="flex items-center gap-1 px-2 py-0.5 rounded-full"
            :style="{ backgroundColor: moodBadge.bg }"
          >
            <text class="text-[11px]">{{ moodBadge.emoji }}</text>
            <text class="text-[10px] font-medium" :style="{ color: moodBadge.color }">
              {{ moodBadge.label }}
            </text>
          </view>
          <view
            v-if="log.isHighlight"
            class="flex items-center px-2 py-0.5 rounded-full bg-[#FFF8E6]"
          >
            <view class="i-carbon-star-filled text-featured text-xs" />
          </view>
          <view
            class="w-8 h-8 rounded-full flex-center active:bg-subtle transition-colors"
            @click.stop="onMore"
          >
            <view class="i-carbon-overflow-menu-vertical text-muted text-base" />
          </view>
        </view>
      </view>

      <!-- 正文摘要 -->
      <text class="text-sm text-[#5C5650] leading-relaxed line-clamp-3 block mb-3">
        {{ log.content }}
      </text>

      <!-- 图片 -->
      <view v-if="log.photos && log.photos.length > 0" @click.stop>
        <view
          v-if="log.photos.length === 1"
          class="rounded-2xl overflow-hidden w-full"
          style="height: 320rpx"
        >
          <JournalPhotoThumb
            :photo="log.photos[0]"
            class="w-full h-full"
            custom-class="w-full h-full"
            style="display: block; width: 100%; height: 100%"
            @click="emit('preview', { photos: log.photos!, index: 0 })"
          />
        </view>
        <view v-else-if="log.photos.length === 2" class="flex gap-2">
          <view
            v-for="(photo, idx) in log.photos"
            :key="photo.fileId"
            class="flex-1 rounded-xl overflow-hidden"
            style="height: 240rpx"
          >
            <JournalPhotoThumb
              :photo="photo"
              class="w-full h-full"
              custom-class="w-full h-full"
              style="display: block; width: 100%; height: 100%"
              @click="emit('preview', { photos: log.photos!, index: idx })"
            />
          </view>
        </view>
        <view v-else class="flex gap-2">
          <view class="flex-1 rounded-xl overflow-hidden" style="height: 240rpx">
            <JournalPhotoThumb
              :photo="log.photos[0]"
              class="w-full h-full"
              custom-class="w-full h-full"
              style="display: block; width: 100%; height: 100%"
              @click="emit('preview', { photos: log.photos!, index: 0 })"
            />
          </view>
          <view class="flex flex-col gap-2 w-20">
            <view class="flex-1 rounded-xl overflow-hidden min-h-14">
              <JournalPhotoThumb
                :photo="log.photos[1]"
                class="w-full h-full"
                custom-class="w-full h-full"
                style="display: block; width: 100%; height: 100%"
                @click="emit('preview', { photos: log.photos!, index: 1 })"
              />
            </view>
            <view class="flex-1 rounded-xl overflow-hidden min-h-14 relative">
              <JournalPhotoThumb
                :photo="log.photos[2]"
                class="w-full h-full"
                custom-class="w-full h-full"
                style="display: block; width: 100%; height: 100%"
                @click="emit('preview', { photos: log.photos!, index: 2 })"
              />
              <view
                v-if="log.photos.length > 3"
                class="absolute inset-0 bg-black/50 flex-center pointer-events-none"
              >
                <text class="text-white text-sm font-semibold">+{{ log.photos.length - 3 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TravelLogItem } from '@/types/journal'
import { getJournalLocationDisplayText } from '@/utils/journalLocation'
import { getMoodColor, getMoodLabel } from '@/constants/designTokens'
import { getJournalMoodEmoji } from '@/constants/journal'
import type { JournalPhotoItem } from '@/types/file'
import JournalPhotoThumb from './JournalPhotoThumb.vue'

const props = defineProps<{
  log: TravelLogItem
}>()

const emit = defineEmits<{
  (e: 'edit', log: TravelLogItem): void
  (e: 'delete', log: TravelLogItem): void
  (e: 'toggleHighlight', log: TravelLogItem): void
  (e: 'preview', payload: { photos: JournalPhotoItem[]; index: number }): void
}>()

const locationDisplay = computed(() => getJournalLocationDisplayText(props.log))

/** 仅自己可见（对齐 iOS JournalEntryCard 的锁形徽章） */
const isPrivate = computed(() => props.log.visibility === 'private')

/** 协作场景下展示作者名（对齐 iOS JournalEntryCard 的 authorName） */
const authorName = computed(() => props.log.authorName || '')

const moodBadge = computed(() => {
  const mood = props.log.mood
  if (!mood) return null
  const color = getMoodColor(mood)
  return {
    emoji: getJournalMoodEmoji(mood),
    label: getMoodLabel(mood),
    color,
    bg: `${color}20`
  }
})

const timeOnly = computed(() => {
  const str = props.log.occurredAt || ''
  if (!str) return ''
  const date = new Date(str)
  if (Number.isNaN(date.getTime())) return ''
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
})

const onMore = () => {
  const itemList = ['编辑', props.log.isHighlight ? '取消精选' : '设为精选', '删除']
  uni.showActionSheet({
    itemList,
    success: res => {
      const action = itemList[res.tapIndex]
      if (action === '编辑') emit('edit', props.log)
      else if (action === '设为精选' || action === '取消精选') emit('toggleHighlight', props.log)
      else if (action === '删除') emit('delete', props.log)
    }
  })
}
</script>

<style scoped>
.journal-card {
  border-radius: 20px;
  background: #fff;
  box-shadow: inset 0 -1px 0 rgba(237, 232, 226, 0.78);
}
</style>
