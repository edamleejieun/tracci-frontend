<template>
  <view class="join-page" :style="pageShellStyle">
    <view
      class="join-header shrink-0 bg-background/90 border-b border-warm-border/50"
      :style="{ paddingTop: navPaddingTop }"
    >
      <view class="px-4 pb-4">
        <view class="flex items-center gap-3">
          <view
            class="w-10 h-10 shrink-0 flex-center rounded-xl bg-white shadow-sm active:scale-95 transition-transform"
            @click="onBack"
          >
            <view class="i-carbon-chevron-left text-xl text-primary" />
          </view>
          <view class="flex-1 min-w-0">
            <text class="text-xl font-semibold text-primary block">加入旅行</text>
            <text class="text-[13px] text-secondary block mt-0.5">与好友一起编辑这段旅程</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="join-scroll"
      :show-scrollbar="false"
      :style="{ height: `${scrollBodyHeight}px` }"
    >
      <view class="px-4 pb-8 pt-4">
        <!-- 协同陪伴 Hero -->
        <view class="mb-4">
          <view class="join-hero w-full rounded-3xl shadow-card overflow-hidden">
            <view class="join-hero__inner">
              <view class="absolute inset-0 bg-gradient-to-br from-warm-border via-subtle to-warm-border" />
              <view class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand/5" />
              <view class="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-brand/5" />
              <view class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brand/[0.04]" />

              <view class="absolute inset-0 flex-col-center px-6 text-center">
                <view class="join-companions mb-4">
                  <view class="join-companion join-companion--left">
                    <view class="i-carbon-user-avatar text-lg text-brand/70" />
                  </view>
                  <view class="join-companion join-companion--center">
                    <view class="i-carbon-user-multiple text-xl text-brand" />
                  </view>
                  <view class="join-companion join-companion--right">
                    <view class="i-carbon-user-avatar text-lg text-brand/70" />
                  </view>
                </view>
                <text class="text-[15px] font-semibold text-primary block">{{ heroTitle }}</text>
                <text
                  v-if="inviteSource === 'share'"
                  class="text-[11px] text-secondary block mt-1.5"
                >
                  好友邀请 · 确认信息后即可加入
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 邀请码：视觉焦点 -->
        <view class="join-code-card mb-4">
          <view class="join-code-card__accent" />
          <view class="join-code-card__body">
            <view class="flex items-center gap-2 mb-3">
              <view class="i-carbon-ticket text-brand text-sm" />
              <text class="text-[13px] font-medium text-secondary">邀请码</text>
            </view>
            <view
              class="join-code-field"
              :class="{
                'join-code-field--focused': codeInputFocused,
                'join-code-field--filled': !!inviteCode.trim(),
                'join-code-field--error': !!errorMsg
              }"
            >
              <input
                :value="inviteCode"
                class="join-code-field__input"
                placeholder="输入 4 位邀请码"
                placeholder-class="join-code-field__placeholder"
                :maxlength="INVITE_CODE_LENGTH"
                @input="onInviteCodeInput"
                @focus="codeInputFocused = true"
                @blur="codeInputFocused = false"
                @confirm="handleJoin"
              />
            </view>
            <text v-if="errorMsg" class="join-code-card__error">{{ errorMsg }}</text>
          </view>
        </view>

        <!-- 分享承接提示：已登录 + 邀请码已预填时，给一个明确的一键加入引导 -->
        <view
          v-if="isOneTapJoinCandidate"
          class="join-share-hint mb-4"
        >
          <view class="flex items-start gap-3">
            <view class="i-carbon-chat text-brand text-lg shrink-0 mt-0.5" />
            <view class="flex-1 min-w-0">
              <text class="text-[13px] font-medium text-primary block">好友邀请已识别</text>
              <text class="text-[11px] text-secondary block mt-0.5 leading-relaxed">
                点击下方「加入旅行」即可加入，无需输入邀请码。
              </text>
            </view>
          </view>
        </view>

        <!-- 协同能力说明 -->
        <view class="card-base p-4 mb-4">
          <view class="flex items-center gap-2 mb-3">
            <view class="i-carbon-collaborate text-secondary text-sm" />
            <text class="text-[13px] font-medium text-secondary">加入后可以一起</text>
          </view>
          <view class="join-cap-list">
            <view class="join-cap-row">
              <view class="join-cap-row__icon join-cap-row__icon--map">
                <view class="i-carbon-map text-brand text-base" />
              </view>
              <view class="flex-1 min-w-0">
                <text class="join-cap-row__title">协同编辑行程</text>
                <text class="join-cap-row__desc">一起规划路线与节点，随时同步更新</text>
              </view>
            </view>
            <view class="join-cap-divider" />
            <view class="join-cap-row">
              <view class="join-cap-row__icon join-cap-row__icon--wallet">
                <view class="i-carbon-wallet text-brand text-base" />
              </view>
              <view class="flex-1 min-w-0">
                <text class="join-cap-row__title">共同记录开支</text>
                <text class="join-cap-row__desc">分摊与记账一目了然，账目透明可查</text>
              </view>
            </view>
            <view class="join-cap-divider" />
            <view class="join-cap-row">
              <view class="join-cap-row__icon join-cap-row__icon--journal">
                <view class="i-carbon-notebook text-brand text-base" />
              </view>
              <view class="flex-1 min-w-0">
                <text class="join-cap-row__title">各自记录日志</text>
                <text class="join-cap-row__desc">写下自己的旅途点滴，与同行者一起回看</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="join-footer bg-background/90 border-t border-warm-border/50" :style="footerBarStyle">
      <view
        class="join-footer-btn join-footer-btn--primary"
        :class="{ 'join-footer-btn--disabled': !canJoin }"
        @click="handleJoin"
      >
        <view v-if="joining" class="i-carbon-circle-dash animate-spin text-white text-lg mr-2" />
        <text class="join-footer-btn__text">{{ ctaText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShow, onReady } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import { buildDefaultShareAppMessage } from '@/utils/wechatShare'
import { CollaborationService } from '@/services/collaboration'
import { HttpError } from '@/utils/http'
import {
  INVITE_CODE_LENGTH,
  isInviteCodeSubmittable,
  normalizeInviteCode,
  sanitizeInviteCodeInput
} from '@/utils/inviteCode'
import { useUserStore } from '@/stores/user'

const INVITE_CODE_STORAGE_KEY = 'pending_invite_code'
const INVITE_SOURCE_STORAGE_KEY = 'pending_invite_source'
const POST_LOGIN_AUTO_JOIN_KEY = 'pending_post_login_auto_join'

useWechatShare({ getShareAppMessage: buildDefaultShareAppMessage })

const userStore = useUserStore()
const inviteCode = ref('')
/** 邀请来源：'share' = 微信好友分享直跳；'manual' = 用户手填或自行进入；undefined = 未识别 */
const inviteSource = ref<'share' | 'manual' | undefined>(undefined)
const errorMsg = ref('')
const joining = ref(false)
const codeInputFocused = ref(false)
const returnAfterLogin = ref(false)

const statusBarHeight = ref(0)
const capsuleBottom = ref(0)
const windowHeight = ref(0)
const safeAreaBottom = ref(0)
const headerHeightPx = ref(80)
const footerHeightPx = ref(72)
const instance = getCurrentInstance()

const canJoin = computed(() => isInviteCodeSubmittable(inviteCode.value) && !joining.value)

const onInviteCodeInput = (event: { detail: { value: string } }) => {
  inviteCode.value = sanitizeInviteCodeInput(event.detail.value)
}

/** 邀请码来源决定 hero 文案与主按钮文案 */
const heroTitle = computed(() =>
  inviteSource.value === 'share' ? '加入好友的旅行' : '和好友一起规划行程'
)
const ctaText = computed(() => {
  if (joining.value) return '加入中...'
  if (inviteSource.value === 'share' && !userStore.isLogin()) return '登录并加入'
  return '加入旅行'
})

const navPaddingTop = computed(() => {
  if (capsuleBottom.value) return `${capsuleBottom.value + 4}px`
  return `${statusBarHeight.value + 8}px`
})

const footerHeightFallback = computed(() => 12 + 52 + 12 + safeAreaBottom.value)

const pageShellStyle = computed(() => ({
  height: `${windowHeight.value || 667}px`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#FFFFFF'
}))

const scrollBodyHeight = computed(() => {
  if (!windowHeight.value) return 400
  const footerH = footerHeightPx.value || footerHeightFallback.value
  return Math.max(windowHeight.value - headerHeightPx.value - footerH, 200)
})

const footerBarStyle = computed(() => ({
  flexShrink: '0',
  paddingTop: '12px',
  paddingLeft: '16px',
  paddingRight: '16px'
}))

const measurePageLayout = () => {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    if (instance?.proxy) {
      query.in(instance.proxy)
    }
    query.select('.join-header').boundingClientRect()
    query.select('.join-footer').boundingClientRect()
    query.exec(results => {
      const headerRect = results?.[0]
      const footerRect = results?.[1]
      if (headerRect && headerRect.height > 0) {
        headerHeightPx.value = headerRect.height
      }
      if (footerRect && footerRect.height > 0) {
        footerHeightPx.value = footerRect.height
      }
    })
  })
}

