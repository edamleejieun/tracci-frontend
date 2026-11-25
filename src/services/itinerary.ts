import { http } from '@/utils/http'
import type {
  ItineraryResponse,
  CreateItineraryNodeRequest,
  UpdateItineraryNodeRequest,
  ReorderItineraryNodesRequest,
  ItineraryNode
} from '@/types/itinerary'

export const ItineraryService = {
  /**
   * 获取完整行程（按天分组）
   */
  getItinerary(tripId: string, options?: { noAuth?: boolean }) {
    return http<ItineraryResponse>({
      url: `/trips/${tripId}/itinerary`,
      method: 'GET',
      ...(options?.noAuth ? { custom: { noAuth: true } } : {})
    })
  },

  /**
   * 添加行程节点
   */
  addItineraryNode(tripId: string, dayId: string, data: CreateItineraryNodeRequest) {
    return http<ItineraryNode>({
      url: `/trips/${tripId}/days/${dayId}/nodes`,
      method: 'POST',
      data
    })
  },

  /**
   * 更新行程节点
   */
  updateItineraryNode(
    tripId: string,
    dayId: string,
    nodeId: string,
    data: UpdateItineraryNodeRequest
  ) {
    return http<ItineraryNode>({
      url: `/trips/${tripId}/days/${dayId}/nodes/${nodeId}`,
      method: 'PUT', // Docs say PUT
      data
    })
  },

  /**
   * 删除行程节点
   */
  deleteItineraryNode(tripId: string, dayId: string, nodeId: string) {
    return http<null>({
      url: `/trips/${tripId}/days/${dayId}/nodes/${nodeId}`,
      method: 'DELETE'
    })
  },

  /**
   * 节点排序
   */
  reorderItineraryNodes(tripId: string, dayId: string, data: ReorderItineraryNodesRequest) {
    return http<null>({
      url: `/trips/${tripId}/days/${dayId}/nodes/reorder`,
      method: 'PUT', // Docs say PUT
      data
    })
  }
}
