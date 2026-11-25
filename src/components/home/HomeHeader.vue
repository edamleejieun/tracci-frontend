<template>
  <view class="home-header" :style="{ paddingTop: `${navPaddingTop}px` }">
    <view class="home-header__bar">
      <!-- 左侧品牌：始终展示 -->
      <view class="home-header__brand">
        <image
          class="home-header__logo"
          src="/static/brand/logo-mark.png"
          mode="aspectFill"
        />
        <text class="home-header__brand-name">趣溪</text>
      </view>

      <!-- 右侧：搜索图标 / 展开搜索框（带过渡） -->
      <view v-if="showSearch" class="home-header__right">
        <view
          class="home-header__search-morph"
          :class="isSearchExpanded ? 'home-header__search-morph--expanded' : 'home-header__search-morph--collapsed'"
          :style="searchMorphStyle"
          @click="handleMorphClick"
        >
          <!-- 搜索图标（折叠/展开均可见） -->
          <view class="home-header__search-icon i-carbon-search" aria-hidden="true" />

          <!-- 输入框（展开时渲染） -->
          <input
            v-if="isSearchExpanded"
            :value="modelValue"
            class="home-header__search-input"
            placeholder="搜索旅程"
            :focus="searchInputFocus"
            confirm-type="search"
            aria-label="搜索旅程"
            @input="onInput"
            @blur="onSearchBlur"
            @confirm="onConfirm"
          />
          <!-- 清空按钮（展开且有内容时显示） -->
          <view
            v-if="isSearchExpanded && modelValue"
            class="home-header__search-clear"
            role="button"
            aria-label="清空关键词"
            @click.stop="clearSearch"
          >
            <view class="home-header__search-clear-icon i-carbon-close-filled" />
          </view>
          <!-- 关闭按钮（展开时显示） -->
          <view
            v-if="isSearchExpanded"
            class="home-header__search-close"
            role="button"
            aria-label="关闭搜索"
            @click.stop="closeSearch"
          >
            <view class="i-carbon-close" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    showSearch?: boolean
  }>(),
  {
    showSearch: true
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
}>()

const isSearchExpanded = ref(false)
const searchInputFocus = ref(false)
const navPaddingTop = ref(0)
/** 微信小程序胶囊左缘（px），用于限制搜索框最大宽度 */
const capsuleLeft = ref(0)
/** 阻止 blur 误关面板：按钮点击时设置标记，blur  handler 检查后清除 */
const buttonClicked = ref(false)

/** 左侧品牌区预估占用宽度（logo + gap + 趣溪） */
const BRAND_BLOCK_WIDTH = 42 + 12 + 56
const BAR_PADDING_X = 20
const BRAND_SEARCH_GAP = 12

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    let top = sys.statusBarHeight || 0
    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    if (menu && menu.bottom > 0) {
      top = menu.bottom + 8
    }
    if (menu && menu.left > 0) {
      capsuleLeft.value = menu.left
    }
    // #endif
    navPaddingTop.value = top
  } catch {
    navPaddingTop.value = 0
  }
})

const searchMorphStyle = computed(() => {
  if (isSearchExpanded.value) {
    if (capsuleLeft.value > 0) {
      const maxW =
        capsuleLeft.value -
        BAR_PADDING_X -
        BRAND_BLOCK_WIDTH -
        BRAND_SEARCH_GAP -
        8
      return { width: `${Math.max(maxW, 100)}px` }
    }
    return { width: '100%' }
  }
  return { width: '44px' }
})

const handleMorphClick = () => {
  if (!isSearchExpanded.value) {
    openSearch()
  }
}

const openSearch = () => {
  searchInputFocus.value = false
  isSearchExpanded.value = true
}

const closeSearch = () => {
  buttonClicked.value = true
  searchInputFocus.value = false
  isSearchExpanded.value = false
}

/** 供首页 Hero「搜索」快捷入口调用 */
defineExpose({
  openSearch,
  closeSearch
})

/** 展开动画结束后再聚焦，避免小程序端动效卡顿 */
watch(isSearchExpanded, async (expanded) => {
  if (expanded) {
    await nextTick()
    setTimeout(() => {
      if (isSearchExpanded.value) {
        searchInputFocus.value = true
      }
    }, 220)
  } else {
    searchInputFocus.value = false
  }
})

const onInput = (e: { detail: { value: string } }) => {
  emit('update:modelValue', e.detail.value)
}

const onSearchBlur = () => {
  setTimeout(() => {
    if (!buttonClicked.value && !props.modelValue) {
      isSearchExpanded.value = false
    }
    buttonClicked.value = false
    emit('search')
  }, 150)
}

const onConfirm = () => {
  emit('search')
}

const clearSearch = () => {
  buttonClicked.value = true
  emit('update:modelValue', '')
  emit('search')
}
</script>

<style scoped>
.home-header {
  width: 100%;
  position: relative;
  z-index: 50;
  background-color: transparent;
}

.home-header__bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  min-height: 64px;
  height: 64px;
  padding: 0 20px;
  width: 100%;
  gap: 12px;
}

.home-header__brand {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
  min-width: 0;
}

.home-header__logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.06);
}

.home-header__brand-name {
  font-size: 24px;
  font-weight: 700;
  color: #2F2A25;
  letter-spacing: 0.1em;
  line-height: 1.2;
}

.home-header__right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

/* 搜索框：单容器宽度过渡（折叠 44px → 展开全宽），消除交叉过渡的间隙感 */
.home-header__search-morph {
  display: flex;
  align-items: center;
  height: 44px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.06);
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              border-radius 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-header__search-morph--collapsed {
  width: 44px;
  border-radius: 12px;
  cursor: pointer;
  justify-content: center;
  padding: 0;
}

.home-header__search-morph--expanded {
  border-radius: 16px;
  cursor: default;
  padding: 0 8px 0 12px;
}

.home-header__search-icon {
  width: 20px;
  height: 20px;
  color: #6e655c;
  flex-shrink: 0;
}

.home-header__search-input {
  flex: 1;
  width: 0;
  height: 44px;
  font-size: 14px;
  color: #2f2a25;
  background: transparent;
  padding: 0;
}

/* 扩大清除命中区至 ≥44pt，图标本身保持 18px */
.home-header__search-clear {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-header__search-clear:active {
  opacity: 0.7;
}

.home-header__search-clear-icon {
  width: 18px;
  height: 18px;
  color: #6e655c;
}

.home-header__search-close {
  min-width: 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-left: 1px solid rgba(229, 224, 218, 0.8);
}

.home-header__search-close:active {
  opacity: 0.7;
}
</style>
