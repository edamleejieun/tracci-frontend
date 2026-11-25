import type { Trip } from './trip'
import type { TripDay } from './itinerary'
import type { TravelLogItem } from './journal'
import type { ExpenseItem, ExpenseSummary, SettlementResponse } from './expense'
import type { TripMember, ActivityLog } from './collaboration'
import type { TripWeatherResponse } from './weather'

// ── Demo 专有类型（对齐 RESTful-API 契约 §二-A / iOS DemoJourneyModels） ──

/** 顶层能力声明：Demo 所有写操作均为 false */
export interface DemoCapabilities {
  readOnly: boolean
  canEditTrip: boolean
  canAddNode: boolean
  canEditJournal: boolean
  canManageExpense: boolean
  canManageMembers: boolean
  canInvite: boolean
  canDelete: boolean
  canShare: boolean
  canApplyAiChanges: boolean
  canExport: boolean
}

/** 分页包装（与生产响应一致） */
export interface PagedList<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 单个 Scene —— 业务块复用生产 DTO。
 * stageOverview / summary / stats / export* 为契约超集字段；
 * 小程序首期可不消费，但类型与解码需兼容以免运行时丢弃失败。
 */
export interface DemoJourneyScene {
  trip: Trip
  itinerary: { tripId: string; days: TripDay[] }
  journals: PagedList<TravelLogItem>
  expenses: PagedList<ExpenseItem>
  expenseSummary: ExpenseSummary
  expenseSettlement: SettlementResponse
  members: TripMember[]
  activityLogs: PagedList<ActivityLog>
  weather: TripWeatherResponse
  /** 契约字段；小程序按当前入口选读 */
  stageOverview?: unknown
  summary?: unknown
  stats?: DemoJourneyStats
  exportAssets?: unknown
  itineraryExportAssets?: unknown
}

/** Bundle 内 Stats 组合容器（内部仍是生产 Stats DTO） */
export interface DemoJourneyStats {
  overview?: unknown
  spendAnalysis?: unknown
  recordsAnalysis?: unknown
  footprintAnalysis?: unknown
}

export type DemoSceneKey = 'PLANNING' | 'ONGOING' | 'COMPLETED'

/**
 * Demo Journey Bundle —— GET /api/v1/demo/journey 的 data
 * enabled=false 时 scenes 可不返回（关闭态）。
 */
export interface DemoJourneyBundle {
  schemaVersion: number
  contentVersion: string
  enabled: boolean
  referenceDate: string
  defaultScene: DemoSceneKey | string
  capabilities: DemoCapabilities
  scenes?: {
    [K in Lowercase<DemoSceneKey>]: DemoJourneyScene
  }
}

/** 页面上下文：区分真实和示例旅程（禁止 tripId === 'demo' 进 Live） */
export type JourneyContext =
  | { mode: 'live'; tripId: string }
  | { mode: 'demo'; bundle: DemoJourneyBundle; scene: DemoSceneKey }

/** 是否可作为展示用 Bundle（对齐 iOS isDisplayable） */
export function isDemoBundleDisplayable(bundle: DemoJourneyBundle): boolean {
  if (!bundle.enabled) return false
  if (bundle.schemaVersion !== 1) return false
  if (!bundle.scenes?.planning || !bundle.scenes?.ongoing || !bundle.scenes?.completed) {
    return false
  }
  const ds = String(bundle.defaultScene || '').toUpperCase()
  if (!['PLANNING', 'ONGOING', 'COMPLETED'].includes(ds)) return false
  return deniesAllDemoMutations(bundle.capabilities)
}

const WRITE_FLAGS: Array<keyof DemoCapabilities> = [
  'canEditTrip',
  'canAddNode',
  'canEditJournal',
  'canManageExpense',
  'canManageMembers',
  'canInvite',
  'canDelete',
  'canShare',
  'canExport',
  'canApplyAiChanges'
]

export function deniesAllDemoMutations(cap: DemoCapabilities | undefined | null): boolean {
  if (!cap || typeof cap !== 'object') return false
  if (cap.readOnly !== true) return false
  return WRITE_FLAGS.every(k => cap[k] === false)
}
