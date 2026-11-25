<template>
  <TracciBottomSheet
    :model-value="modelValue"
    fit-content
    padding-bottom="calc(20px + env(safe-area-inset-bottom))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="bind-sheet w-full box-border min-w-0">
      <!-- Header -->
      <view class="bind-header">
        <view class="bind-header__icon">
          <view class="i-carbon-email text-white text-base" />
        </view>
        <view class="bind-header__text">
          <text class="bind-header__title">{{ title }}</text>
          <text class="bind-header__subtitle">{{ subtitle }}</text>
        </view>
      </view>

      <template>
        <view class="bind-form">
          <view class="bind-field">
            <text class="bind-label">邮箱地址</text>
            <input
              v-model="emailInput"
              class="bind-text-input"
              type="text"
              maxlength="320"
              placeholder="请输入邮箱地址"
              placeholder-class="bind-placeholder"
              @input="onEmailInput"
            />
            <text v-if="emailError" class="bind-field-error">{{ emailError }}</text>
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

          <view class="bind-field">
            <text class="bind-label">{{ passwordSectionLabel }}</text>
            <view class="bind-password-row">
              <input
                v-model="passwordInput"
                class="bind-password-input"
                :type="showPassword ? 'text' : 'password'"
                maxlength="30"
                placeholder="8-30位，必须包含字母和数字"
                placeholder-class="bind-placeholder"
                autocomplete="new-password"
                @input="onPasswordInput"
              />
              <view class="bind-password-toggle" @click="showPassword = !showPassword">
                <view :class="showPassword ? 'i-carbon-view-off' : 'i-carbon-view'" />
              </view>
            </view>
            <view class="bind-password-hints">
              <text :class="{ 'bind-password-hints__item--ok': passwordRules.length }">8-30位</text>
              <text :class="{ 'bind-password-hints__item--ok': passwordRules.letter }">含字母</text>
              <text :class="{ 'bind-password-hints__item--ok': passwordRules.digit }">含数字</text>
            </view>
            <text v-if="passwordError" class="bind-field-error">{{ passwordError }}</text>
          </view>

          <view class="bind-field">
            <text class="bind-label">确认密码</text>
            <view class="bind-password-row">
              <input
                v-model="confirmInput"
                class="bind-password-input"
                :type="showConfirmPassword ? 'text' : 'password'"
                maxlength="30"
                placeholder="请再次输入密码"
                placeholder-class="bind-placeholder"
                autocomplete="off"
                @input="onConfirmInput"
              />
              <view class="bind-password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                <view :class="showConfirmPassword ? 'i-carbon-view-off' : 'i-carbon-view'" />
              </view>
            </view>
            <text v-if="confirmError" class="bind-field-error">{{ confirmError }}</text>
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
import { ref, computed, watch } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
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

const title = '绑定邮箱'
const subtitle = '绑定邮箱后可通过邮箱登录'
const passwordSectionLabel = '设置登录密码'

const {
  countdown,
  errorMessage,
  clearCountdown,
  mapApiError,
  sendCode,
  validateEmail,
} = useBindingSheet()

const emailInput = ref('')
const codeInput = ref('')
const passwordInput = ref('')
const confirmInput = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const emailError = ref('')
const codeError = ref('')
const passwordError = ref('')
const confirmError = ref('')
const loading = ref(false)
const sendingCode = ref(false)

const passwordRules = computed(() => {
  const p = passwordInput.value
  return {
    length: p.length >= 8 && p.length <= 30,
    letter: /[a-zA-Z]/.test(p),
    digit: /\d/.test(p),
  }
})

const canSendCode = computed(() => {
  return isValidEmail(emailInput.value) && !emailError.value
})

const canSubmit = computed(() => {
  return (
    isValidEmail(emailInput.value) &&
    codeInput.value.length === 6 &&
    passwordInput.value.length >= 8 &&
    passwordInput.value === confirmInput.value &&
    passwordRules.value.length &&
    passwordRules.value.letter &&
    passwordRules.value.digit &&
    !emailError.value &&
    !codeError.value &&
    !passwordError.value &&
    !confirmError.value &&
    !loading.value
  )
})

function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(pw: string): string {
  if (pw.length === 0) return ''
  if (pw.length < 8) return '密码长度不能少于 8 位'
  if (pw.length > 30) return '密码长度不能超过 30 位'
  if (!/[a-zA-Z]/.test(pw)) return '密码必须包含至少一个字母'
  if (!/\d/.test(pw)) return '密码必须包含至少一个数字'
  return ''
}

function onEmailInput() {
  emailError.value = ''
  errorMessage.value = ''
}

function onCodeInput(e: Event) {
  codeError.value = ''
  errorMessage.value = ''
  const target = e.target as HTMLInputElement | null
  const value = target?.value || ''
  codeInput.value = value.replace(/\D/g, '').slice(0, 6)
}

function onPasswordInput() {
  passwordError.value = ''
  confirmError.value = ''
  errorMessage.value = ''
  const err = validatePassword(passwordInput.value)
  if (err) passwordError.value = err
}

function onConfirmInput() {
  confirmError.value = ''
  errorMessage.value = ''
  if (confirmInput.value && confirmInput.value !== passwordInput.value) {
    confirmError.value = '两次输入的密码不一致'
  }
}

async function handleSendCode() {
  const email = emailInput.value.trim()
  const emailErr = validateEmail(email)
  if (emailErr) {
    emailError.value = emailErr
    return
  }

  await sendCode({
    sendApi: () => AuthService.sendEmailBindCode({ email }),
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

  const pwErr = validatePassword(passwordInput.value)
  if (pwErr) {
    passwordError.value = pwErr
    return
  }
  if (passwordInput.value !== confirmInput.value) {
    confirmError.value = '两次输入的密码不一致'
    return
  }
  if (codeInput.value.length !== 6) {
    codeError.value = '请输入6位验证码'
    return
  }

  codeError.value = ''
  errorMessage.value = ''

  loading.value = true
  try {
    await AuthService.confirmEmailBind({
      email: emailInput.value.trim(),
      code: codeInput.value,
      password: passwordInput.value,
    })
    emit('success')
    handleClose()
  } catch (err) {
    mapApiError(err, {
      code: codeError,
      email: emailError,
    })
  } finally {
    loading.value = false
  }
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
  emailInput.value = ''
  codeInput.value = ''
  passwordInput.value = ''
  confirmInput.value = ''
  emailError.value = ''
  codeError.value = ''
  passwordError.value = ''
  confirmError.value = ''
  errorMessage.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  loading.value = false
  sendingCode.value = false
  clearCountdown()
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
