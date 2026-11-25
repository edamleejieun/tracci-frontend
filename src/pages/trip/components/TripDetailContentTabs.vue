<template>
  <view
    class="content-tabs"
    role="tablist"
    aria-label="当日内容"
  >
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="content-tab"
      :class="{ 'content-tab--active': modelValue === tab.key }"
      role="tab"
      :aria-label="tab.label"
      :aria-selected="modelValue === tab.key"
      @click="selectTab(tab.key)"
    >
      <view :class="[tab.icon, 'content-tab__icon']" />
      <text
        v-if="modelValue === tab.key"
        class="content-tab__label"
      >
        {{ tab.label }}
      </text>
      <view
        v-if="modelValue === tab.key"
        class="content-tab__indicator"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
type TripDetailContentTab = 'itinerary' | 'journal' | 'expense'

const props = defineProps<{
  modelValue: TripDetailContentTab
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TripDetailContentTab): void
}>()

const tabs: Array<{
  key: TripDetailContentTab
  label: string
  icon: string
}> = [
  { key: 'itinerary', label: '行程', icon: 'i-carbon-list-bulleted' },
  { key: 'journal', label: '日志', icon: 'i-carbon-notebook' },
  { key: 'expense', label: '开支', icon: 'i-carbon-wallet' }
]

const selectTab = (tab: TripDetailContentTab) => {
  if (props.modelValue === tab) return
  emit('update:modelValue', tab)
}
</script>

<style scoped>
.content-tabs {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 2px 4px;
  border-top: 1px solid rgba(232, 228, 222, 0.7);
}

.content-tab {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #7a746b;
  transition:
    color 180ms ease,
    transform 120ms ease;
}

.content-tab:active {
  transform: scale(0.96);
}

.content-tab--active {
  color: #4f7dff;
}

.content-tab__icon {
  width: 20px;
  height: 20px;
  font-size: 18px;
  flex-shrink: 0;
}

.content-tab__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.content-tab__indicator {
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 28px;
  height: 3px;
  border-radius: 999px;
  background: #4f7dff;
  transform: translateX(-50%);
}
</style>