const initPageMetrics = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    windowHeight.value = systemInfo.windowHeight || 0
    safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    if (menuButtonInfo) {
      capsuleBottom.value = menuButtonInfo.bottom
    }
    // #endif
  } catch {
    /* ignore */
  }
  footerHeightPx.value = footerHeightFallback.value
  measurePageLayout()
}

onMounted(() => {
  initPageMetrics()
})

onReady(() => {
  initPageMetrics()
})

onLoad((options?: { id?: string; code?: string; from?: string }) => {
  if (options?.code) {
    inviteCode.value = sanitizeInviteCodeInput(options.code)
  }
  if (options?.from === 'share') {
    inviteSource.value = 'share'
  } else if (options?.code) {
    // 通过 URL 带 code 进来但没 from 标记的，保守地当作 share 来源（因为只可能从分享或邀请码两种路径进入）
    inviteSource.value = 'share'
  } else {
    inviteSource.value = 'manual'
  }

  const pending = uni.getStorageSync(INVITE_CODE_STORAGE_KEY)
  if (pending && !inviteCode.value) {
    inviteCode.value = sanitizeInviteCodeInput(String(pending))
  }
  const pendingSource = uni.getStorageSync(INVITE_SOURCE_STORAGE_KEY)
  if (pendingSource === 'share' && !options?.from) {
    inviteSource.value = 'share'
  }
})

