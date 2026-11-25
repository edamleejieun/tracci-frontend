import { http } from '@/utils/http'
import type { UserInfo, UserUpdateReq, DeleteAccountReq, SecurityInfo } from '@/types/user'

export const UserService = {
  /**
   * 获取当前登录用户信息
   */
  getCurrentUser() {
    return http<UserInfo>({
      url: '/users/me',
      method: 'GET'
    })
  },

  /**
   * 更新当前用户信息
   */
  updateCurrentUser(data: UserUpdateReq) {
    return http<UserInfo>({
      url: '/users/me',
      method: 'PUT',
      data
    })
  },

  /**
   * 获取账号安全信息
   */
  getSecurityInfo() {
    return http<SecurityInfo>({
      url: '/users/me/security',
      method: 'GET'
    })
  },

  /**
   * 注销当前账号
   */
  deleteAccount(data: DeleteAccountReq) {
    return http<null>({
      url: '/users/me/delete-account',
      method: 'POST',
      data,
      custom: {
        noToast: true
      }
    })
  }
}
