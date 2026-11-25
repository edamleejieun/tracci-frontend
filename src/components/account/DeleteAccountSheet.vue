<template>
  <TracciBottomSheet
    :model-value="modelValue"
    max-height="88vh"
    padding-bottom="calc(24px + env(safe-area-inset-bottom))"
    :prevent-close="submitting || step === 'success'"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <view class="w-full box-border min-w-0">
      <!-- Step 1: 确认注销 -->
      <view v-if="step === 'confirm'" class="pb-2 w-full box-border">
        <view class="w-16 h-16 rounded-[20px] bg-[#FEF2F2] flex-center mx-auto mb-4">
          <view class="i-carbon-warning text-danger text-3xl" />
        </view>

        <text class="text-lg font-semibold text-primary block text-center mb-2">
          确定要注销账号吗？
        </text>
        <text class="text-[13px] text-secondary block text-center leading-relaxed mb-6">
          注销后，以下数据将无法继续访问
        </text>

        <view class="bg-[#FEF2F2] rounded-2xl p-4 mb-6 box-border">
          <view
            v-for="item in impactItems"
            :key="item"
            class="flex items-center gap-3 mb-3 last:mb-0"
          >
            <view class="w-6 h-6 rounded-lg bg-danger/10 flex-center shrink-0">
              <view class="i-carbon-close text-danger text-sm" />
            </view>
            <text class="text-[13px] text-secondary flex-1 min-w-0">{{ item }}</text>
          </view>
        </view>

        <view class="flex flex-col gap-3 w-full box-border">
          <view class="sheet-btn sheet-btn--danger" @click="step = 'reason'">
            <text class="sheet-btn__text">我已了解，继续注销</text>
          </view>
          <view class="sheet-btn sheet-btn--secondary" @click="handleClose">
            <text class="sheet-btn__text">我再想想</text>
          </view>
        </view>
      </view>

      <!-- Step 2: 选择原因（选填） -->
      <view v-else-if="step === 'reason'" class="pb-2 w-full box-border">
        <text class="text-lg font-semibold text-primary block text-center mb-2">
          告诉我们你离开的原因
        </text>
        <text class="text-[13px] text-secondary block text-center mb-6">
          你的反馈将帮助我们改进产品（选填）
        </text>

        <view class="mb-6 w-full box-border">
          <view
            v-for="reason in reasonOptions"
            :key="reason.id"
            class="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 last:mb-0 transition-colors box-border"
            :class="
              selectedReasonId === reason.id
                ? 'bg-brand/10 ring-1 ring-brand/30'
                : 'bg-warm-surface active:bg-[#F0ECE5]'
            "
            @click="selectedReasonId = reason.id"
          >
            <view
              class="w-5 h-5 rounded-full border-2 flex-center shrink-0"
              :class="
                selectedReasonId === reason.id
                  ? 'border-brand bg-brand'
                  : 'border-[#D5D0CA]'
              "
            >
              <view
                v-if="selectedReasonId === reason.id"
                class="i-carbon-checkmark text-white text-xs"
              />
            </view>
            <text
              class="text-sm flex-1 min-w-0"
              :class="selectedReasonId === reason.id ? 'text-brand font-medium' : 'text-primary'"
            >
              {{ reason.label }}
            </text>
          </view>
        </view>

        <view class="flex gap-3 w-full box-border">
          <view class="sheet-btn sheet-btn--secondary sheet-btn--half" @click="step = 'confirm'">
            <text class="sheet-btn__text">返回</text>
          </view>
          <view class="sheet-btn sheet-btn--danger sheet-btn--half" @click="step = 'final'">
            <text class="sheet-btn__text">下一步</text>
          </view>
        </view>
      </view>

      <!-- Step 3: 最终确认 -->
      <view v-else-if="step === 'final'" class="pb-2 w-full box-border">
        <text class="text-lg font-semibold text-danger block text-center mb-2">
          最后一步
        </text>
        <text class="text-[13px] text-secondary block text-center mb-6">
          请确认你已了解注销后果，此操作不可撤销
        </text>

        <view
          class="flex items-start gap-3 p-4 rounded-2xl bg-[#FEF2F2] mb-6 active:opacity-90 box-border"
          @click="toggleAgreed"
        >
          <view
            class="w-5 h-5 rounded-lg border-2 flex-center shrink-0 mt-0.5"
            :class="agreed ? 'border-danger bg-danger' : 'border-[#FCA5A5]'"
          >
            <view v-if="agreed" class="i-carbon-checkmark text-white text-xs" />
          </view>
          <text class="text-[13px] text-secondary leading-relaxed flex-1 min-w-0">
            我确认注销账号，了解所有数据将无法继续访问，包括旅行记录、开支数据、日志照片等。
          </text>
        </view>

        <view class="flex gap-3 w-full box-border">
          <view
            class="sheet-btn sheet-btn--secondary sheet-btn--half"
            :class="{ 'opacity-50': submitting }"
            @click="!submitting && (step = 'reason')"
          >
            <text class="sheet-btn__text">返回</text>
          </view>
          <view
            class="sheet-btn sheet-btn--danger sheet-btn--half"
            :class="{ 'opacity-50': !agreed || submitting }"
            @click="handleSubmit"
          >
            <view v-if="submitting" class="i-carbon-circle-dash animate-spin mr-2 text-white" />
            <text class="sheet-btn__text">{{ submitting ? '注销中...' : '确认注销' }}</text>
          </view>
        </view>
      </view>

      <!-- Step 4: 注销成功 -->
      <view v-else-if="step === 'success'" class="pb-2 text-center w-full box-border">
        <view class="w-16 h-16 rounded-[20px] bg-subtle flex-center mx-auto mb-4">
          <view class="i-carbon-checkmark text-muted text-3xl" />
        </view>

        <text class="text-lg font-semibold text-primary block mb-2">账号已注销</text>
        <text class="text-[13px] text-secondary leading-relaxed block mb-2">
          感谢你曾经使用 Tracci
        </text>
        <text class="text-[13px] text-secondary leading-relaxed block mb-6">
          期待与你再次相遇
        </text>

        <view class="sheet-btn sheet-btn--primary" @click="handleDone">
          <text class="sheet-btn__text">好的</text>
        </view>
      </view>
    </view>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import { HttpError } from '@/utils/http'
