import { http } from '@/utils/http'
import type { LocationPoiSearchParams, LocationPoiSearchResponse } from '@/types/location'

export const LocationService = {
  /**
   * POI 关键字搜索
   */
  searchPoi(params: LocationPoiSearchParams) {
    return http<LocationPoiSearchResponse>({
      url: '/locations/poi/search',
      method: 'GET',
      data: {
        keyword: params.keyword,
        city: params.city,
        latitude: params.latitude,
        longitude: params.longitude,
        page: params.page ?? 1,
        size: params.size ?? 10
      }
    })
  }
}
