import type { TripAccess } from './trip'

/** 成员角色 */
export type MemberRole = 'owner' | 'editor' | 'viewer'

/** 成员状态 */
export type MemberStatus = 'active' | 'inactive'

/** 成员账号状态 */
export type MemberAccountStatus = 'active' | 'deleted'

/** 旅行成员 */
export interface TripMember {
  id: string
  tripId: string
  userId: string
  nickname: string
  avatarUrl?: string | null
  role: MemberRole
  status: MemberStatus
  accountStatus: MemberAccountStatus
  joinedAt: string
}

/** 创建邀请请求 */
export interface CreateInvitationRequest {
  roleToGrant: 'editor' | 'viewer'
  expiresInHours?: number
  maxUses?: number
}

/** 邀请响应 */
export interface InvitationResponse {
  id: string
  tripId: string
  inviteCode: string
  roleToGrant: 'editor' | 'viewer'
  expiresAt: string
  maxUses: number
  usedCount: number
  webInviteUrl: string
  miniProgramPath: string
  appDeepLink: string
  shareText: string
}

/** 加入旅行请求 */
export interface JoinTripRequest {
  inviteCode: string
}

/** 加入旅行响应 */
export interface JoinTripResponse {
  tripId: string
  memberId: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
}

/** 修改成员角色请求 */
export interface UpdateMemberRoleRequest {
  role: 'editor' | 'viewer'
}

/** 转让所有权请求 */
export interface TransferOwnershipRequest {
  memberId: string
}

/** 转让所有权响应 */
export interface TransferOwnershipResponse {
  tripId: string
  previousOwnerMemberId: string
  newOwnerMemberId: string
  newOwnerUserId: string
  access: TripAccess
}

/** 结算成员 */
export interface SettlementMember {
  memberId: string
  userId: string
  displayName: string
  /** 作为团队消费付款人的累计实付（垫付）金额。 */
  paidAmount: string
  /** 在团队消费分摊明细中累计应承担的金额。 */
  shareAmount: string
  /** paidAmount - shareAmount；正数表示应收，负数表示应付。 */
  balanceAmount: string
}

/** 建议转账 */
export interface SuggestedTransfer {
  fromMemberId: string
  toMemberId: string
  amount: string
}

/** 结算汇总响应 */
export interface SettlementResponse {
  tripId: string
  currency: string
  totalGroupAmount: string
  members: SettlementMember[]
  suggestedTransfers: SuggestedTransfer[]
}

/** 旅程动态字段变更 */
export interface FieldChange {
  field: string
  oldValue?: string
  newValue?: string
}

/** 旅程动态 */
export interface ActivityLog {
  id: string
  tripId: string
  actor: {
    userId: string
    memberId: string
    nickname: string
  }
  action: string
  targetType: string
  targetId: string
  summary: string
  fieldChanges?: FieldChange[]
  createdAt: string
}

/** 旅程动态分页响应 */
export interface ActivityLogListResponse {
  list: ActivityLog[]
  total: number
  page: number
  pageSize: number
}
