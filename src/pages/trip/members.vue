<template>
  <view class="min-h-screen bg-background flex flex-col">
    <TracciPageHeader :title="`旅行成员（${members.length}）`" @back="onBack" />

    <!-- 加载态 -->
    <TracciLoading v-if="loading" text="加载成员中..." />

    <!-- 错误态 -->
    <TracciError
      v-else-if="error"
      title="加载失败"
      message="无法获取成员列表，请重试"
      @retry="fetchMembers"
    />

    <!-- 空态 -->
    <view v-else-if="members.length === 0" class="flex-1 flex-col-center px-5">
      <view class="w-20 h-20 rounded-full bg-warm-surface flex-center mb-4">
        <view class="i-carbon-user-multiple text-3xl text-disabled" />
      </view>
      <text class="text-base font-medium text-primary block mb-2">暂无成员</text>
      <text class="text-sm text-muted text-center leading-relaxed">
        邀请好友加入，一起规划行程、记录开支
      </text>
    </view>

    <!-- 成员列表 -->
    <scroll-view v-else scroll-y class="flex-1 min-h-0">
      <view class="px-5 pt-3 pb-4 space-y-3">
        <view
          v-for="member in sortedMembers"
          :key="member.id"
          class="member-card"
        >
          <view class="flex items-center gap-3.5">
            <!-- 头像 -->
            <view class="member-avatar">
              <text class="member-avatar-text">{{ getInitial(memberDisplayName(member)) }}</text>
            </view>

            <!-- 信息 -->
            <view class="flex-1 min-w-0">
              <view class="flex items-center gap-2 mb-1">
                <text class="member-name">{{ memberDisplayName(member) }}</text>
                <view
                  v-if="member.userId === currentUserId"
                  class="member-self-tag"
                >
                  我
                </view>
              </view>
              <view class="flex items-center gap-2 flex-wrap">
                <view
                  class="member-role-badge"
                  :class="roleBadgeClass(member.role)"
                >
                  <view class="member-role-dot" :class="roleDotClass(member.role)" />
                  {{ roleLabel(member.role) }}
                </view>
                <text
                  v-if="member.accountStatus === 'deleted'"
                  class="member-status"
                >
                  账号已注销
                </text>
                <text
                  v-if="member.status !== 'active'"
                  class="member-status"
                >
                  {{ member.status === 'inactive' ? '已退出' : member.status }}
                </text>
                <text
                  v-if="member.joinedAt"
                  class="member-joined"
                >
                  {{ formatJoinedAt(member.joinedAt) }} 加入
                </text>
              </view>
            </view>

            <!-- 操作能力来自旅行详情 access.permissions -->
            <view
              v-if="canOperateMember(member)"
              class="member-actions"
            >
              <view
                v-if="canManageMembers"
                class="member-action-btn"
                @click="onChangeRole(member)"
              >
                <view class="i-carbon-settings-adjust member-action-icon" />
              </view>
              <view
                v-if="canTransferOwnership"
                class="member-action-btn member-action-btn--transfer"
                @click="onTransferOwnership(member)"
              >
                <view class="i-carbon-user-role member-action-icon member-action-icon--transfer" />
              </view>
              <view
                v-if="canManageMembers"
                class="member-action-btn member-action-btn--danger"
                @click="onRemoveMember(member)"
              >
                <view class="i-carbon-trash-can member-action-icon member-action-icon--danger" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部邀请按钮（创建者/编辑者可见） -->
    <view
      v-if="canInvite"
      class="shrink-0 px-5 py-4 bg-white border-t border-warm-border/50"
    >
      <view
        class="w-full py-3.5 rounded-2xl flex-center gap-2 bg-brand text-white font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-brand/20"
        @click="showInviteSheet = true"
      >
        <view class="i-carbon-user-follow text-base" />
        <text>邀请好友加入</text>
      </view>
    </view>

    <!-- 邀请弹层 -->
    <InviteSheet v-model="showInviteSheet" :trip-id="tripId" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useWechatShare } from '@/composables/useWechatShare'
