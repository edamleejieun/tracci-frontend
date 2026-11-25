import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo, DeleteAccountReq } from '@/types/user'
import { AuthService } from '@/services/auth'
import { UserService } from '@/services/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('access_token') || '')
  const refreshToken = ref(uni.getStorageSync('refresh_token') || '')
  const accessTokenExpiresAt = ref(uni.getStorageSync('access_token_expires_at') || '')
  const userInfo = ref<UserInfo | null>(uni.getStorageSync('user_info') || null)

  const isLogin = () => !!token.value

  const setToken = (newToken: string) => {
    token.value = newToken
    uni.setStorageSync('access_token', newToken)
  }

  const setRefreshToken = (newToken: string) => {
    refreshToken.value = newToken
    uni.setStorageSync('refresh_token', newToken)
  }

  const setAccessTokenExpiresAt = (expiresAt: string) => {
    accessTokenExpiresAt.value = expiresAt
    uni.setStorageSync('access_token_expires_at', expiresAt)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    uni.setStorageSync('user_info', info)
  }

  const clearAuthState = () => {
    token.value = ''
    refreshToken.value = ''
    accessTokenExpiresAt.value = ''
    userInfo.value = null
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('refresh_token')
    uni.removeStorageSync('access_token_expires_at')
    uni.removeStorageSync('user_info')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    try {
      const info = await UserService.getCurrentUser()
      setUserInfo(info)
      return info
    } catch (error) {
      console.error('Fetch user info failed', error)
      return null
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await AuthService.logout()
      }
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      clearAuthState()
    }
  }

  const deleteAccount = async (payload: DeleteAccountReq) => {
    await UserService.deleteAccount(payload)
    clearAuthState()
  }

  return {
    token,
    refreshToken,
    accessTokenExpiresAt,
    userInfo,
    isLogin,
    setToken,
    setRefreshToken,
    setAccessTokenExpiresAt,
    setUserInfo,
    clearAuthState,
    fetchUserInfo,
    logout,
    deleteAccount
  }
})