onShow(() => {
  // 场景 A：当前实例还在栈里时（navigateTo 后 navigateBack）—— 用 returnAfterLogin 标记
  if (returnAfterLogin.value) {
    returnAfterLogin.value = false
    if (userStore.isLogin() && isInviteCodeSubmittable(inviteCode.value)) {
      handleJoin()
    }
    return
  }
  // 场景 B：实例被重建（login 后 redirectTo）—— 用持久化标记
  const shouldAutoJoin = uni.getStorageSync(POST_LOGIN_AUTO_JOIN_KEY)
  if (shouldAutoJoin && userStore.isLogin() && isInviteCodeSubmittable(inviteCode.value)) {
    uni.removeStorageSync(POST_LOGIN_AUTO_JOIN_KEY)
    handleJoin()
  }
})

/** 仅在从分享直跳且已登录时，提示「一键加入」—— 避免静默加入；用户必须再点一次主按钮 */
const isOneTapJoinCandidate = computed(
  () => inviteSource.value === 'share' && userStore.isLogin() && isInviteCodeSubmittable(inviteCode.value)
)

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const ensureLogin = (): boolean => {
  if (userStore.isLogin()) return true

  const code = sanitizeInviteCodeInput(inviteCode.value)
  if (code) {
    uni.setStorageSync(INVITE_CODE_STORAGE_KEY, code)
  }
  if (inviteSource.value) {
    uni.setStorageSync(INVITE_SOURCE_STORAGE_KEY, inviteSource.value)
  }
  // 仅当来自分享且已识别邀请码时，登录成功后自动加入；手填邀请码的场景留给用户自己点确认
  if (inviteSource.value === 'share' && code) {
    uni.setStorageSync(POST_LOGIN_AUTO_JOIN_KEY, '1')
  }
  returnAfterLogin.value = true

  const targetUrl = code
    ? `/pages/co-editor/index?code=${encodeURIComponent(code)}&from=${inviteSource.value ?? 'manual'}`
    : '/pages/co-editor/index'
  const loginUrl = `/pages/login/index?returnUrl=${encodeURIComponent(targetUrl)}`
  uni.navigateTo({ url: loginUrl })
  return false
}

const clearPendingInviteCode = () => {
  uni.removeStorageSync(INVITE_CODE_STORAGE_KEY)
  uni.removeStorageSync(INVITE_SOURCE_STORAGE_KEY)
  uni.removeStorageSync(POST_LOGIN_AUTO_JOIN_KEY)
}

