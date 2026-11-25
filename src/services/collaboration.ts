import { http } from '@/utils/http'
import { normalizeInviteCode } from '@/utils/inviteCode'
import type {
  CreateInvitationRequest,
  InvitationResponse,
  JoinTripRequest,
  JoinTripResponse,
  TripMember,
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  TransferOwnershipResponse,
  ActivityLogListResponse
} from '@/types/collaboration'

export const CollaborationService = {
  /**
   * 创建旅行邀请
   * 需要登录；当前用户必须是 OWNER 或具备邀请权限的 EDITOR
   */
  createInvitation(tripId: string, data: CreateInvitationRequest) {
    return http<InvitationResponse>({
      url: `/trips/${tripId}/invitations`,
      method: 'POST',
      data
    })
  },

  /**
   * 使用邀请码加入旅行
   * 需要登录
   */
  joinTrip(data: JoinTripRequest) {
    return http<JoinTripResponse>({
      url: '/trip-invitations/join',
      method: 'POST',
      data: {
        inviteCode: normalizeInviteCode(data.inviteCode)
      }
    })
  },

  /**
   * 获取旅行成员列表
   * 需要登录；当前用户必须是该旅行成员
   * v1 不分页，直接返回数组
   */
  getMembers(tripId: string) {
    return http<TripMember[]>({
      url: `/trips/${tripId}/members`,
      method: 'GET'
    })
  },

  /**
   * 修改成员角色
   * 需要登录；当前用户必须是 OWNER
   */
  updateMemberRole(tripId: string, memberId: string, data: UpdateMemberRoleRequest) {
    return http<TripMember>({
      url: `/trips/${tripId}/members/${memberId}`,
      method: 'PUT',
      data
    })
  },

  /**
   * 转让旅程所有权
   * 需要登录；当前用户必须具备 trip.ownership.transfer
   */
  transferOwnership(tripId: string, data: TransferOwnershipRequest) {
    return http<TransferOwnershipResponse>({
      url: `/trips/${tripId}/owner`,
      method: 'PUT',
      data
    })
  },

  /**
   * 移除成员
   * 需要登录；当前用户必须是 OWNER
   */
  removeMember(tripId: string, memberId: string) {
    return http<null>({
      url: `/trips/${tripId}/members/${memberId}`,
      method: 'DELETE'
    })
  },

  /**
   * 获取旅程动态
   * 需要登录；当前用户必须是该旅行成员
   * 服务端默认仅返回行程、开支、日志等旅程内容变更
   */
  getActivityLogs(
    tripId: string,
    params?: { page?: number; pageSize?: number }
  ) {
    return http<ActivityLogListResponse>({
      url: `/trips/${tripId}/activity-logs`,
      method: 'GET',
      data: params
    })
  }
}
