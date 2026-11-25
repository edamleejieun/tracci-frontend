<template>
  <TracciLayout :show-navbar="false" :show-tab-bar="false" :reserve-tab-bar-inset="false">
    <view class="px-5 pb-3" :style="{ paddingTop: `${insetTop}px` }">
      <view class="flex items-center gap-3">
        <view
          class="w-9 h-9 rounded-xl bg-white flex-center shadow-sm active:scale-95 transition-transform"
          @click="handleBack"
        >
          <view class="i-carbon-chevron-left text-xl text-primary" />
        </view>
        <view>
          <text class="text-[26px] font-semibold text-primary tracking-tight block leading-tight">
            帮助与反馈
          </text>
          <text class="text-[13px] text-muted mt-0.5 block">
            告诉我们你的想法，帮助趣溪变得更好
          </text>
        </view>
      </view>
    </view>

    <view
      class="px-5"
      :class="isLoggedIn ? '' : 'pb-10'"
      :style="contentBottomStyle"
    >
      <GuestLoginPrompt
        v-if="!isLoggedIn"
        flush
        icon="i-carbon-help"
        title="登录后提交反馈"
        description="登录后我们可以更好地跟进你的问题，你也可以选择留下邮箱以便回复。"
        hint="未登录无法提交反馈"
      />

      <template v-else>
        <view class="card-base help-form overflow-hidden">
          <view class="help-block help-block--first">
            <text class="help-block__label">反馈类型</text>
            <view class="type-chips">
              <view
                v-for="option in FEEDBACK_TYPE_OPTIONS"
                :key="option.value"
                class="type-chip"
                :class="{ 'type-chip--active': selectedType === option.value }"
                @click="selectedType = option.value"
              >
                <text class="type-chip__label">{{ option.label }}</text>
              </view>
            </view>
          </view>

          <view class="help-divider" />

          <view class="help-block">
            <text class="help-block__label">问题描述</text>
            <view class="help-field">
              <textarea
                v-model="content"
                class="help-textarea"
                placeholder="请尽量描述你遇到的问题、操作步骤或希望改进的地方。"
                placeholder-class="text-muted"
                :maxlength="FEEDBACK_CONTENT_MAX"
                :cursor-spacing="80"
                :show-confirm-bar="false"
              />
            </view>
            <text class="help-counter">
              {{ content.length }}/{{ FEEDBACK_CONTENT_MAX }}
            </text>
          </view>

          <view class="help-divider" />

          <view class="help-block">
            <view class="help-block__label-row">
              <text class="help-block__label help-block__label--inline">上传截图</text>
              <text class="help-block__hint">选填，最多 {{ FEEDBACK_IMAGE_MAX }} 张</text>
            </view>
            <view class="help-uploads">
              <view
                v-for="(file, index) in uploadFiles"
                :key="file.id"
                @click="previewImage(index)"
              >
                <JournalUploadThumb
                  :file="file"
                  @remove="removeFile(index)"
                  @retry="retryUpload(index)"
                />
              </view>
              <view
                v-if="uploadFiles.length < FEEDBACK_IMAGE_MAX"
                class="help-upload-add active:opacity-80"
                @click="onAddImage"
              >
                <view class="i-carbon-add text-muted text-xl mb-1" />
                <text class="help-upload-add__text">添加图片</text>
              </view>
            </view>
          </view>

          <view class="help-divider" />

          <view class="help-block help-block--last">
            <text class="help-block__label">联系邮箱</text>
            <text class="help-block__hint help-block__hint--block">
              选填。如需我们通过邮件跟进处理结果，可留下你的邮箱地址。
            </text>
            <view class="help-field help-field--row">
              <view class="i-carbon-email text-muted text-base shrink-0" />
              <input
                v-model="contact"
                class="help-contact-input flex-1 min-w-0 text-sm text-primary"
                type="text"
                placeholder="请输入邮箱地址"
                placeholder-class="text-muted"
                :maxlength="100"
              />
            </view>
          </view>
        </view>
      </template>
    </view>

    <view v-if="isLoggedIn" class="help-footer">
      <view class="help-footer__bar">
        <view
          class="help-footer__submit"
          :class="{ 'help-footer__submit--disabled': !canSubmit || submitting }"
          @click="handleSubmit"
        >
          <view v-if="submitting" class="i-carbon-circle-dash animate-spin help-footer__icon" />
          <view v-else class="i-carbon-send help-footer__icon" />
          <text class="help-footer__text">{{ submitting ? '提交中...' : '提交反馈' }}</text>
        </view>
      </view>
    </view>

    <WechatPrivacyPopup />
  </TracciLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TracciLayout from '@/components/layout/TracciLayout.vue'