const handleJoin = async () => {
  const code = normalizeInviteCode(inviteCode.value)
  if (!isInviteCodeSubmittable(code)) {
    uni.showToast({ title: `请输入${INVITE_CODE_LENGTH}位邀请码`, icon: 'none' })
    return
  }

  if (!ensureLogin()) return

  joining.value = true
  errorMsg.value = ''

  try {
    uni.showLoading({ title: '加入中...', mask: true })
    const result = await CollaborationService.joinTrip({ inviteCode: code })
    uni.hideLoading()

    clearPendingInviteCode()

    uni.showToast({ title: '加入成功！', icon: 'success' })

    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/trip/detail?id=${encodeURIComponent(result.tripId)}`
      })
    }, 600)
  } catch (err) {
    uni.hideLoading()
    if (err instanceof HttpError) {
      errorMsg.value = getErrorMessage(err.code)
    } else {
      errorMsg.value = '网络连接失败，请检查网络'
    }
  } finally {
    joining.value = false
  }
}

const getErrorMessage = (code?: number): string => {
  switch (code) {
    case 40419:
      return '邀请不存在或已失效，请确认邀请码是否正确'
    case 42227:
      return '邀请已过期，请联系旅行创建者重新发起邀请'
    case 42228:
      return '邀请使用次数已达上限，请联系旅行创建者重新发起邀请'
    case 42215:
      return '你已经是该旅行的成员'
    case 40301:
      return '无权限加入该旅行'
    case 40101:
    case 40102:
      return '登录已过期，请重新登录后重试'
    default:
      return '加入失败，请检查邀请码是否正确'
  }
}
</script>

<style scoped>
.join-page {
  width: 100%;
  box-sizing: border-box;
}

.join-scroll {
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* 分享承接提示：暖色轻提示，承接 share→co-editor 的「好友邀请已识别」 */
.join-share-hint {
  width: 100%;
  padding: 14px 16px;
  background: rgba(79, 125, 255, 0.06);
  border: 1px solid rgba(79, 125, 255, 0.18);
  border-radius: 16px;
  box-sizing: border-box;
}

/* 16:9 比例盒，与创建旅程封面一致 */
.join-hero {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  box-sizing: border-box;
}

.join-hero__inner {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.join-companions {
  position: relative;
  width: 120px;
  height: 52px;
}

.join-companion {
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 4px 14px -2px rgba(139, 115, 85, 0.14),
    0 0 0 2px rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
}

.join-companion--left {
  left: 0;
  z-index: 1;
}

.join-companion--center {
  left: 50%;
  width: 52px;
  height: 52px;
  transform: translate(-50%, -50%);
  z-index: 3;
  background: linear-gradient(135deg, #ffffff 0%, #f0f6ff 100%);
  box-shadow:
    0 6px 20px -4px rgba(79, 125, 255, 0.22),
    0 0 0 2.5px rgba(79, 125, 255, 0.12);
}

.join-companion--right {
  right: 0;
  z-index: 2;
}

.join-code-card {
  position: relative;
  width: 100%;
  border-radius: 22px;
  background: #fffbf4;
  box-shadow:
    0 8px 28px -6px rgba(79, 125, 255, 0.14),
    0 6px 20px -4px rgba(139, 115, 85, 0.12),
    0 2px 8px -2px rgba(139, 115, 85, 0.08);
  overflow: hidden;
  box-sizing: border-box;
}

.join-code-card__accent {
  height: 3px;
  background: linear-gradient(90deg, #4F7DFF 0%, #7B9FFF 50%, rgba(79, 125, 255, 0.3) 100%);
}

.join-code-card__body {
  padding: 20px;
  box-sizing: border-box;
}

.join-code-field {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  padding: 0 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 1px rgba(237, 232, 226, 0.9),
    0 2px 8px -2px rgba(139, 115, 85, 0.08);
  box-sizing: border-box;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.join-code-field--focused {
  background: #ffffff;
  box-shadow:
    inset 0 0 0 1.5px rgba(79, 125, 255, 0.55),
    0 6px 20px -6px rgba(79, 125, 255, 0.22);
}

.join-code-field--filled {
  background: #faf8f5;
}

.join-code-field--error {
  background: #fef2f2;
  box-shadow: inset 0 0 0 1.5px rgba(239, 68, 68, 0.35);
}

.join-code-field__input {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: 600;
  color: #2f2a25;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
}

.join-code-field__placeholder {
  color: #9b958c;
  font-weight: 400;
  font-size: 14px;
  letter-spacing: normal;
  text-transform: none;
}

.join-code-card__error {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  color: #ef4444;
  line-height: 1.5;
  text-align: center;
}

.join-cap-list {
  display: flex;
  flex-direction: column;
}

.join-cap-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
}

.join-cap-row__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.join-cap-row__icon--map {
  background: rgba(79, 125, 255, 0.08);
}

.join-cap-row__icon--wallet {
  background: rgba(245, 230, 211, 0.65);
}

.join-cap-row__icon--journal {
  background: rgba(216, 229, 208, 0.65);
}

.join-cap-row__title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2f2a25;
  line-height: 1.4;
}

.join-cap-row__desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #9b958c;
  line-height: 1.45;
}

.join-cap-divider {
  height: 1px;
  margin: 10px 0 10px 48px;
  background: rgba(237, 232, 226, 0.85);
}

.join-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.join-footer-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.join-footer-btn__text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

.join-footer-btn--primary {
  background-color: #4F7DFF;
  box-shadow: 0 4px 14px rgba(79, 125, 255, 0.25);
}

.join-footer-btn--primary .join-footer-btn__text {
  color: #ffffff;
}

.join-footer-btn--disabled {
  opacity: 0.5;
}

.join-footer-btn--primary:active:not(.join-footer-btn--disabled) {
  transform: scale(0.98);
}
</style>