import { buildDefaultShareAppMessage } from '@/utils/wechatShare'
import TracciLoading from '@/components/common/TracciLoading.vue'
import TracciError from '@/components/common/TracciError.vue'
import TracciPageHeader from '@/components/common/TracciPageHeader.vue'
import InviteSheet from './components/InviteSheet.vue'
import { CollaborationService } from '@/services/collaboration'
import { TripService } from '@/services/trip'
import { useUserStore } from '@/stores/user'
import type { TripMember, MemberRole } from '@/types/collaboration'
import type { TripAccess, TripPermission } from '@/types/trip'

useWechatShare({ getShareAppMessage: buildDefaultShareAppMessage })

const userStore = useUserStore()

// ── 页面状态 ──
const tripId = ref('')
const loading = ref(true)
const error = ref(false)
const members = ref<TripMember[]>([])
const tripAccess = ref<TripAccess | null>(null)
const showInviteSheet = ref(false)

const currentUserId = computed(() => userStore.userInfo?.id)

const hasPermission = (permission: TripPermission) =>
  tripAccess.value?.permissions.includes(permission) ?? false

const canManageMembers = computed(() => hasPermission('trip.members.manage'))
const canTransferOwnership = computed(() => hasPermission('trip.ownership.transfer'))
const canInvite = computed(() => hasPermission('trip.invitation.create'))

const sortedMembers = computed(() => {
  const roleOrder: Record<MemberRole, number> = { owner: 0, editor: 1, viewer: 2 }
  return [...members.value].sort((a, b) => {
    const orderDiff = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)
    if (orderDiff !== 0) return orderDiff
    return (a.joinedAt || '').localeCompare(b.joinedAt || '')
  })
})

// ── 路由 ──
onLoad(options => {
  if (options?.tripId) {
    tripId.value = options.tripId
    fetchMembers()
  } else {
    loading.value = false
    error.value = true
  }
})

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

