<template>
  <TracciBottomSheet
    :model-value="modelValue"
    :prevent-close="!!loading"
    max-height="88vh"
    content-class="flex flex-col min-h-0"
    padding-bottom="0"
    :show-handle="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- 标题栏 -->
    <view class="flex items-center justify-center mb-4 shrink-0 min-h-8">
      <text class="text-[17px] font-semibold text-primary">记一笔</text>
    </view>

    <scroll-view
      scroll-y
      class="flex-1 min-h-0"
      style="max-height: 62vh"
      @touchmove.stop="allowSheetScroll"
    >
      <!-- 支出范围切换 -->
      <view
        v-if="hasMultipleMembers"
        class="mb-5 px-1"
      >
        <view class="bg-subtle rounded-full p-1 flex">
          <view
            class="flex-1 py-2 rounded-full text-center text-[13px] font-medium transition-all duration-200 active:scale-[0.98]"
            :class="expenseScope === 'personal' ? 'bg-white text-brand shadow-sm' : 'text-secondary'"
            @click="expenseScope = 'personal'"
          >
            <text>个人</text>
          </view>
          <view
            class="flex-1 py-2 rounded-full text-center text-[13px] font-medium transition-all duration-200 active:scale-[0.98]"
            :class="expenseScope === 'group' ? 'bg-white text-brand shadow-sm' : 'text-secondary'"
            @click="expenseScope = 'group'"
          >
            <text>AA 分摊</text>
          </view>
        </view>
      </view>

      <!-- 金额输入 -->
      <view class="sheet-focus-field p-5 text-center mb-5">
        <view class="flex items-center justify-center gap-1 mb-2">
          <text class="text-2xl text-secondary font-medium">{{ currencySymbol }}</text>
          <input
            type="digit"
            v-model="amount"
            placeholder="0.00"
            class="text-[48px] font-semibold text-primary text-center w-48 h-14"
            placeholder-class="text-disabled"
          />
        </view>
      </view>

      <!-- AA 分摊预览 -->
      <view
        v-if="expenseScope === 'group' && parsedAmount > 0 && selectedParticipantIds.length > 0"
        class="mb-5 p-4 rounded-2xl transition-all duration-300"
        style="background: rgba(34,197,94,0.06)"
      >
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-2">
            <view class="w-7 h-7 rounded-lg bg-successBg flex-center">
              <view class="i-carbon-group-account text-success text-sm" />
            </view>
            <text class="text-[13px] text-secondary">等额分摊</text>
          </view>
          <text class="text-base font-semibold text-success">
            ¥{{ perPersonAmount }}
          </text>
        </view>
        <view class="mt-2 text-xs text-muted">
          ¥{{ parsedAmount }} ÷ {{ selectedParticipantIds.length }} 人 = 每人 ¥{{ perPersonAmount }}
        </view>
      </view>

      <!-- 付款人选择（AA 模式下） -->
      <template v-if="expenseScope === 'group'">
        <text class="text-[13px] text-muted mb-3 block">付款人</text>
        <view
          class="sheet-field w-full flex items-center justify-between px-4 py-3.5 mb-5 active:scale-[0.99] transition-transform"
          @click="showPayerPicker = true"
        >
          <view class="flex items-center gap-2">
            <view
              class="w-7 h-7 rounded-full flex-center shrink-0"
              :class="selectedPayer ? 'bg-brand/10' : 'bg-subtle'"
            >
              <text
                v-if="selectedPayer"
                class="text-xs font-semibold text-brand"
              >{{ getInitial(selectedPayer.nickname) }}</text>
              <view v-else class="i-carbon-user text-secondary text-sm" />
            </view>
            <text
              class="text-sm"
              :class="selectedPayer ? 'text-primary' : 'text-muted'"
            >
              {{ selectedPayer ? selectedPayer.nickname : '谁付的钱？' }}
            </text>
          </view>
          <view class="i-carbon-chevron-down text-muted text-sm" />
        </view>
      </template>

      <!-- 参与人选择（AA 模式下） -->
      <template v-if="expenseScope === 'group'">
        <text class="text-[13px] text-muted mb-3 block">参与人</text>
        <view
          class="sheet-field w-full flex items-center justify-between px-4 py-3.5 mb-2 active:scale-[0.99] transition-transform"
          @click="showParticipantPicker = !showParticipantPicker"
        >
          <view class="flex items-center gap-2 flex-1 min-w-0">
            <view class="i-carbon-user-multiple text-secondary text-base shrink-0" />
            <text class="text-sm" :class="selectedParticipantIds.length > 0 ? 'text-primary' : 'text-muted'">
              {{ selectedParticipantIds.length > 0 ? `已选 ${selectedParticipantIds.length}/${availableMembers.length} 人` : '选择参与分摊的成员' }}
            </text>
          </view>
          <view
            class="i-carbon-chevron-down text-muted text-sm shrink-0 transition-transform duration-200"
            :style="{ transform: showParticipantPicker ? 'rotate(180deg)' : '' }"
          />
        </view>

        <!-- 参与人展开列表 -->
        <view
          v-if="showParticipantPicker"
          class="mb-5 p-3 rounded-2xl transition-all duration-300"
          style="background: rgba(255,255,255,0.72); box-shadow: inset 0 0 0 1px rgba(237,232,226,0.58)"
        >
          <view
            v-for="member in availableMembers"
            :key="member.id"
            class="flex items-center gap-3 py-2.5 px-2 rounded-xl active:bg-warm-surface/80 transition-colors"
            @click="toggleParticipant(member.id)"
          >
            <view
              class="w-8 h-8 rounded-full flex-center shrink-0"
              :class="selectedParticipantIds.includes(member.id) ? 'bg-brand/10' : 'bg-subtle'"
            >
              <text
                class="text-xs font-semibold"
                :class="selectedParticipantIds.includes(member.id) ? 'text-brand' : 'text-secondary'"
              >{{ getInitial(member.nickname) }}</text>
            </view>
            <text class="text-sm text-primary flex-1">{{ member.nickname }}</text>
            <view
              class="w-5 h-5 rounded-full border-2 flex-center shrink-0 transition-colors"
              :class="selectedParticipantIds.includes(member.id) ? 'bg-brand border-brand' : 'border-warm-border bg-white'"
            >
              <view v-if="selectedParticipantIds.includes(member.id)" class="i-carbon-checkmark text-white text-[10px]" />
            </view>
          </view>
        </view>
      </template>

      <!-- 分类 -->
      <text class="text-[13px] text-muted mb-3 block">选择分类</text>
      <view class="flex flex-wrap mb-2">
        <view
          v-for="(cat, index) in categories"
          :key="cat.key"
          class="relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 box-border"
          :class="
            selectedCategory === cat.key
              ? 'bg-brand/10 border-brand'
              : 'sheet-choice-idle border-transparent'
          "
          :style="{
            width: 'calc((100% - 48rpx) / 3)',
            marginRight: index % 3 === 2 ? '0' : '24rpx',
            marginBottom: '24rpx'
          }"
          @click="selectedCategory = cat.key"
        >
          <text class="text-[28px]">{{ cat.emoji }}</text>
          <text
            class="text-[13px] font-medium"
            :class="selectedCategory === cat.key ? 'text-brand' : 'text-secondary'"
          >
            {{ cat.name }}
          </text>
          <view
            v-if="selectedCategory === cat.key"
            class="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex-center"
          >
            <view class="i-carbon-checkmark text-white text-[10px]" />
          </view>
        </view>
      </view>

      <!-- 日期 -->
      <text class="text-[13px] text-muted mb-3 block">日期</text>
      <picker mode="date" :value="date" class="mb-5 block" @change="onDateChange">
        <view
          class="sheet-field w-full flex items-center justify-between px-4 py-3.5 active:scale-[0.99] transition-transform"
        >
          <view class="flex items-center gap-2">
            <view class="i-carbon-calendar text-secondary text-base" />
            <text class="text-sm text-primary">{{ dateDisplay }}</text>
          </view>
          <view class="i-carbon-chevron-down text-muted text-sm" />
        </view>
      </picker>

      <!-- 备注 -->
      <text class="text-[13px] text-muted mb-3 block">备注</text>
      <view
        class="sheet-field w-full flex items-center px-4 mb-5 box-border"
        style="min-height: 48px"
      >
        <input
          v-model="note"
          type="text"
          placeholder="这笔钱花在哪里？"
          class="flex-1 w-full text-sm text-primary leading-normal"
          style="height: 48px"
          placeholder-class="text-muted"
        />
      </view>
    </scroll-view>

    <!-- 付款人选择弹层 -->
    <TracciBottomSheet
      :model-value="showPayerPicker"
      max-height="50vh"
      content-class="flex flex-col min-h-0"
      @update:model-value="showPayerPicker = $event"
    >
      <view class="flex items-center justify-between mb-5 shrink-0">
        <text class="text-[17px] font-semibold text-primary">选择付款人</text>
        <view
          class="w-8 h-8 rounded-full bg-subtle flex-center active:opacity-80"
          @click="showPayerPicker = false"
        >
          <view class="i-carbon-close text-secondary text-base" />
        </view>
      </view>
      <scroll-view scroll-y class="flex-1 min-h-0" style="max-height: 36vh">
        <view
          v-for="member in availableMembers"
          :key="member.id"
          class="flex items-center gap-3 py-3 px-2 rounded-xl active:bg-warm-surface/80 transition-colors mb-1"
          @click="selectPayer(member)"
        >
          <view
            class="w-9 h-9 rounded-full flex-center shrink-0"
            :class="selectedPayerId === member.id ? 'bg-brand/10' : 'bg-subtle'"
          >
            <text
              class="text-sm font-semibold"
              :class="selectedPayerId === member.id ? 'text-brand' : 'text-secondary'"
            >{{ getInitial(member.nickname) }}</text>
          </view>
          <text class="text-sm text-primary flex-1">{{ member.nickname }}</text>
          <view
            v-if="selectedPayerId === member.id"
            class="w-5 h-5 rounded-full bg-brand flex-center shrink-0"
          >
            <view class="i-carbon-checkmark text-white text-[10px]" />
          </view>
        </view>
      </scroll-view>
    </TracciBottomSheet>

    <!-- 保存 -->
    <view class="safe-pb pt-2 pb-4 shrink-0">
      <view
        class="w-full py-4 rounded-2xl flex-center font-semibold text-base transition-all"
        :class="canSubmit ? 'bg-brand text-white active:scale-[0.98]' : 'bg-border text-muted'"
        @click="save"
      >
        <view v-if="loading || saving" class="i-carbon-circle-dash animate-spin mr-2 text-white" />
        <text>{{ loading || saving ? '保存中...' : '保存开支' }}</text>
      </view>
    </view>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import { EXPENSE_CATEGORIES, EXPENSE_SUPPORTED_CURRENCY } from '@/constants/expense'