import { useUserStore } from '@/stores/user'
import {
  ERR_CODE_BAD_PARAM,
  ERR_CODE_TRIP_OWNERSHIP_REQUIRED
} from '@/constants/apiErrors'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const userStore = useUserStore()

const step = ref<'confirm' | 'reason' | 'final' | 'success'>('confirm')
const selectedReasonId = ref<string | null>(null)
const agreed = ref(false)
const submitting = ref(false)

const impactItems = [
  '所有旅行记录',
  '开支和统计数据',
  '日志和照片',
  '个人资料和设置'
]

const reasonOptions = [
  { id: 'no-need', label: '不再需要这个应用' },
  { id: 'privacy', label: '担心隐私安全' },
  { id: 'another-account', label: '想换一个账号' },
  { id: 'hard-to-use', label: '使用体验不好' },
  { id: 'other', label: '其他原因' }
]

watch(
  () => props.modelValue,
  open => {
    if (open) {
      step.value = 'confirm'
      selectedReasonId.value = null
      agreed.value = false
      submitting.value = false
    }
  }
)

const getReasonText = () => {
  if (!selectedReasonId.value) return undefined
  return reasonOptions.find(r => r.id === selectedReasonId.value)?.label
}

const handleClose = () => {
  if (submitting.value || step.value === 'success') return
  emit('update:modelValue', false)
}

const toggleAgreed = () => {
  if (submitting.value) return
  agreed.value = !agreed.value
}

const submitDelete = async (password?: string) => {
  submitting.value = true
  try {
    await userStore.deleteAccount({
      confirmText: 'DELETE',
      reason: getReasonText(),
      ...(password ? { password } : {})
    })
    submitting.value = false
    step.value = 'success'
  } catch (err) {
    submitting.value = false

    if (err instanceof HttpError) {
      if (err.code === ERR_CODE_BAD_PARAM) {
        uni.showToast({ title: '请确认注销操作', icon: 'none' })
        return
      }
      if (err.code === 40003) {
        promptPasswordAndRetry()
        return
      }
      if (err.code === ERR_CODE_TRIP_OWNERSHIP_REQUIRED) {
        uni.showModal({
          title: '暂时无法注销',
          content: '你仍是共同旅程的所有者。请先进入相关旅程的成员管理，完成所有权转让后再注销账号。',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      if (err.code === 40302 || err.code === 40102) {
        return
      }
      uni.showToast({ title: err.message || '注销失败，请稍后重试', icon: 'none' })
      return
    }

    uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
  }
}

const promptPasswordAndRetry = () => {
  uni.showModal({
    title: '验证密码',
    content: '该账号已设置密码，请输入密码以确认注销',
    editable: true,
    placeholderText: '请输入账号密码',
    confirmText: '确认',
    success: res => {
      if (!res.confirm) return
      const password = res.content?.trim()
      if (!password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }
      submitDelete(password)
    }
  })
}

const handleSubmit = () => {
  if (!agreed.value || submitting.value) return
  submitDelete()
}

const handleDone = () => {
  emit('update:modelValue', false)
  uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style scoped>
.sheet-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  padding: 14px 16px;
  border-radius: 16px;
  box-sizing: border-box;
}

.sheet-btn--half {
  flex: 1;
  width: 0;
  min-width: 0;
}

.sheet-btn__text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
}

.sheet-btn--danger {
  background-color: #ef4444;
}

.sheet-btn--danger .sheet-btn__text {
  color: #FFFFFF;
}

.sheet-btn--secondary {
  background-color: #F7F4EF;
}

.sheet-btn--secondary .sheet-btn__text {
  color: #2F2A25;
}

.sheet-btn--primary {
  background-color: #2F2A25;
}

.sheet-btn--primary .sheet-btn__text {
  color: #ffffff;
}

.sheet-btn--danger:active {
  opacity: 0.92;
}

.sheet-btn--secondary:active,
.sheet-btn--primary:active {
  opacity: 0.88;
}
</style>
