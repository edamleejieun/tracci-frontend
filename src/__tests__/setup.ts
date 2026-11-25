/**
 * Vitest 全局 setup：注入 uni 全局 mock。
 * 仅用于非 uni 插件的单元测试环境。
 */

import { vi } from 'vitest'

// 存储所有被写入的 key，方便测试中清理
const storage: Record<string, unknown> = {}
const storageKeys: string[] = []

// 用 vi.fn 包装，使断言可追踪
const mockGetStorageSync = vi.fn((key: string) => storage[key] ?? null)
const mockSetStorageSync = vi.fn((key: string, value: unknown) => {
  if (!storageKeys.includes(key)) {
    storageKeys.push(key)
  }
  storage[key] = value
})
const mockRemoveStorageSync = vi.fn((key: string) => {
  delete storage[key]
  const idx = storageKeys.indexOf(key)
  if (idx !== -1) storageKeys.splice(idx, 1)
})

// @ts-expect-error - 全局注入 uni mock
globalThis.uni = {
  getStorageSync: mockGetStorageSync,
  setStorageSync: mockSetStorageSync,
  removeStorageSync: mockRemoveStorageSync,
  getStorageInfoSync: vi.fn(() => ({
    currentSize: 0,
    limitSize: 10 * 1024, // 10MB
    keys: [...storageKeys]
  })),
}

// 导出 spy 引用和 storage，方便测试中使用
export { mockGetStorageSync, mockSetStorageSync, mockRemoveStorageSync, storage }
