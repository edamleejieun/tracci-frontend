export interface UserInfo {
  id: string
  email?: string
  nickname?: string
  avatarFileId?: string
  avatarUrl?: string
  createdAt: string
  /** 手机号（付费功能开通后使用） */
  phone?: string
  phoneVerified?: boolean
  loginType?: string
}

export interface UserUpdateReq {
  nickname?: string
  /** 头像文件 ID；传空字符串可清空头像 */
  avatarFileId?: string
}

/** 账号安全信息 */
export interface SecurityInfo {
  email?: string
  phone?: string
  phoneVerified: boolean
  hasPassword: boolean
  bindings: {
    email: boolean
    phone: boolean
    wechat: boolean
    apple: boolean
  }
}

/** 注销账号请求 */
export interface DeleteAccountReq {
  /** 必须为字面量 DELETE */
  confirmText: 'DELETE'
  /** 注销原因，可选，最长 200 字 */
  reason?: string
  /** 已设置密码的账号必填 */
  password?: string
}
