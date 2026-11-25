import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isGraduated, markGraduated, clearGraduated, getGraduatedKey } from '../demoGraduated'
import { mockGetStorageSync, mockSetStorageSync, mockRemoveStorageSync, storage } from '@/__tests__/setup'

const USER_ID = 'test-user-123'

describe('demoGraduated', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // 清空所有 mock storage
    const allKeys = [...Object.keys(storage)]
    for (const key of allKeys) {
      uni.removeStorageSync(key)
    }
  })

  describe('getGraduatedKey', () => {
    it('返回正确格式的 key', () => {
      expect(getGraduatedKey('user-1')).toBe('demo_graduated_v1_user-1')
    })

    it('空 userId 返回前缀', () => {
      expect(getGraduatedKey('')).toBe('demo_graduated_v1_')
    })
  })

  describe('isGraduated', () => {
    it('空 userId 返回 false', () => {
      expect(isGraduated('')).toBe(false)
      expect(isGraduated('   ')).toBe(false)
    })

    it('未标记时返回 false', () => {
      expect(isGraduated(USER_ID)).toBe(false)
    })

    it('已标记时返回 true', () => {
      uni.setStorageSync(getGraduatedKey(USER_ID), true)
      expect(isGraduated(USER_ID)).toBe(true)
    })

    it('标记为 false 时返回 false', () => {
      uni.setStorageSync(getGraduatedKey(USER_ID), false)
      expect(isGraduated(USER_ID)).toBe(false)
    })

    it('getStorageSync 抛异常时返回 false', () => {
      mockGetStorageSync.mockImplementation(() => { throw new Error('storage error') })
      expect(isGraduated(USER_ID)).toBe(false)
    })
  })

  describe('markGraduated', () => {
    it('空 userId 不写入', () => {
      markGraduated('')
      // 空 key 不应被写入（markGraduated 内部有 if (!userId) return 守卫）
      const key = getGraduatedKey('')
      expect(uni.getStorageSync(key)).toBe(null)
    })

    it('写入 true 到对应 key', () => {
      markGraduated(USER_ID)
      expect(mockSetStorageSync).toHaveBeenCalledWith(`demo_graduated_v1_${USER_ID}`, true)
    })

    it('覆盖已有标记', () => {
      uni.setStorageSync(getGraduatedKey(USER_ID), false)
      markGraduated(USER_ID)
      expect(mockSetStorageSync).toHaveBeenLastCalledWith(`demo_graduated_v1_${USER_ID}`, true)
    })

    it('setStorageSync 抛异常时静默', () => {
      mockSetStorageSync.mockImplementation(() => { throw new Error('storage full') })
      expect(() => markGraduated(USER_ID)).not.toThrow()
    })
  })

  describe('clearGraduated', () => {
    it('空 userId 不删除', () => {
      clearGraduated('')
      // 空 key 不应被删除（clearGraduated 内部有 if (!userId) return 守卫）
      expect(uni.getStorageSync(getGraduatedKey(''))).toBe(null)
    })

    it('删除对应 key', () => {
      clearGraduated(USER_ID)
      expect(mockRemoveStorageSync).toHaveBeenCalledWith(`demo_graduated_v1_${USER_ID}`)
    })

    it('removeStorageSync 抛异常时静默', () => {
      mockRemoveStorageSync.mockImplementation(() => { throw new Error('storage error') })
      expect(() => clearGraduated(USER_ID)).not.toThrow()
    })
  })
})
