<template>
  <TracciBottomSheet
    :model-value="modelValue"
    fit-content
    padding-bottom="calc(20px + env(safe-area-inset-bottom))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="bind-sheet w-full box-border min-w-0">
      <!-- Header -->
      <view class="bind-header" :class="{ 'bind-header--with-action': mode === 'unbind' && !hasOtherLoginMethod }">
        <view class="bind-header__icon">
          <view class="i-carbon-phone text-white text-base" />
        </view>
        <view class="bind-header__text">
          <text class="bind-header__title">{{ title }}</text>
          <text class="bind-header__subtitle">{{ subtitle }}</text>
        </view>
        <text
          v-if="mode === 'unbind' && !hasOtherLoginMethod"
          class="bind-header__cancel active:opacity-70"
          @click="handleCancelUnbind"
        >
          取消
        </text>
      </view>

      <!-- Unbind Mode -->
      <template v-if="mode === 'unbind'">
        <view class="bind-info-card">
          <text class="bind-info-card__label">当前绑定手机号</text>
          <text class="bind-info-card__value">{{ maskedPhone }}</text>
        </view>

        <view v-if="!hasOtherLoginMethod" class="bind-warn bind-warn--warning">
          <view class="i-carbon-warning bind-warn__icon" />
          <text class="bind-warn__text">
            当前账号仅通过手机号登录，解绑后无法登录。请先确保已有其他可用登录方式。
          </text>
        </view>
        <view v-else class="bind-warn bind-warn--danger">
          <view class="i-carbon-warning bind-warn__icon" />
          <text class="bind-warn__text">
            解绑后，该手机号将不再关联到你的账号。若该手机号同时绑定了其他登录方式，解绑操作可能影响登录。
          </text>
        </view>

        <view v-if="hasOtherLoginMethod" class="bind-actions">
          <TracciButton type="secondary" block @click="handleCancelUnbind">
            取消
          </TracciButton>
          <TracciButton
            type="danger"
            block
            :loading="loading"
            @click="handleUnbind"
          >
            确认解绑
          </TracciButton>
        </view>
      </template>

      <!-- Bind Mode：对齐 forgot-password 的 code-row 固定高度布局 -->
      <template v-else>
        <view class="bind-form">
          <view class="bind-field">
            <text class="bind-label">手机号</text>
            <view class="bind-phone-row">
              <text class="bind-phone-prefix">+86</text>
              <view class="bind-phone-divider" />
              <input
                v-model="phoneInput"
                class="bind-phone-input"
                type="number"
                maxlength="11"
                placeholder="请输入手机号"
                placeholder-class="bind-placeholder"
                @input="onPhoneInput"
              />
            </view>
            <text v-if="phoneError" class="bind-field-error">{{ phoneError }}</text>
          </view>

          <view class="bind-field">
            <text class="bind-label">验证码</text>
            <view class="bind-code-row">
              <input
                :value="codeInput"
                class="bind-code-input"
                type="number"
                maxlength="6"
                placeholder="请输入6位验证码"
                placeholder-class="bind-placeholder"
                @input="onCodeInput"
              />
              <view
                class="bind-code-send"
                :class="{
                  'bind-code-send--disabled': !canSendCode || countdown > 0 || sendingCode
                }"
                @click="handleSendCode"
              >
                <view v-if="sendingCode" class="i-carbon-circle-dash animate-spin text-brand text-sm" />
                <text v-else class="bind-code-send__text">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </text>
              </view>
            </view>
            <text v-if="codeError" class="bind-field-error">{{ codeError }}</text>
          </view>

          <view v-if="errorMessage" class="bind-error-banner">
            <view class="i-carbon-warning text-sm shrink-0" />
            <text class="bind-error-banner__text">{{ errorMessage }}</text>
          </view>

          <view
            class="bind-submit"
            :class="{ 'bind-submit--disabled': !canSubmit || loading }"
            @click="handleBind"
          >
            <view v-if="loading" class="i-carbon-circle-dash animate-spin text-white text-base" />
            <text v-else class="bind-submit__text">确认绑定</text>
          </view>
        </view>

        <view class="bind-agreement">
          <text class="bind-agreement__text">
            绑定即表示同意
            <text class="bind-agreement__link" @click="handleViewPrivacy">《隐私政策》</text>
            和
            <text class="bind-agreement__link" @click="handleViewTerms">《用户协议》</text>
          </text>
        </view>
      </template>
    </view>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import TracciButton from '@/components/common/TracciButton.vue'
