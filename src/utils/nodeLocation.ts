import type { PlaceInfo } from '@/types/location'
import type { NodeLocation } from '@/types/itinerary'

interface NodeDisplayFields {
  title?: string
  address?: string
  location?: NodeLocation
}

export function parsePlaceFromNode(node: { location?: NodeLocation }): PlaceInfo | null {
  if (!node.location?.name?.trim()) return null
  return { ...node.location }
}

export function buildNodeLocationSubmitPayload(
  place: PlaceInfo | null | undefined,
  options?: { clearOnEmpty?: boolean }
): { location?: NodeLocation | Record<string, never>; address?: string } {
  const name = place?.name?.trim()
  if (!name) {
    if (options?.clearOnEmpty) {
      return { location: {} }
    }
    return {}
  }

  const location: NodeLocation = { ...place, name }
  const address = location.address?.trim().slice(0, 200)

  return {
    location,
    ...(address ? { address } : {})
  }
}

/** 详情、操作文案统一优先展示结构化地点名，旧节点再降级到自定义标题。 */
export function getNodeDisplayName(node: NodeDisplayFields): string {
  return node.location?.name?.trim() || node.title?.trim() || '未命名地点'
}

/** 主标题已承载地点名，这里只展示地址，避免地点名称重复出现。 */
export function getNodeLocationDisplayText(node: NodeDisplayFields): string {
  return node.location?.address?.trim() || node.address?.trim() || ''
}
