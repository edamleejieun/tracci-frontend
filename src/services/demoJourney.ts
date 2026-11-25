/**
 * Demo Journey Service
 *
 * GET /api/v1/demo/journey — 需要登录；支持 If-None-Match / 304。
 * 现有 http<T>() 无法读响应头与处理 304 无 body，故本 Service 独立走 uni.request。
 * 失败/关闭/不可展示时静默降级，不 toast、不踢登录（避免污染首页空态）。
 */

import type { DemoJourneyBundle } from '@/types/demoJourney'
import { isDemoBundleDisplayable } from '@/types/demoJourney'
import { validateDemoBundle, DemoValidationError } from '@/utils/demoJourneyValidator'
import { getCachedEtag, getCachedBundle, saveBundle } from '@/utils/demoJourneyCache'

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'

export type DemoJourneySource = 'network' | 'cache'

/** 对齐 iOS LoadResult：可展示 / 功能关闭 / 不可用 */
export type DemoJourneyLoadResult =
  | { status: 'displayable'; source: DemoJourneySource; bundle: DemoJourneyBundle }
  | { status: 'feature_off'; source: DemoJourneySource; bundle: DemoJourneyBundle }
  | { status: 'unavailable'; reason?: string }

function extractEtag(header: unknown): string {
  const headerObj = (header || {}) as Record<string, string>
  return headerObj['ETag'] || headerObj['etag'] || headerObj['Etag'] || ''
}

function toLoadResult(
  bundle: DemoJourneyBundle,
  source: DemoJourneySource
): DemoJourneyLoadResult {
  if (!bundle.enabled) {
    return { status: 'feature_off', source, bundle }
  }
  if (!isDemoBundleDisplayable(bundle)) {
    return { status: 'unavailable', reason: 'bundle not displayable' }
  }
  return { status: 'displayable', source, bundle }
}

function authHeader(): Record<string, string> {
  const token = uni.getStorageSync('access_token') as string
  const header: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  return header
}

/**
 * 可选：401 时尝试 refresh 一次（与 http.ts 口径一致），失败则不可用。
 * Demo 不触发跳转登录，由首页静默回退空态。
 */
function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = uni.getStorageSync('refresh_token')
  if (!refreshToken) return Promise.resolve(false)

  return new Promise(resolve => {
    uni.request({
      url: `${baseURL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success: res => {
        const body = res.data as {
          code?: number
          data?: { accessToken?: string; accessTokenExpiresAt?: string }
        }
        if (
          res.statusCode >= 200 &&
          res.statusCode < 300 &&
          body?.code === 0 &&
          body.data?.accessToken
        ) {
          try {
            uni.setStorageSync('access_token', body.data.accessToken)
            if (body.data.accessTokenExpiresAt) {
              uni.setStorageSync('access_token_expires_at', body.data.accessTokenExpiresAt)
            }
          } catch {
            // ignore storage errors
          }
          resolve(true)
          return
        }
        resolve(false)
      },
      fail: () => resolve(false)
    })
  })
}

function requestJourney(hasRetried: boolean): Promise<DemoJourneyLoadResult> {
  const etag = getCachedEtag()

  return new Promise(resolve => {
    uni.request({
      url: `${baseURL}/demo/journey`,
      method: 'GET',
      header: {
        ...authHeader(),
        ...(etag ? { 'If-None-Match': etag } : {})
      },
      success: async res => {
        // 401：尝试 refresh 一次
        if (res.statusCode === 401 && !hasRetried) {
          const ok = await tryRefreshAccessToken()
          if (ok) {
            resolve(await requestJourney(true))
            return
          }
          resolve({ status: 'unavailable', reason: 'unauthorized' })
          return
        }

        // 304：无 body，继续用本地 Bundle
        if (res.statusCode === 304) {
          const cached = getCachedBundle()
          if (!cached) {
            resolve({ status: 'unavailable', reason: '304 without cache' })
            return
          }
          try {
            // 缓存可能是旧版本；再过一遍运行时校验
            const bundle = validateDemoBundle(cached)
            resolve(toLoadResult(bundle, 'cache'))
          } catch (e) {
            console.error('[demoJourney] cached bundle invalid:', e)
            resolve({ status: 'unavailable', reason: 'invalid cache' })
          }
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data as {
            code: number
            data: unknown
            message: string
          }
          if (body?.code !== 0 || body.data == null) {
            resolve({
              status: 'unavailable',
              reason: body?.message || `business code ${body?.code}`
            })
            return
          }
          try {
            const bundle = validateDemoBundle(body.data)
            const newEtag = extractEtag(res.header)
            // 有 ETag 则原子替换；无 ETag 也尽量写入，便于下次带条件请求
            if (newEtag) {
              saveBundle(bundle, newEtag)
            } else {
              saveBundle(bundle, getCachedEtag() || `demo-local-${bundle.contentVersion}`)
            }
            resolve(toLoadResult(bundle, 'network'))
          } catch (e) {
            const msg = e instanceof DemoValidationError ? e.message : String(e)
            console.error('[demoJourney] validation failed:', msg)
            resolve({ status: 'unavailable', reason: msg })
          }
          return
        }

        console.warn('[demoJourney] unexpected status:', res.statusCode)
        // 非 2xx：尝试缓存降级
        const cached = getCachedBundle()
        if (cached) {
          try {
            resolve(toLoadResult(validateDemoBundle(cached), 'cache'))
            return
          } catch {
            // fallthrough
          }
        }
        resolve({ status: 'unavailable', reason: `http ${res.statusCode}` })
      },
      fail: () => {
        const cached = getCachedBundle()
        if (cached) {
          try {
            resolve(toLoadResult(validateDemoBundle(cached), 'cache'))
            return
          } catch {
            // fallthrough
          }
        }
        resolve({ status: 'unavailable', reason: 'network fail' })
      }
    })
  })
}

export const DemoJourneyService = {
  /**
   * 拉取可展示的 Demo Bundle。
   * 调用方应仅在「已登录 + trips.total===0 + 无搜索词 + 未毕业」时调用。
   */
  getJourney(): Promise<DemoJourneyLoadResult> {
    return requestJourney(false)
  }
}
