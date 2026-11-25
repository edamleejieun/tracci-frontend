import { http } from '@/utils/http'
import type {
  TravelLogItem,
  CreateTravelLogRequest,
  UpdateTravelLogRequest,
  TravelLogListResponse
} from '@/types/journal'

export const JournalService = {
  /**
   * 获取旅行日志列表
   */
  getJournals(tripId: string) {
    return http<TravelLogListResponse>({
      url: `/trips/${tripId}/journal`,
      method: 'GET'
    })
  },

  /**
   * 创建旅行日志
   */
  createJournal(tripId: string, data: CreateTravelLogRequest) {
    return http<TravelLogItem>({
      url: `/trips/${tripId}/journal`,
      method: 'POST',
      data
    })
  },

  /**
   * 更新旅行日志
   */
  updateJournal(tripId: string, entryId: string, data: UpdateTravelLogRequest) {
    return http<TravelLogItem>({
      url: `/trips/${tripId}/journal/${entryId}`,
      method: 'PUT',
      data
    })
  },

  /**
   * 删除旅行日志
   */
  deleteJournal(tripId: string, entryId: string) {
    return http<void>({
      url: `/trips/${tripId}/journal/${entryId}`,
      method: 'DELETE'
    })
  }
}
