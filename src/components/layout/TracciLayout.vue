<template>
  <view
    class="min-h-screen text-primary overflow-x-hidden relative"
    :class="rootBgClass"
  >
    <!-- 自定义顶部导航栏 -->
    <TracciNavbar
      v-if="showNavbar"
      :title="title"
      :show-back="showBack"
      :transparent="transparentNavbar"
      @back="$emit('back')"
    >
      <template #left><slot name="nav-left"></slot></template>
      <template #right><slot name="nav-right"></slot></template>
    </TracciNavbar>

    <!-- 主体内容区 -->
    <!-- 如果有 Navbar 且不透明，需要上边距；如果有 TabBar，需要下边距 -->
    <view
      class="relative w-full"
      :class="[contentClass, !showTabBar ? 'safe-pb' : '']"
      :style="{
        paddingTop: showNavbar && !transparentNavbar ? 'calc(44px + env(safe-area-inset-top))' : '',
        paddingBottom:
          showTabBar && reserveTabBarInset
            ? 'calc(58px + env(safe-area-inset-bottom))'
            : ''
      }"
    >
      <slot></slot>
    </view>

    <!-- 自定义底部标签栏 -->
    <TracciTabBar v-if="showTabBar" :current="currentTab" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import TracciNavbar from './TracciNavbar.vue'
import TracciTabBar from './TracciTabBar.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    showNavbar?: boolean
    showTabBar?: boolean
    showBack?: boolean
    transparentNavbar?: boolean
    currentTab?: string
    contentClass?: string
    /** 为 false 时不在内容区预留 TabBar 高度（页面自管底部 inset，如固定操作栏） */
    reserveTabBarInset?: boolean
  }>(),
  {
    title: '',
    showNavbar: true,
    showTabBar: false,
    showBack: false,
    transparentNavbar: false,
    currentTab: 'home',
    contentClass: '',
    reserveTabBarInset: true
  }
)

/** 内容区若自带暖底等背景，根节点透出同色，避免上下露白 */
const rootBgClass = computed(() => {
  if (props.contentClass?.includes('bg-warm-bg')) return 'bg-warm-bg'
  if (props.contentClass?.includes('bg-background')) return 'bg-background'
  return 'bg-background'
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'tab-change', key: string): void
}>()

onMounted(() => {
  if (props.showTabBar) {
    uni.hideTabBar()
  }
})

const handleTabChange = (key: string) => {
  emit('tab-change', key)
}
</script>