import type { ExpenseItem, ExpenseScope } from '@/types/expense'
import type { TripMember } from '@/types/collaboration'
import { utcToLocalDate, utcToLocalTime, localToUtcIso } from '@/utils/timezone'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  initialData?: ExpenseItem | null
  /** 旅行成员列表（用于群组支出选择付款人/参与人） */
  members?: TripMember[]
  /** 当前用户在成员列表中的 memberId */
  currentMemberId?: string
  /** 新建时默认日期（YYYY-MM-DD），不传则使用当天 */
  defaultDate?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: Record<string, unknown>): void
}>()

const amount = ref('')
const selectedCategory = ref('food')
/** 编辑时保留原币种，新建时使用默认币种 */
const expenseCurrency = ref(EXPENSE_SUPPORTED_CURRENCY)
const note = ref('')
const saving = ref(false)

// ── 群组支出字段 ──
const expenseScope = ref<ExpenseScope>('personal')
const selectedPayerId = ref('')
const selectedParticipantIds = ref<string[]>([])
const showPayerPicker = ref(false)
const showParticipantPicker = ref(false)

const allowSheetScroll = () => {}

const getLocalNow = () => {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, -1)
  const parts = localISOTime.split('T')
  return { date: parts[0], time: parts[1].substring(0, 5) }
}