// ── 数据 ──
const fetchMembers = async () => {
  if (!tripId.value) return
  try {
    loading.value = true
    error.value = false
    const [trip, memberList] = await Promise.all([
      TripService.getTripDetail(tripId.value),
      CollaborationService.getMembers(tripId.value)
    ])
    tripAccess.value = trip.access ?? null
    members.value = memberList
  } catch (err) {
    console.error('Fetch members failed:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// ── 工具 ──
const getInitial = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const memberDisplayName = (member: TripMember) =>
  member.accountStatus === 'deleted' ? '已注销用户' : member.nickname

const formatJoinedAt = (joinedAt: string) => {
  if (!joinedAt) return ''
  const date = new Date(joinedAt)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

const roleLabel = (role: MemberRole) => {
  switch (role) {
    case 'owner': return '创建者'
    case 'editor': return '可编辑'
    case 'viewer': return '仅查看'
    default: return role
  }
}

const roleBadgeClass = (role: MemberRole) => {
  switch (role) {
    case 'owner': return 'bg-[#FEF3C7] text-[#D97706]'
    case 'editor': return 'bg-[#EFF6FF] text-[#4F7DFF]'
    case 'viewer': return 'bg-[#F2F2F7] text-[#7A746B]'
    default: return 'bg-[#F2F2F7] text-[#7A746B]'
  }
}

const roleDotClass = (role: MemberRole) => {
  switch (role) {
    case 'owner': return 'member-role-dot--owner'
    case 'editor': return 'member-role-dot--editor'
    case 'viewer': return 'member-role-dot--viewer'
    default: return 'member-role-dot--viewer'
  }
}

// ── 操作 ──
const isActionableMember = (member: TripMember) =>
  member.role !== 'owner' &&
  member.status === 'active' &&
  member.accountStatus !== 'deleted'

const canOperateMember = (member: TripMember) =>
  isActionableMember(member) &&
  (canManageMembers.value || canTransferOwnership.value)

const onChangeRole = (member: TripMember) => {
  if (!canManageMembers.value || !isActionableMember(member)) return
  const newRole: 'editor' | 'viewer' = member.role === 'editor' ? 'viewer' : 'editor'
  const roleLabelNew = newRole === 'editor' ? '可编辑' : '仅查看'

  uni.showModal({
    title: '修改成员角色',
    content: `将「${member.nickname}」的角色修改为「${roleLabelNew}」？`,
    confirmText: '确认修改',
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '修改中...' })
        await CollaborationService.updateMemberRole(tripId.value, member.id, {
          role: newRole
        })
        uni.showToast({ title: '修改成功', icon: 'success' })
        fetchMembers()
      } catch (err) {
        console.error('Update member role failed:', err)
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const onTransferOwnership = (member: TripMember) => {
  if (!canTransferOwnership.value || !isActionableMember(member)) return
  const targetName = memberDisplayName(member)
  uni.showModal({
    title: '转让旅程所有权',
    content: `确定将旅程所有权转让给「${targetName}」吗？转让后你将变为可编辑成员。`,
    confirmText: '确认转让',
    confirmColor: '#F59E0B',
    success: async res => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '转让中...' })
        const result = await CollaborationService.transferOwnership(tripId.value, {
          memberId: member.id
        })
        tripAccess.value = result.access
        members.value = members.value.map((item): TripMember => {
          if (item.id === result.previousOwnerMemberId) return { ...item, role: 'editor' }
          if (item.id === result.newOwnerMemberId) return { ...item, role: 'owner' }
          return item
        })
        uni.showToast({ title: '所有权已转让', icon: 'success' })
      } catch (err) {
        console.error('Transfer ownership failed:', err)
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const onRemoveMember = (member: TripMember) => {
  if (!canManageMembers.value || !isActionableMember(member)) return
  uni.showModal({
    title: '移除成员',
    content: `确定要将「${member.nickname}」从旅行中移除吗？`,
    confirmText: '移除',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (!res.confirm) return
      try {
        uni.showLoading({ title: '移除中...' })
        await CollaborationService.removeMember(tripId.value, member.id)
        uni.showToast({ title: '已移除', icon: 'success' })
        fetchMembers()
      } catch (err) {
        console.error('Remove member failed:', err)
      } finally {
        uni.hideLoading()
      }
    }
  })
}
</script>

<style scoped>
/* ── 成员卡片 ── */
.member-card {
  background: #fff;
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: inset 0 -1px 0 rgba(237, 232, 226, 0.78);
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(79, 125, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-avatar-text {
  font-size: 18px;
  font-weight: 700;
  color: #4F7DFF;
  letter-spacing: 0.02em;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
  color: #2F2A25;
  line-height: 1.3;
}

.member-self-tag {
  font-size: 11px;
  font-weight: 600;
  color: #4F7DFF;
  background: rgba(79, 125, 255, 0.1);
  padding: 1px 8px;
  border-radius: 6px;
  line-height: 1.6;
}

.member-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 8px;
  line-height: 1.6;
}

.member-role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-role-dot--owner { background: #F59E0B; }
.member-role-dot--editor { background: #4F7DFF; }
.member-role-dot--viewer { background: #9B958C; }

.member-status {
  font-size: 12px;
  color: #F59E0B;
  font-weight: 500;
}

.member-joined {
  font-size: 12px;
  color: #9B958C;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.member-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #F2F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 150ms ease, background 150ms ease;
}

.member-action-btn:active {
  opacity: 0.7;
}

.member-action-btn--danger {
  background: #FEF2F2;
}

.member-action-btn--transfer {
  background: #FFFBEB;
}

.member-action-icon {
  font-size: 16px;
  color: #7A746B;
}

.member-action-icon--danger {
  color: #EF4444;
}

.member-action-icon--transfer {
  color: #D97706;
}
</style>
