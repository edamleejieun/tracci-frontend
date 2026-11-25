import { useUserStore } from '@/stores/user'

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'

export interface RequestOptions extends UniApp.RequestOptions {
  custom?: {
    noAuth?: boolean // Set to true if token is not needed
    noToast?: boolean // Set to true when the caller renders its own inline error state
  }
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

interface RefreshTokenData {
  accessToken: string
  accessTokenExpiresAt: string
}

export class HttpError extends Error {
  code?: number
  statusCode?: number

  constructor(message: string, code?: number, statusCode?: number) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.statusCode = statusCode
  }
}

const redirectToLogin = (title: string) => {
  const userStore = useUserStore()
  userStore.clearAuthState()
  uni.showToast({
    title,
    icon: 'none'
  })
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/login/index' })
  }, 1500)
}

const refreshAccessToken = (): Promise<boolean> => {
  const refreshToken = uni.getStorageSync('refresh_token')
  if (!refreshToken) return Promise.resolve(false)

  return new Promise(resolve => {
    uni.request({
      url: `${baseURL}/auth/refresh`,
      method: 'POST',
      data: {
        refreshToken
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: res => {
        const data = res.data as ApiResponse<RefreshTokenData>
        if (res.statusCode >= 200 && res.statusCode < 300 && data.code === 0) {
          const userStore = useUserStore()
          userStore.setToken(data.data.accessToken)
          userStore.setAccessTokenExpiresAt(data.data.accessTokenExpiresAt)
          // 后端目前不支持 refresh token rotation，只返回新 accessToken，保留原 refreshToken
          resolve(true)
          return
        }
        resolve(false)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/** GET 查询参数里若保留 undefined，小程序会把其序列化成字符串 "undefined"，污染后端筛选条件 */
function sanitizeGetData(data: unknown): unknown {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return data
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null)
  )
}

export const http = <T>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const request = (hasRetried = false) => {
      const token = uni.getStorageSync('access_token')
      const header: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.header
      }

      if (token && !options.custom?.noAuth) {
        header['Authorization'] = `Bearer ${token}`
      }

      const method = (options.method || 'GET').toUpperCase()
      const data = method === 'GET' ? sanitizeGetData(options.data) : options.data

      uni.request({
        ...options,
        data,
        url: options.url.startsWith('http') ? options.url : `${baseURL}${options.url}`,
        header,
        success: async res => {
          const data = res.data as ApiResponse

          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (data.code === 0) {
              resolve(data.data as T)
            } else {
              if (data.code === 40101 && !hasRetried && !options.custom?.noAuth) {
                const refreshed = await refreshAccessToken()
                if (refreshed) {
                  request(true)
                  return
                }
              }

              if (data.code === 40302) {
                redirectToLogin(data.message || '账号已注销，请重新登录')
              } else if (data.code === 40101 || data.code === 40102) {
                redirectToLogin('登录已过期，请重新登录')
              } else if (!options.custom?.noToast) {
                uni.showToast({
                  title: data.message || '请求失败',
                  icon: 'none'
                })
              }
              reject(new HttpError(data.message || 'Error', data.code, res.statusCode))
            }
          } else if (res.statusCode === 401) {
            if (!hasRetried && !options.custom?.noAuth) {
              const refreshed = await refreshAccessToken()
              if (refreshed) {
                request(true)
                return
              }
            }
            redirectToLogin('请先登录')
            reject(new HttpError(data?.message || 'Unauthorized', data?.code, res.statusCode))
          } else if (res.statusCode === 403 && data?.code === 40302) {
            redirectToLogin(data.message || '账号已注销，请重新登录')
            reject(new HttpError(data.message || 'Account deleted', data.code, res.statusCode))
          } else {
            if (!options.custom?.noToast) {
              uni.showToast({
                title: data?.message || '网络请求错误',
                icon: 'none'
              })
            }
            reject(new HttpError(data?.message || 'Network Error', data?.code, res.statusCode))
          }
        },
        fail: err => {
          if (!options.custom?.noToast) {
            uni.showToast({
              title: '网络连接失败，请检查网络',
              icon: 'none'
            })
          }
          reject(err)
        }
      })
    }

    request()
  })
}

export default http