import GuestLoginPrompt from '@/components/common/GuestLoginPrompt.vue'
import WechatPrivacyPopup from '@/components/privacy/WechatPrivacyPopup.vue'
import JournalUploadThumb from '@/pages/trip/components/journal/JournalUploadThumb.vue'
import { usePageTopInset } from '@/composables/usePageTopInset'
import { useImageUpload } from '@/composables/useImageUpload'
import { useUserStore } from '@/stores/user'
import { FeedbackService } from '@/services/feedback'
import {
  APP_VERSION,
  FEEDBACK_CONTENT_MAX,
  FEEDBACK_CONTENT_MIN,
  FEEDBACK_IMAGE_MAX,
  FEEDBACK_TYPE_OPTIONS
} from '@/constants/feedback'
import type { FeedbackType } from '@/types/feedback'
import { isValidFeedbackEmail } from '@/utils/feedbackContact'
import { collectFeedbackSystemInfo } from '@/utils/systemInfo'
import { getLocalUploadDisplayUrl } from '@/utils/image'
import { requireLogin } from '@/utils/guestAuth'

const userStore = useUserStore()
const { insetTop } = usePageTopInset()
const { uploadFiles, chooseImages, removeFile, retryUpload, resetUploads } = useImageUpload()

const selectedType = ref<FeedbackType | ''>('')
const content = ref('')
const contact = ref('')
const submitting = ref(false)
const isPickingImage = ref(false)

const isLoggedIn = computed(() => userStore.isLogin())

/** 底部固定栏高度 + 安全区，避免滚动内容与按钮重叠 */
const FOOTER_RESERVED_HEIGHT = 'calc(96px + env(safe-area-inset-bottom))'

const contentBottomStyle = computed(() =>
  isLoggedIn.value ? { paddingBottom: FOOTER_RESERVED_HEIGHT } : {}
)

const isUploading = computed(() =>
  uploadFiles.value.some(f => f.status === 'uploading' || f.status === 'waiting')
)

const hasFailedUpload = computed(() =>
  uploadFiles.value.some(f => f.status === 'failed')
)

const canSubmit = computed(() => {
  if (submitting.value || isUploading.value || hasFailedUpload.value) return false
  if (!selectedType.value) return false
  const len = content.value.trim().length
  return len >= FEEDBACK_CONTENT_MIN && len <= FEEDBACK_CONTENT_MAX
})

onShow(async () => {
  if (userStore.isLogin()) {
    await userStore.fetchUserInfo()
  }
})

const handleBack = () => {
  uni.navigateBack()
}

const onAddImage = async () => {
  if (isPickingImage.value) return
  if (uploadFiles.value.length >= FEEDBACK_IMAGE_MAX) {
    uni.showToast({ title: `图片最多上传 ${FEEDBACK_IMAGE_MAX} 张`, icon: 'none' })
    return
  }
  isPickingImage.value = true
  try {
    await chooseImages(FEEDBACK_IMAGE_MAX, 'FEEDBACK_ATTACHMENT')
  } finally {
    isPickingImage.value = false
  }
}

const previewImage = (index: number) => {
  const file = uploadFiles.value[index]
  if (!file) return
  const url = getLocalUploadDisplayUrl(file) || file.previewUrl || file.url
  if (!url) return
  const urls = uploadFiles.value
    .map(f => getLocalUploadDisplayUrl(f) || f.previewUrl || f.url)
    .filter(Boolean) as string[]
  uni.previewImage({
    current: url,
    urls
  })
}

const validateForm = (): boolean => {
  if (!selectedType.value) {
    uni.showToast({ title: '请选择反馈类型', icon: 'none' })
    return false
  }

  const trimmed = content.value.trim()
  if (trimmed.length < FEEDBACK_CONTENT_MIN) {
    uni.showToast({ title: '请至少输入 10 个字，方便我们定位问题', icon: 'none' })
    return false
  }
  if (trimmed.length > FEEDBACK_CONTENT_MAX) {
    uni.showToast({ title: `内容太长了，请精简到 ${FEEDBACK_CONTENT_MAX} 字以内`, icon: 'none' })
    return false
  }

  const trimmedContact = contact.value.trim()
  if (trimmedContact && !isValidFeedbackEmail(trimmedContact)) {
    uni.showToast({ title: '请输入正确的邮箱地址', icon: 'none' })
    return false
  }

  if (uploadFiles.value.length > FEEDBACK_IMAGE_MAX) {
    uni.showToast({ title: `图片最多上传 ${FEEDBACK_IMAGE_MAX} 张`, icon: 'none' })
    return false
  }

  if (isUploading.value) {
    uni.showToast({ title: '请等待图片上传完成', icon: 'none' })
    return false
  }

  if (hasFailedUpload.value) {
    uni.showToast({ title: '有图片上传失败，请删除或重试', icon: 'none' })
    return false
  }

  return true
}

