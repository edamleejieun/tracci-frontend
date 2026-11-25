/**
 * Demo Bundle 运行时校验。
 * TypeScript 类型只在编译期提示；入口必须运行时断言，对齐契约 §二-A 与 iOS 解码门禁。
 *
 * 无 zod 依赖，手写轻量校验，控制小程序包体。
 */

import type { DemoJourneyBundle } from '@/types/demoJourney'
import { deniesAllDemoMutations } from '@/types/demoJourney'

export class DemoValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DemoValidationError'
  }
}

/**
 * 校验原始 JSON 是否为合法的 DemoJourneyBundle。
 * - enabled=false：允许无 scenes（关闭态）
 * - enabled=true：必须含三 Scene，且 capabilities 全只读
 */
export function validateDemoBundle(raw: unknown): DemoJourneyBundle {
  if (!raw || typeof raw !== 'object') {
    throw new DemoValidationError('Bundle 不是对象')
  }
  const obj = raw as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number') {
    throw new DemoValidationError('schemaVersion 缺失')
  }
  if (obj.schemaVersion !== 1) {
    throw new DemoValidationError(`不支持的 schemaVersion: ${obj.schemaVersion}`)
  }

  if (typeof obj.enabled !== 'boolean') {
    throw new DemoValidationError('enabled 缺失')
  }

  if (typeof obj.contentVersion !== 'string' || !obj.contentVersion) {
    throw new DemoValidationError('contentVersion 缺失')
  }

  if (typeof obj.referenceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.referenceDate)) {
    throw new DemoValidationError('referenceDate 无效')
  }

  if (!obj.capabilities || typeof obj.capabilities !== 'object') {
    throw new DemoValidationError('capabilities 缺失')
  }
  const caps = obj.capabilities as Record<string, unknown>
  if (typeof caps.readOnly !== 'boolean') {
    throw new DemoValidationError('capabilities.readOnly 缺失')
  }

  const ds = String(obj.defaultScene || '').toUpperCase()
  if (!['PLANNING', 'ONGOING', 'COMPLETED'].includes(ds)) {
    throw new DemoValidationError('defaultScene 无效')
  }

  // 关闭态：不要求 scenes，直接返回（首页静默回退）
  if (obj.enabled === false) {
    return {
      ...(raw as object),
      defaultScene: ds
    } as DemoJourneyBundle
  }

  // 开启态：三 Scene 齐全
  if (!obj.scenes || typeof obj.scenes !== 'object') {
    throw new DemoValidationError('scenes 缺失')
  }
  const scenes = obj.scenes as Record<string, unknown>
  for (const key of ['planning', 'ongoing', 'completed']) {
    if (!scenes[key] || typeof scenes[key] !== 'object') {
      throw new DemoValidationError(`Scene "${key}" 缺失或格式错误`)
    }
    validateScene(scenes[key] as Record<string, unknown>, key)
  }

  // 展示门禁：capabilities 必须全只读（对齐 iOS deniesAllMutations）
  if (!deniesAllDemoMutations(obj.capabilities as DemoJourneyBundle['capabilities'])) {
    throw new DemoValidationError('capabilities 未满足全只读门禁')
  }

  return {
    ...(raw as object),
    defaultScene: ds
  } as DemoJourneyBundle
}

function validateScene(scene: Record<string, unknown>, key: string) {
  const trip = scene.trip as Record<string, unknown> | undefined
  if (!trip || typeof trip.id !== 'string' || typeof trip.title !== 'string') {
    throw new DemoValidationError(`Scene "${key}" trip 字段不完整`)
  }
  if (typeof trip.status !== 'string') {
    throw new DemoValidationError(`Scene "${key}" trip.status 缺失`)
  }

  const itin = scene.itinerary as Record<string, unknown> | undefined
  if (!itin || !Array.isArray(itin.days)) {
    throw new DemoValidationError(`Scene "${key}" itinerary.days 不是数组`)
  }

  for (const field of ['journals', 'expenses', 'activityLogs']) {
    const block = scene[field] as Record<string, unknown> | undefined
    if (!block || !Array.isArray(block.list)) {
      throw new DemoValidationError(`Scene "${key}" ${field}.list 不是数组`)
    }
  }

  if (!Array.isArray(scene.members)) {
    throw new DemoValidationError(`Scene "${key}" members 不是数组`)
  }

  const summary = scene.expenseSummary as Record<string, unknown> | undefined
  if (!summary || typeof summary.totalCny !== 'string') {
    throw new DemoValidationError(`Scene "${key}" expenseSummary 不完整`)
  }

  // settlement 开启态应存在（契约 Scene 表）；允许空结构但必须是对象
  if (scene.expenseSettlement != null && typeof scene.expenseSettlement !== 'object') {
    throw new DemoValidationError(`Scene "${key}" expenseSettlement 格式错误`)
  }

  const weather = scene.weather as Record<string, unknown> | undefined
  if (!weather || typeof weather !== 'object') {
    throw new DemoValidationError(`Scene "${key}" weather 缺失`)
  }
}
