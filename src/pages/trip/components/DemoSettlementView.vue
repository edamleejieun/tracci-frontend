<!--
  Demo 只读 AA 结算视图
  直接接收 SettlementResponse prop，不调用 API。
  模板结构复用 SettlementView。
-->
<template>
  <view>
    <!-- 无数据 -->
    <template v-if="!settlement || settlement.members.length === 0">
      <view class="p-8 text-center">
        <view class="w-20 h-20 mx-auto mb-4 rounded-full bg-warm-surface flex-center">
          <view class="i-carbon-wallet text-3xl text-disabled" />
        </view>
        <text class="text-base font-medium text-primary block mb-2">暂无结算数据</text>
        <text class="text-sm text-muted block leading-relaxed">
          添加团队开支后，这里会显示 AA 结算结果
        </text>
      </view>
    </template>

    <!-- 结算数据 -->
    <template v-else>
      <!-- 总金额卡片 -->
      <view class="settlement-hero p-5 mb-5 relative overflow-hidden">
        <view
          class="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style="background: linear-gradient(135deg, rgba(34,197,94,0.06), transparent); transform: translate(30%, -50%)"
        />

        <view class="relative">
          <view class="flex items-center gap-2 mb-3">
            <view class="w-8 h-8 rounded-xl bg-successBg flex-center">
              <view class="i-carbon-group-account text-success text-base" />
            </view>
            <text class="text-[13px] text-muted">团队总开支</text>
          </view>
          <view class="flex items-baseline gap-1">
            <text class="text-sm text-secondary font-medium">{{ settlement.currency || 'CNY' }}</text>
            <text class="text-big-number">{{ settlement.totalGroupAmount || '0.00' }}</text>
          </view>
        </view>
      </view>

      <!-- 成员应收应付 -->
      <view class="p-5 mb-5">
        <text class="text-[15px] font-semibold text-primary block mb-4">成员账单</text>

        <view class="space-y-3">
          <view
            v-for="member in settlement.members"
            :key="member.memberId"
            class="flex items-center gap-3"
          >
            <view class="w-10 h-10 rounded-full bg-brand/10 flex-center shrink-0">
              <text class="text-sm font-semibold text-brand">
                {{ getInitial(member.displayName) }}
              </text>
            </view>

            <view class="flex-1 min-w-0">
              <text class="text-[14px] font-medium text-primary block truncate">
                {{ member.displayName }}
              </text>
              <view class="flex items-center gap-2 mt-0.5">
                <text class="text-xs text-muted">已垫付 ¥{{ member.paidAmount }}</text>
                <text class="text-xs text-muted">应分摊 ¥{{ member.shareAmount }}</text>
              </view>
            </view>

            <view class="text-right shrink-0">
              <text
                class="text-base font-semibold"
                :class="parseFloat(member.balanceAmount) >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ parseFloat(member.balanceAmount) >= 0 ? '+' : '' }}{{ member.balanceAmount }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 建议转账 -->
      <view
        v-if="settlement.suggestedTransfers && settlement.suggestedTransfers.length > 0"
        class="p-5 mb-5"
      >
        <text class="text-[15px] font-semibold text-primary block mb-4">建议转账</text>

        <view class="space-y-2">
          <view
            v-for="(transfer, index) in settlement.suggestedTransfers"
            :key="index"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-successBg/60"
          >
            <view class="flex items-center gap-1.5 flex-1 min-w-0">
              <text class="text-sm font-medium text-primary">
                {{ getMemberDisplayName(transfer.fromMemberId) }}
              </text>
              <view class="i-carbon-arrow-right text-muted text-sm shrink-0" />
              <text class="text-sm font-medium text-primary">
                {{ getMemberDisplayName(transfer.toMemberId) }}
              </text>
            </view>
            <text class="text-base font-semibold text-success shrink-0">
              ¥{{ transfer.amount }}
            </text>
          </view>
        </view>

        <view class="mt-4 px-4 py-3 rounded-2xl bg-warm-surface">
          <text class="text-xs text-muted block leading-relaxed">
            以上为建议转账方案，请成员间自行线下结算。示例旅程仅供演示。
          </text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { SettlementResponse } from '@/types/collaboration'

const props = defineProps<{
  settlement: SettlementResponse
}>()

const getInitial = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const getMemberDisplayName = (memberId: string): string => {
  const member = props.settlement.members.find(m => m.memberId === memberId)
  return member?.displayName || memberId
}
</script>

<style scoped>
.settlement-hero {
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.04), rgba(34, 197, 94, 0.01));
  border: 1px solid rgba(34, 197, 94, 0.1);
}

.text-big-number {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
</style>