const initialNow = getLocalNow()
const date = ref(initialNow.date)
const time = ref(initialNow.time)

const categories = EXPENSE_CATEGORIES
const currencySymbol = '¥'

const dateDisplay = computed(() => {
  if (!date.value) return '今天'
  const today = getLocalNow().date
  if (date.value === today) return '今天'
  return date.value.replace(/-/g, '.')
})

/** 可用的成员列表（从 prop 传入） */
const availableMembers = computed(() => props.members || [])

/** 是否有多位成员（用于显示 AA 开关） */
const hasMultipleMembers = computed(() => availableMembers.value.length > 1)

/** 当前选中的付款人 */
const selectedPayer = computed(() => {
  if (!selectedPayerId.value) return null
  return availableMembers.value.find(m => m.id === selectedPayerId.value) || null
})

/** 解析后的金额数值 */
const parsedAmount = computed(() => {
  const num = Number(amount.value)
  return Number.isNaN(num) ? 0 : num
})

/** 人均金额 */
const perPersonAmount = computed(() => {
  if (parsedAmount.value <= 0 || selectedParticipantIds.value.length === 0) return '0.00'
  return (parsedAmount.value / selectedParticipantIds.value.length).toFixed(2)
})

const canSubmit = computed(() => {
  const num = Number(amount.value)
  const baseValid = !!amount.value && !Number.isNaN(num) && num > 0 && !props.loading && !saving.value
  if (!baseValid) return false

  // AA 模式下需要选择付款人和至少一个参与人
  if (expenseScope.value === 'group') {
    if (!selectedPayerId.value) return false
    if (selectedParticipantIds.value.length === 0) return false
  }

  return true
})

