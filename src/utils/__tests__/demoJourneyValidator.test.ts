import { describe, it, expect } from 'vitest'
import { validateDemoBundle } from '../demoJourneyValidator'
import type { DemoJourneyBundle } from '@/types/demoJourney'

/** 构建最小合法 Bundle（仅含校验器需要的字段） */
function buildValidBundle(overrides?: Partial<DemoJourneyBundle>): DemoJourneyBundle {
  const base: DemoJourneyBundle = {
    schemaVersion: 1,
    contentVersion: '2026-07-30-1',
    enabled: true,
    referenceDate: '2026-07-30',
    defaultScene: 'ONGOING',
    capabilities: {
      readOnly: true,
      canEditTrip: false,
      canAddNode: false,
      canEditJournal: false,
      canManageExpense: false,
      canManageMembers: false,
      canInvite: false,
      canDelete: false,
      canShare: false,
      canApplyAiChanges: false,
      canExport: false,
    },
    scenes: {
      planning: buildScene('planning'),
      ongoing: buildScene('ongoing'),
      completed: buildScene('completed'),
    },
  }
  return { ...base, ...overrides } as DemoJourneyBundle
}

function buildScene(status: string) {
  return {
    trip: {
      id: `trip-${status}`,
      title: `示例旅程 ${status}`,
      status,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      totalDays: 5,
      destination: { cityName: '上海', districtName: '黄浦区' },
      coverPhoto: 'https://example.com/cover.jpg',
      nodeCount: 3,
      journalCount: 2,
      totalCny: '1200.00',
    },
    itinerary: {
      tripId: `trip-${status}`,
      days: [
        { id: 'day-1', date: '2026-08-01', dayIndex: 1, nodes: [] },
      ],
    },
    journals: { list: [], total: 0, page: 1, pageSize: 10 },
    expenses: { list: [], total: 0, page: 1, pageSize: 10 },
    expenseSummary: { totalCny: '1200.00', currency: 'CNY' },
    expenseSettlement: { members: [], suggestedTransfers: [] },
    members: [
      { id: 'm1', userId: 'u1', nickname: '旅人', role: 'owner', avatarUrl: '' },
    ],
    activityLogs: { list: [], total: 0, page: 1, pageSize: 10 },
    weather: { available: true, locationName: '上海', items: [] },
  }
}

