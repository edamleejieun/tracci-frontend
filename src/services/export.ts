import { http } from '@/utils/http'
import type {
  ExportAssetsQuery,
  TripExportAssetsResponse
} from '@/types/export'
import type { ItineraryExportAssetsResponse } from '@/types/itineraryExport'

export const ExportService = {
  /**
   * 获取导出页专用资产数据
   */
  getTripExportAssets(tripId: string, params?: ExportAssetsQuery) {
    return http<TripExportAssetsResponse>({
      url: `/trips/${tripId}/export-assets`,
      method: 'GET',
      data: params
    })
  },

  /**
   * 获取行程单导出资产数据
   */
  getItineraryExportAssets(tripId: string) {
    return http<ItineraryExportAssetsResponse>({
      url: `/trips/${tripId}/itinerary-export-assets`,
      method: 'GET'
    })
  }
}