const resetForm = () => {
  selectedType.value = ''
  content.value = ''
  contact.value = ''
  resetUploads()
}

const handleSubmit = async () => {
  const ok = await requireLogin({
    title: '需要登录',
    content: '登录后才能提交反馈，方便我们跟进处理。'
  })
  if (!ok) return

  if (!validateForm()) return

  const imageIds = uploadFiles.value
    .filter(f => f.status === 'uploaded' && f.fileId)
    .map(f => f.fileId as string)

  const trimmedContact = contact.value.trim()
  const payload = {
    type: selectedType.value as FeedbackType,
    content: content.value.trim(),
    imageIds: imageIds.length > 0 ? imageIds : undefined,
    platform: 'WECHAT_MINI' as const,
    appVersion: APP_VERSION,
    systemInfo: collectFeedbackSystemInfo(),
    ...(trimmedContact
      ? {
          contact: trimmedContact,
          contactType: 'EMAIL' as const
        }
      : {})
  }

  submitting.value = true
  try {
    await FeedbackService.submitFeedback(payload)
    uni.showToast({ title: '感谢反馈', icon: 'success' })
    resetForm()
    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  } catch {
    // http 层已 Toast
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.help-form {
  margin-bottom: 0;
}

.help-block {
  padding: 12px 20px;
  box-sizing: border-box;
}

.help-block--first {
  padding-top: 16px;
}

.help-block--last {
  padding-bottom: 16px;
}

.help-block__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #9b958c;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.help-block__label--inline {
  display: inline;
  margin-bottom: 0;
}

.help-block__label-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.help-block__hint {
  font-size: 11px;
  color: #c4beb5;
}

.help-block__hint--block {
  display: block;
  margin-top: -4px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-divider {
  height: 1px;
  margin: 0 20px;
  background-color: rgba(237, 232, 226, 0.85);
}

.help-counter {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #c4beb5;
  text-align: right;
}

.help-uploads {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.help-upload-add {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: #f7f4ef;
  border: 1px dashed #e8e4de;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.help-upload-add__text {
  font-size: 10px;
  color: #9b958c;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 16px;
  border-radius: 9999px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(232, 228, 222, 0.95);
  transition: box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.type-chip:active {
  transform: scale(0.97);
}

.type-chip--active {
  background: rgba(79, 125, 255, 0.08);
  box-shadow: inset 0 0 0 1.5px rgba(79, 125, 255, 0.45);
}

.type-chip__label {
  font-size: 13px;
  font-weight: 500;
  color: #7a746b;
  line-height: 1.2;
  white-space: nowrap;
}

.type-chip--active .type-chip__label {
  color: #4F7DFF;
  font-weight: 600;
}

.help-field {
  border-radius: 14px;
  background: rgba(250, 248, 245, 0.95);
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.72);
  padding: 12px 14px;
  box-sizing: border-box;
}

.help-field--row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
}

.help-footer__bar {
  background-color: #ffffff;
  border-top: 1px solid #f7f4ef;
  padding: 12px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.help-footer__submit {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background-color: #4F7DFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(79, 125, 255, 0.25);
  transition: transform 0.2s ease;
}

.help-footer__submit:active {
  transform: scale(0.98);
}

.help-footer__submit--disabled {
  background-color: #dcdce0;
  box-shadow: none;
}

.help-footer__submit--disabled:active {
  transform: none;
}

.help-footer__icon {
  font-size: 16px;
  color: #ffffff;
  margin-right: 8px;
}

.help-footer__submit--disabled .help-footer__icon,
.help-footer__submit--disabled .help-footer__text {
  color: #9b958c;
}

.help-footer__text {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
}

.help-textarea {
  display: block;
  width: 100%;
  min-height: 88px;
  padding: 0;
  margin: 0;
  border: none;
  box-sizing: border-box;
  font-size: 14px;
  color: #2f2a25;
  line-height: 1.65;
  background: transparent;
}

.help-contact-input {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
}
</style>