describe('validateDemoBundle', () => {
  it('通过最小合法 Bundle', () => {
    const result = validateDemoBundle(buildValidBundle())
    expect(result.schemaVersion).toBe(1)
    expect(result.enabled).toBe(true)
    expect(result.scenes?.ongoing.trip.title).toBe('示例旅程 ongoing')
  })

  it('enabled=false 时允许无 scenes（关闭态）', () => {
    const payload = buildValidBundle({ enabled: false })
    delete (payload as Record<string, unknown>).scenes
    const result = validateDemoBundle(payload)
    expect(result.enabled).toBe(false)
    expect(result.defaultScene).toBe('ONGOING')
  })

  it('拒绝开启态但写能力未关', () => {
    const payload = buildValidBundle()
    payload.capabilities = { ...payload.capabilities, canEditTrip: true }
    expect(() => validateDemoBundle(payload)).toThrow('capabilities 未满足全只读门禁')
  })

  it('拒绝无效 referenceDate', () => {
    expect(() =>
      validateDemoBundle(buildValidBundle({ referenceDate: '2026/07/30' } as DemoJourneyBundle))
    ).toThrow('referenceDate 无效')
  })

  it('拒绝非对象输入', () => {
    expect(() => validateDemoBundle(null)).toThrow('Bundle 不是对象')
    expect(() => validateDemoBundle('string')).toThrow('Bundle 不是对象')
    expect(() => validateDemoBundle(123)).toThrow('Bundle 不是对象')
  })

  it('拒绝缺失 schemaVersion', () => {
    const payload = buildValidBundle()
    delete (payload as Record<string, unknown>).schemaVersion
    expect(() => validateDemoBundle(payload)).toThrow('schemaVersion 缺失')
  })

  it('拒绝非 1 的 schemaVersion', () => {
    expect(() => validateDemoBundle(buildValidBundle({ schemaVersion: 2 } as DemoJourneyBundle))).toThrow('不支持的 schemaVersion: 2')
  })

  it('拒绝缺失 enabled', () => {
    const payload = buildValidBundle()
    delete (payload as Record<string, unknown>).enabled
    expect(() => validateDemoBundle(payload)).toThrow('enabled 缺失')
  })

  it('拒绝非布尔值 enabled', () => {
    expect(() => validateDemoBundle(buildValidBundle({ enabled: 'true' } as unknown as DemoJourneyBundle))).toThrow('enabled 缺失')
  })

  it('拒绝缺失 contentVersion', () => {
    const payload = buildValidBundle()
    delete (payload as Record<string, unknown>).contentVersion
    expect(() => validateDemoBundle(payload)).toThrow('contentVersion 缺失')
  })

  it('拒绝缺失 capabilities', () => {
    const payload = buildValidBundle()
    delete (payload as Record<string, unknown>).capabilities
    expect(() => validateDemoBundle(payload)).toThrow('capabilities 缺失')
  })

  it('拒绝开启态缺失 scenes', () => {
    const payload = buildValidBundle({ enabled: true })
    delete (payload as Record<string, unknown>).scenes
    expect(() => validateDemoBundle(payload)).toThrow('scenes 缺失')
  })

  it('拒绝缺失 planning scene', () => {
    const payload = buildValidBundle()
    const scenes = { ...(payload as Record<string, unknown>).scenes } as Record<string, unknown>
    delete scenes.planning
    ;(payload as Record<string, unknown>).scenes = scenes
    expect(() => validateDemoBundle(payload)).toThrow('Scene "planning" 缺失或格式错误')
  })

  it('拒绝缺失 ongoing scene', () => {
    const payload = buildValidBundle()
    const scenes = { ...(payload as Record<string, unknown>).scenes } as Record<string, unknown>
    delete scenes.ongoing
    ;(payload as Record<string, unknown>).scenes = scenes
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" 缺失或格式错误')
  })

  it('拒绝缺失 completed scene', () => {
    const payload = buildValidBundle()
    const scenes = { ...(payload as Record<string, unknown>).scenes } as Record<string, unknown>
    delete scenes.completed
    ;(payload as Record<string, unknown>).scenes = scenes
    expect(() => validateDemoBundle(payload)).toThrow('Scene "completed" 缺失或格式错误')
  })

  it('拒绝非对象 scene', () => {
    const payload = buildValidBundle()
    ;(payload as Record<string, unknown>).scenes = { ...(payload as Record<string, unknown>).scenes, ongoing: null }
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" 缺失或格式错误')
  })

  it('拒绝缺失 scene trip.id', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.trip = { title: 'x', status: 'ongoing' }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" trip 字段不完整')
  })

  it('拒绝缺失 scene trip.title', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.trip = { id: 'x', status: 'ongoing' }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" trip 字段不完整')
  })

  it('拒绝缺失 scene trip.status', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.trip = { id: 'x', title: 'x' }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" trip.status 缺失')
  })

  it('拒绝非数组 itinerary.days', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.itinerary = { tripId: 'x', days: 'not-array' }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" itinerary.days 不是数组')
  })

  it('拒绝缺失 journals.list', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.journals = { total: 0 }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" journals.list 不是数组')
  })

  it('拒绝缺失 expenses.list', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.expenses = { total: 0 }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" expenses.list 不是数组')
  })

  it('拒绝缺失 activityLogs.list', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.activityLogs = { total: 0 }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" activityLogs.list 不是数组')
  })

  it('拒绝非数组 members', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.members = 'not-array'
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" members 不是数组')
  })

  it('拒绝缺失 expenseSummary.totalCny', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.expenseSummary = { currency: 'CNY' }
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" expenseSummary 不完整')
  })

  it('拒绝缺失 weather', () => {
    const payload = buildValidBundle()
    const ongoing = (payload as Record<string, unknown>).scenes.ongoing as Record<string, unknown>
    ongoing.weather = null
    ;(payload as Record<string, unknown>).scenes.ongoing = ongoing
    expect(() => validateDemoBundle(payload)).toThrow('Scene "ongoing" weather 缺失')
  })

  it('拒绝无效 defaultScene', () => {
    expect(() => validateDemoBundle(buildValidBundle({ defaultScene: 'INVALID' } as unknown as DemoJourneyBundle))).toThrow('defaultScene 无效')
  })

  it('默认 scene key 大小写不敏感', () => {
    const payload = buildValidBundle({ defaultScene: 'ongoing' } as unknown as DemoJourneyBundle)
    // 不会抛异常（validator 会 toUpperCase）
    expect(() => validateDemoBundle(payload)).not.toThrow()
  })
})
