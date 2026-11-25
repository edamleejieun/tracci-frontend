<template>
  <!-- #ifdef MP-WEIXIN -->
  <TracciBottomSheet
    v-model="visible"
    :prevent-close="true"
    :z-index="9999"
    max-height="72vh"
    padding-bottom="calc(24px + env(safe-area-inset-bottom))"
  >
    <view class="pt-2 pb-2">
      <text class="text-lg font-semibold text-primary block mb-2">个人信息保护提示</text>
      <view class="privacy-desc text-sm text-secondary leading-relaxed mb-4">
        <text>在使用相册、相机或保存图片等功能前，请先阅读并同意</text>
        <text class="privacy-desc__link text-brand" @tap.stop="handleOpenContract">{{ contractName }}</text>
        <text>及</text>
        <text class="privacy-desc__link text-brand" @tap.stop="openPrivacyPage">趣溪《隐私政策》</text>
        <text>。我们仅在实现旅行记录、头像与导出等功能所必需的范围内处理相关信息。</text>
      </view>

      <view class="flex flex-col gap-3">
        <button
          :id="WECHAT_PRIVACY_AGREE_BUTTON_ID"
          class="privacy-btn privacy-btn--primary"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="handleAgree"
        >
          同意并继续
        </button>
        <button class="privacy-btn privacy-btn--ghost" @click="handleDisagree">
          暂不同意
        </button>
      </view>
    </view>
  </TracciBottomSheet>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import {
  WECHAT_PRIVACY_AGREE_BUTTON_ID,
  setPrivacyPopupHandler,
  openWechatPrivacyContract,
  navigateToLegalPage,
  type PrivacyPopupRequest
} from '@/utils/wechatPrivacy'

const visible = ref(false)
const contractName = ref('《用户隐私保护指引》')
const currentRequest = ref<PrivacyPopupRequest | null>(null)

const showPopup = (request: PrivacyPopupRequest) => {
  currentRequest.value = request
  contractName.value = request.contractName || '《用户隐私保护指引》'
  visible.value = true
}

const closePopup = () => {
  visible.value = false
  currentRequest.value = null
}

const handleAgree = () => {
  const request = currentRequest.value
  if (!request) return

  request.wxResolve?.({
    buttonId: WECHAT_PRIVACY_AGREE_BUTTON_ID,
    event: 'agree'
  })
  request.onAgree()
  closePopup()
}

const handleDisagree = () => {
  const request = currentRequest.value
  if (!request) return

  request.wxResolve?.({ event: 'disagree' })
  request.onDisagree()
  closePopup()
}

const handleOpenContract = () => {
  openWechatPrivacyContract().catch((err: { message?: string }) => {
    if (err?.message === 'USER_CANCEL' || err?.message === 'API_NOT_SUPPORTED') return
  })
}

const openPrivacyPage = () => {
  navigateToLegalPage('privacy')
}

onMounted(() => {
  setPrivacyPopupHandler(showPopup)
})

onUnmounted(() => {
  setPrivacyPopupHandler(null)
})
</script>

<style scoped>
.privacy-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  margin: 0;
  padding: 0;
}

.privacy-btn::after {
  border: none;
}

.privacy-btn--primary {
  background-color: #3B82F6;
  color: #FFFFFF;
}

.privacy-btn--ghost {
  background-color: #F7F4EF;
  color: #7A746B;
}

.privacy-desc {
  display: block;
}

.privacy-desc__link {
  display: inline;
}
</style>
