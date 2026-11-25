<template>
  <view class="legal-page">
    <view class="legal-header" :style="{ paddingTop: `${insetTop}px` }">
      <view class="flex items-center gap-3">
        <view
          class="w-9 h-9 rounded-xl bg-white flex-center shadow-sm active:scale-95 transition-transform"
          @click="handleBack"
        >
          <view class="i-carbon-chevron-left text-xl text-primary" />
        </view>
        <text class="legal-header__title">{{ title }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="legal-scroll" :style="scrollStyle">
      <view class="legal-content">
        <text class="legal-updated">更新日期：{{ updatedAt }}</text>

        <view
          v-for="section in sections"
          :key="section.title"
          class="legal-section"
        >
          <text class="legal-section__title">{{ section.title }}</text>
          <text
            v-for="(paragraph, index) in section.paragraphs"
            :key="`${section.title}-${index}`"
            class="legal-section__paragraph"
          >
            {{ paragraph }}
          </text>
        </view>

        <!-- #ifdef MP-WEIXIN -->
        <view v-if="showWechatContractEntry" class="legal-wechat-card">
          <text class="legal-wechat-card__title">{{ wechatContractName }}</text>
          <text class="legal-wechat-card__desc">
            以下为微信平台为本小程序配置的个人信息处理规则，与趣溪《隐私政策》共同适用。
          </text>
          <button
            class="legal-wechat-card__btn active:opacity-80"
            @click="handleOpenWechatContract"
          >
            查看微信隐私保护指引
          </button>
        </view>
        <!-- #endif -->

        <view class="legal-contact-card">
          <text class="legal-contact-card__text">联系邮箱：{{ contactEmail }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePageTopInset } from '@/composables/usePageTopInset'
import { LEGAL_UPDATED_AT } from '@/constants/legalContent'
import { getPrivacySetting, openWechatPrivacyContract } from '@/utils/wechatPrivacy'
import type { LegalSection } from '@/constants/legalContent'

const HEADER_BODY_HEIGHT = 52

withDefaults(
  defineProps<{
    title: string
    sections: LegalSection[]
    updatedAt?: string
    contactEmail: string
    showWechatContractEntry?: boolean
  }>(),
  {
    updatedAt: LEGAL_UPDATED_AT,
    showWechatContractEntry: false
  }
)

const { insetTop } = usePageTopInset()
const windowHeight = ref(0)
const wechatContractName = ref('《用户隐私保护指引》')

const scrollStyle = computed(() => {
  if (!windowHeight.value) return {}
  const height = windowHeight.value - insetTop.value - HEADER_BODY_HEIGHT
  return { height: `${Math.max(height, 200)}px` }
})

onMounted(async () => {
  try {
    windowHeight.value = uni.getSystemInfoSync().windowHeight
  } catch {
    windowHeight.value = 0
  }

  // #ifdef MP-WEIXIN
  try {
    const setting = await getPrivacySetting()
    if (setting.privacyContractName) {
      wechatContractName.value = setting.privacyContractName
    }
  } catch {
    // 保留默认文案
  }
  // #endif
})

const handleBack = () => {
  uni.navigateBack()
}

const handleOpenWechatContract = () => {
  openWechatPrivacyContract().catch((err: { message?: string }) => {
    if (err?.message === 'USER_CANCEL' || err?.message === 'API_NOT_SUPPORTED') return
  })
}
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.legal-header {
  flex-shrink: 0;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 12px;
}

.legal-header__title {
  font-size: 20px;
  font-weight: 600;
  color: #2F2A25;
  letter-spacing: -0.01em;
}

.legal-scroll {
  flex: 1;
  width: 100%;
}

.legal-content {
  padding: 4px 20px calc(24px + env(safe-area-inset-bottom));
}

.legal-updated {
  display: block;
  font-size: 12px;
  color: #9B958C;
  margin-bottom: 20px;
}

.legal-section {
  margin-bottom: 24px;
}

.legal-section__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #2F2A25;
  line-height: 1.45;
  margin-bottom: 10px;
}

.legal-section__paragraph {
  display: block;
  font-size: 14px;
  color: #7A746B;
  line-height: 1.75;
  margin-bottom: 10px;
  text-align: justify;
}

.legal-section__paragraph:last-child {
  margin-bottom: 0;
}

.legal-wechat-card {
  background: #FAF8F5;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.legal-wechat-card__title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2F2A25;
  margin-bottom: 6px;
}

.legal-wechat-card__desc {
  display: block;
  font-size: 12px;
  color: #9B958C;
  line-height: 1.6;
  margin-bottom: 12px;
}

.legal-wechat-card__btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  border-radius: 22px;
  background-color: #FFFFFF;
  border: 1px solid #E8E4DE;
  font-size: 14px;
  font-weight: 500;
  color: #4F7DFF;
  margin: 0;
  padding: 0;
  box-shadow: 0 1px 4px rgba(139, 115, 85, 0.08);
}

.legal-wechat-card__btn::after {
  border: none;
}

.legal-contact-card {
  background: #FAF8F5;
  border-radius: 14px;
  padding: 14px 16px;
}

.legal-contact-card__text {
  display: block;
  font-size: 13px;
  color: #7A746B;
  line-height: 1.6;
}
</style>