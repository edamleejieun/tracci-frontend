<template>
  <TracciBottomSheet
    :model-value="modelValue"
    max-height="80vh"
    content-class="flex flex-col min-h-0"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- 标题栏 -->
    <view class="flex items-center justify-between mb-5 shrink-0">
      <text class="text-lg font-semibold text-primary">邀请好友</text>
      <view
        class="w-8 h-8 rounded-full bg-subtle flex-center active:opacity-80"
        @click="emit('update:modelValue', false)"
      >
        <view class="i-carbon-close text-secondary text-base" />
      </view>
    </view>

    <!-- 创建邀请 -->
    <template v-if="!invitationResult">
      <text class="text-sm text-secondary mb-4 block">
        创建邀请链接，好友加入后可一起编辑行程、记录开支
      </text>

      <!-- 角色选择 -->
      <text class="text-[13px] text-muted mb-3 block">好友加入后的权限</text>
      <view class="flex gap-3 mb-5">
        <view
          class="flex-1 p-4 rounded-2xl border-2 transition-all active:scale-95"
          :class="roleToGrant === 'editor'
            ? 'border-brand bg-brand/5'
            : 'border-warm-border bg-white'"
          @click="roleToGrant = 'editor'"
        >
          <view class="w-10 h-10 rounded-xl mb-2 flex-center"
            :class="roleToGrant === 'editor' ? 'bg-brand/15' : 'bg-subtle'"
          >
            <view class="i-carbon-edit text-lg"
              :class="roleToGrant === 'editor' ? 'text-brand' : 'text-muted'"
            />
          </view>
          <text class="text-[15px] font-semibold block mb-0.5"
            :class="roleToGrant === 'editor' ? 'text-brand' : 'text-primary'"
          >
            可编辑
          </text>
          <text class="text-[12px] text-muted block leading-relaxed">
            可编辑行程与开支，撰写个人日志，也可邀请他人
          </text>
        </view>

        <view
          class="flex-1 p-4 rounded-2xl border-2 transition-all active:scale-95"
          :class="roleToGrant === 'viewer'
            ? 'border-brand bg-brand/5'
            : 'border-warm-border bg-white'"
          @click="roleToGrant = 'viewer'"
        >
          <view class="w-10 h-10 rounded-xl mb-2 flex-center"
            :class="roleToGrant === 'viewer' ? 'bg-brand/15' : 'bg-subtle'"
          >
            <view class="i-carbon-view text-lg"
              :class="roleToGrant === 'viewer' ? 'text-brand' : 'text-muted'"
            />
          </view>
          <text class="text-[15px] font-semibold block mb-0.5"
            :class="roleToGrant === 'viewer' ? 'text-brand' : 'text-primary'"
          >
            仅查看
          </text>
          <text class="text-[12px] text-muted block leading-relaxed">
            只能查看旅行内容，不可编辑
          </text>
        </view>
      </view>

      <!-- 生成按钮 -->
      <view
        class="w-full py-4 rounded-2xl flex-center font-semibold text-base transition-all mb-4 shrink-0"
        :class="creating ? 'bg-border text-muted' : 'bg-brand text-white active:scale-[0.98] shadow-lg shadow-brand/20'"
        @click="createInvitation"
      >
        <view v-if="creating" class="i-carbon-circle-dash animate-spin mr-2 text-white" />
        <text>{{ creating ? '生成中...' : '生成邀请码' }}</text>
      </view>
    </template>

    <!-- 邀请结果 -->
    <template v-else>
      <view class="text-center mb-5">
        <view class="w-20 h-20 mx-auto mb-4 rounded-full bg-successBg flex-center">
          <view class="i-carbon-checkmark-outline text-3xl text-success" />
        </view>
        <text class="text-lg font-semibold text-primary block mb-1">邀请已生成</text>
        <text class="text-sm text-muted block">
          分享邀请码或小程序卡片给好友
        </text>
      </view>

      <!-- 邀请码展示 -->
      <view class="bg-warm-surface rounded-2xl p-5 mb-4">
        <text class="text-xs text-muted block mb-2">邀请码</text>
        <view class="flex items-center justify-between">
          <text class="text-2xl font-bold text-primary tracking-[0.15em]">
            {{ invitationResult.inviteCode }}
          </text>
          <view
            class="px-4 py-2 rounded-xl bg-brand text-white text-[13px] font-medium active:scale-95 transition-transform"
            @click="copyInviteCode"
          >
            复制
          </view>
        </view>
        <text class="text-[11px] text-muted block mt-3">
          4 位邀请码 · 有效期至 {{ formatExpiry(invitationResult.expiresAt) }}
        </text>
      </view>

      <!-- 操作按钮 -->
      <view class="space-y-3 shrink-0">
        <!-- 微信分享 -->
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="w-full py-3.5 rounded-2xl flex-center gap-2 bg-[#07C160] text-white font-semibold text-sm active:scale-[0.98] transition-transform"
          style="margin: 0; border: none; line-height: normal"
          open-type="share"
          :data-share-path="invitationResult.miniProgramPath"
          @click="emit('update:modelValue', false)"
        >
          <view class="i-carbon-logo-wechat text-lg" />
          <text>发送给微信好友</text>
        </button>
        <!-- #endif -->

        <!-- 复制文案 -->
        <view
          class="w-full py-3.5 rounded-2xl flex-center gap-2 bg-subtle text-primary font-medium text-sm active:scale-[0.98] transition-transform"
          @click="copyShareText"
        >
          <view class="i-carbon-copy text-base" />
          <text>复制分享文案</text>
        </view>

        <!-- 重新创建 -->
        <view
          class="w-full py-3 rounded-2xl flex-center text-sm text-muted active:opacity-70"
          @click="resetForm"
        >
          重新创建邀请
        </view>
      </view>
    </template>
  </TracciBottomSheet>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TracciBottomSheet from '@/components/common/TracciBottomSheet.vue'
import { CollaborationService } from '@/services/collaboration'
import type { InvitationResponse } from '@/types/collaboration'

const props = defineProps<{
  modelValue: boolean
  tripId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const roleToGrant = ref<'editor' | 'viewer'>('editor')
const creating = ref(false)
const invitationResult = ref<InvitationResponse | null>(null)

const createInvitation = async () => {
  if (creating.value || !props.tripId) return
  creating.value = true
  try {
    uni.showLoading({ title: '生成中...' })
    const result = await CollaborationService.createInvitation(props.tripId, {
      roleToGrant: roleToGrant.value,
      expiresInHours: 168, // 7 days
      maxUses: 10
    })
    invitationResult.value = result
  } catch (err) {
    console.error('Create invitation failed:', err)
  } finally {
    uni.hideLoading()
    creating.value = false
  }
}

const copyInviteCode = () => {
  if (!invitationResult.value?.inviteCode) return
  uni.setClipboardData({
    data: invitationResult.value.inviteCode,
    success: () => {
      uni.showToast({ title: '邀请码已复制', icon: 'success' })
    }
  })
}

const copyShareText = () => {
  if (!invitationResult.value?.shareText) return
  uni.setClipboardData({
    data: invitationResult.value.shareText,
    success: () => {
      uni.showToast({ title: '文案已复制', icon: 'success' })
    }
  })
}

const formatExpiry = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const resetForm = () => {
  invitationResult.value = null
  roleToGrant.value = 'editor'
}
</script>
