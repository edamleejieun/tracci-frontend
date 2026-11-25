<template>
  <view class="guest-prompt" :class="{ 'guest-prompt--flush': flush }">
    <view class="guest-prompt__icon-wrap">
      <view :class="icon" class="guest-prompt__icon" />
    </view>
    <text class="guest-prompt__title">{{ title }}</text>
    <text class="guest-prompt__desc">{{ description }}</text>
    <view class="guest-prompt__btn" @click="goLogin">
      <view class="i-carbon-login guest-prompt__btn-icon" />
      <text class="guest-prompt__btn-text">去登录</text>
    </view>
    <text v-if="hint" class="guest-prompt__hint">{{ hint }}</text>
  </view>
</template>

<script setup lang="ts">
import { navigateToLogin } from '@/utils/guestAuth'

withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
    hint?: string
    /** 父级已提供左右边距时，去掉组件自身水平 padding */
    flush?: boolean
  }>(),
  {
    icon: 'i-carbon-user-avatar',
    title: '登录后开始使用',
    description: '登录后你的旅程会安全保存在云端，随时查看与分享。',
    hint: '仅浏览模式下无法创建或修改数据',
    flush: false
  }
)

const goLogin = () => {
  navigateToLogin()
}
</script>

<style scoped>
.guest-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 48px 24px 64px;
  box-sizing: border-box;
  text-align: center;
}

.guest-prompt--flush {
  padding-left: 0;
  padding-right: 0;
}

.guest-prompt__icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--tracci-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.guest-prompt__icon {
  font-size: 32px;
  color: var(--tracci-text-disabled);
}

.guest-prompt__title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--tracci-text);
  margin-bottom: 8px;
  line-height: 1.4;
}

.guest-prompt__desc {
  display: block;
  max-width: 280px;
  font-size: 13px;
  color: var(--tracci-text-muted);
  line-height: 1.6;
}

.guest-prompt__btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  padding: 12px 32px;
  border-radius: 9999px;
  background-color: var(--tracci-brand);
  box-shadow: 0 8px 24px rgba(79, 125, 255, 0.35);
}

.guest-prompt__btn:active {
  opacity: 0.85;
}

.guest-prompt__btn-icon {
  width: 16px;
  height: 16px;
  color: var(--tracci-bg, #fff);
  margin-right: 8px;
}

.guest-prompt__btn-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--tracci-bg, #fff);
  line-height: 1;
}

.guest-prompt__hint {
  display: block;
  margin-top: 16px;
  max-width: 280px;
  font-size: 12px;
  color: var(--tracci-text-muted);
  line-height: 1.5;
}
</style>
