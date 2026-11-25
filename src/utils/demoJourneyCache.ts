/**
 * Demo Journey Bundle 本地缓存。
 * 遵循后端 ETag / If-None-Match / 304 协议。
 * 缓存只用于 Demo，不得写入真实 Trip 列表、详情缓存或统计。
 */

import type { DemoJourneyBundle } from '@/types/demoJourney'

const CACHE_KEY_BUNDLE = 'demo_journey_bundle'
const CACHE_KEY_ETAG = 'demo_journey_etag'

/** 读取缓存的 ETag，无则返回 null */
export function getCachedEtag(): string | null {
  return uni.getStorageSync(CACHE_KEY_ETAG) || null
}

/** 读取缓存的 Bundle，无或解析失败返回 null */
export function getCachedBundle(): DemoJourneyBundle | null {
  try {
    const raw = uni.getStorageSync(CACHE_KEY_BUNDLE)
    if (!raw) return null
    return JSON.parse(raw) as DemoJourneyBundle
  } catch {
    return null
  }
}

/** 原子替换 Bundle + ETag */
export function saveBundle(bundle: DemoJourneyBundle, etag: string): void {
  try {
    // 检查存储配额，避免超出微信小程序 10MB 限制
    const info = uni.getStorageInfoSync()
    const estimatedKB = JSON.stringify(bundle).length / 1024
    if (info.currentSize + estimatedKB > info.limitSize * 0.9) {
      console.warn('[demoCache] storage near quota, clearing old cache')
      uni.removeStorageSync(CACHE_KEY_BUNDLE)
      uni.removeStorageSync(CACHE_KEY_ETAG)
    }
    uni.setStorageSync(CACHE_KEY_BUNDLE, JSON.stringify(bundle))
    uni.setStorageSync(CACHE_KEY_ETAG, etag)
  } catch (e) {
    console.warn('[demoCache] save failed', e)
  }
}
