<template>
  <view class="fab-root">
    <!-- 遮罩层 - 展开时显示 -->
    <view
      v-if="expanded"
      class="fab-backdrop"
      @click="collapse"
      @touchmove.stop.prevent="() => {}"
    />

    <!-- 按钮组容器 -->
    <view class="fab-container">
      <!-- 展开的子按钮 -->
      <template v-if="expanded">
        <view
          v-for="(action, index) in actions"
          :key="action.key"
          class="fab-action-pill"
          :style="{
            animationDelay: `${(actions.length - 1 - index) * 50}ms`,
            ...(action.btnStyle || {})
          }"
          @click="onAction(action.key)"
        >
          <view
            :class="['w-9 h-9 rounded-full flex-center shrink-0', action.iconBg || 'bg-warm-surface']"
          >
            <view
              :class="[action.icon, 'text-base', action.iconColor || 'text-secondary']"
            />
          </view>
          <text class="text-sm font-medium text-primary">{{ action.label }}</text>
        </view>
      </template>

      <!-- 主按钮 -->
      <view
        class="fab-main"
        :class="{ 'fab-main--active': expanded }"
        @click="toggle"
      >
        <view class="i-carbon-add text-2xl fab-main-icon" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface FabAction {
  key: string
  icon: string
  label: string
  iconBg?: string
  iconColor?: string
  btnStyle?: Record<string, string>
}

defineProps<{
  actions: FabAction[]
}>()

const emit = defineEmits<{
  (e: 'action', key: string): void
}>()

const expanded = ref(false)

const toggle = () => {
  expanded.value = !expanded.value
}

const collapse = () => {
  expanded.value = false
}

const onAction = (key: string) => {
  expanded.value = false
  emit('action', key)
}
</script>

<style scoped>
.fab-root {
  position: relative;
  z-index: 100;
}

/* 遮罩层 */
.fab-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  z-index: 90;
  animation: backdrop-in 180ms ease-out;
}

@keyframes backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* FAB 容器 */
.fab-container {
  position: fixed;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  z-index: 100;
}

/* 主按钮 */
.fab-main {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #4F7DFF;
  box-shadow: 0 8px 24px rgba(79, 125, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.fab-main:active {
  transform: scale(0.92);
}

.fab-main--active {
  box-shadow: 0 12px 32px rgba(79, 125, 255, 0.45);
}

.fab-main-icon {
  color: #fff;
  transition: transform 200ms ease;
}

.fab-main--active .fab-main-icon {
  transform: rotate(45deg);
}

/* 子按钮 pill */
.fab-action-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(139, 115, 85, 0.14);
  animation: pill-in 200ms ease-out both;
  transition: transform 100ms ease;
}

.fab-action-pill:active {
  transform: scale(0.94);
}

@keyframes pill-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