watch(
  () => props.loading,
  (loading, prev) => {
    if (prev && !loading) {
      saving.value = false
    }
  }
)

watch(
  () => props.modelValue,
  val => {
    if (!val) {
      saving.value = false
      showPayerPicker.value = false
      showParticipantPicker.value = false
      return
    }

    if (props.initialData) {
      amount.value = props.initialData.amountInput
      selectedCategory.value = props.initialData.category
      expenseCurrency.value = props.initialData.currency || EXPENSE_SUPPORTED_CURRENCY
      note.value = props.initialData.note || ''
      if (props.initialData.spentAt) {
        date.value = utcToLocalDate(props.initialData.spentAt)
        time.value = utcToLocalTime(props.initialData.spentAt)
      }

      // 预填充群组支出字段
      if (props.initialData.expenseScope === 'group') {
        expenseScope.value = 'group'
        selectedPayerId.value = props.initialData.payerMemberId || ''
        selectedParticipantIds.value = props.initialData.participantMemberIds || []
        showParticipantPicker.value = selectedParticipantIds.value.length > 0
      } else {
        expenseScope.value = props.initialData.expenseScope || 'personal'
        selectedPayerId.value = ''
        selectedParticipantIds.value = []
        showParticipantPicker.value = false
      }
    } else {
      saving.value = false
      amount.value = ''
      selectedCategory.value = 'food'
      expenseCurrency.value = EXPENSE_SUPPORTED_CURRENCY
      note.value = ''
      expenseScope.value = 'personal'
      selectedPayerId.value = ''
      selectedParticipantIds.value = []
      showPayerPicker.value = false
      showParticipantPicker.value = false
      const now = getLocalNow()
      date.value = props.defaultDate || now.date
      time.value = now.time
    }
  }
)

// 当切换到个人模式时，重置群组字段
watch(expenseScope, (scope) => {
  if (scope === 'personal') {
    showPayerPicker.value = false
    showParticipantPicker.value = false
  }
})

const onDateChange = (e: { detail: { value: string } }) => {
  date.value = e.detail.value
}

const getInitial = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const selectPayer = (member: TripMember) => {
  selectedPayerId.value = member.id
  showPayerPicker.value = false
}

const toggleParticipant = (memberId: string) => {
  const idx = selectedParticipantIds.value.indexOf(memberId)
  if (idx >= 0) {
    selectedParticipantIds.value.splice(idx, 1)
  } else {
    selectedParticipantIds.value.push(memberId)
  }
}

const save = () => {
  if (props.loading || saving.value) return
  if (!amount.value || Number(amount.value) <= 0) {
    uni.showToast({ title: '请输入正确的金额', icon: 'none' })
    return
  }

  if (expenseScope.value === 'group') {
    if (!selectedPayerId.value) {
      uni.showToast({ title: '请选择付款人', icon: 'none' })
      return
    }
    if (selectedParticipantIds.value.length === 0) {
      uni.showToast({ title: '请选择参与人', icon: 'none' })
      return
    }
  }

  saving.value = true
  const spentAt = localToUtcIso(date.value, time.value)

  const baseData: Record<string, unknown> = {
    amountInput: amount.value,
    currency: expenseCurrency.value,
    category: selectedCategory.value,
    note: note.value,
    spentAt
  }

  // 群组支出字段
  if (expenseScope.value === 'group') {
    baseData.expenseScope = 'group'
    baseData.payerMemberId = selectedPayerId.value
    baseData.participantMemberIds = [...selectedParticipantIds.value]
    baseData.splitMethod = 'equal'
  } else {
    baseData.expenseScope = 'personal'
  }

  emit('save', baseData)
}
</script>

<style scoped>
.sheet-focus-field {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.64);
}

.sheet-choice-idle {
  background: rgba(255, 255, 255, 0.72);
}

.sheet-field {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(237, 232, 226, 0.58);
}
</style>