import { AuthService } from '@/services/auth'
import { navigateToLegalPage } from '@/utils/wechatPrivacy'
import { useBindingSheet } from '@/composables/useBindingSheet'
import type { SecurityInfo } from '@/types/user'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    securityInfo: SecurityInfo | null
  }>(),
  { securityInfo: null }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const hasPhone = computed(() => !!props.securityInfo?.phone)
const mode = computed(() => (hasPhone.value ? 'unbind' : 'bind'))

const title = computed(() => (mode.value === 'unbind' ? '解绑手机号' : '绑定手机号'))

const subtitle = computed(() =>
  mode.value === 'unbind'
    ? '解绑后将无法通过手机号登录'
    : '绑定后可使用手机号作为登录方式'
)

const maskedPhone = computed(() => {
  const phone = props.securityInfo?.phone
  if (!phone || phone.length < 7) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
})

const hasOtherLoginMethod = computed(() => {
  const b = props.securityInfo?.bindings
  if (!b) return false
  return !!(b.email || b.wechat || b.apple)
})

const phoneInput = ref('')
const codeInput = ref('')
const phoneError = ref('')
const codeError = ref('')
const loading = ref(false)
const sendingCode = ref(false)

const {
  countdown,
  errorMessage,
  clearCountdown,
  mapApiError,
  sendCode,
  validatePhone,
} = useBindingSheet()

const canSendCode = computed(() => {
  const digits = phoneInput.value.replace(/\D/g, '')
  return digits.length === 11 && validatePhone(digits) === null
})

const canSubmit = computed(() => {
  if (mode.value !== 'bind') return !loading.value
  const digits = phoneInput.value.replace(/\D/g, '')
  return (
    digits.length === 11 &&
    codeInput.value.length === 6 &&
    !phoneError.value &&
    !codeError.value &&
    !loading.value
  )
})

function onPhoneInput() {
  phoneError.value = ''
  errorMessage.value = ''
  const digits = phoneInput.value.replace(/\D/g, '')
  if (digits.length > 11) {
    phoneInput.value = digits.slice(0, 11)
  }
  const err = validatePhone(phoneInput.value.replace(/\D/g, ''))
  if (err) {
    phoneError.value = err
  }
}

function onCodeInput(e: Event) {
  codeError.value = ''
  errorMessage.value = ''
  const target = e.target as HTMLInputElement | null
  const value = target?.value || ''
  codeInput.value = value.replace(/\D/g, '').slice(0, 6)
}

async function handleSendCode() {
  const digits = phoneInput.value.replace(/\D/g, '')
  const phoneErr = validatePhone(digits)
  if (phoneErr) {
    phoneError.value = phoneErr
    return
  }

  await sendCode({
    sendApi: () => AuthService.sendPhoneBindCode({ phone: normalizePhone(digits) }),
    canSend: canSendCode.value,
    sending: sendingCode,
    preCheck: () => {
      codeInput.value = ''
      codeError.value = ''
    },
  })
}

async function handleBind() {
  if (!canSubmit.value) return

  codeError.value = ''
  errorMessage.value = ''

  if (codeInput.value.length !== 6) {
    codeError.value = '请输入6位验证码'
    return
  }

  loading.value = true
  try {
    await AuthService.confirmPhoneBind({
      phone: normalizePhone(phoneInput.value),
      code: codeInput.value,
    })
    emit('success')
    handleClose()
  } catch (err) {
    mapApiError(err, {
      code: codeError,
    })
  } finally {
    loading.value = false
  }
}

async function handleUnbind() {
  if (!hasOtherLoginMethod.value) return

  loading.value = true
  try {
    await AuthService.unbindPhone()
    emit('success')
    handleClose()
  } catch (err) {
    mapApiError(err, {})
  } finally {
    loading.value = false
  }
}

function handleCancelUnbind() {
  emit('update:modelValue', false)
}

function handleClose() {
  resetForm()
  emit('update:modelValue', false)
}

function handleViewPrivacy() {
  navigateToLegalPage('privacy')
}

function handleViewTerms() {
  navigateToLegalPage('terms')
}

function resetForm() {
  phoneInput.value = ''
  codeInput.value = ''
  phoneError.value = ''
  codeError.value = ''
  errorMessage.value = ''
  loading.value = false
  sendingCode.value = false
  clearCountdown()
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('86') && digits.length === 13) {
    return '+' + digits
  }
  if (digits.length === 11) {
    return '+86' + digits
  }
  return '+' + digits
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      resetForm()
    }
  }
)
</script>

<style scoped src="./bind-sheet-shared.css"></style>
