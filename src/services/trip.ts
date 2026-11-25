import { http } from '@/utils/http'
import type {
  TripListQuery,
  TripListResponse,
  TripDetailResponse,
  CreateTripRequest,
  UpdateTripRequest,
  Trip
} from '@/types/trip'
import type { TripSummaryResponse } from '@/types/summary'
import type { TripWeatherResponse, TripWeatherStatus } from '@/types/weather'
import type { RequestOptions } from '@/utils/http'

const weatherStatuses: TripWeatherStatus[] = [
  'AVAILABLE',
  'DATE_TOO_FAR',
  'PAST_TRIP_NOT_SUPPORTED',
  'LOCATION_MISSING',
  'PROVIDER_ERROR'
]

function normalizeTripWeatherResponse(response: TripWeatherResponse): TripWeatherResponse {
  const status = weatherStatuses.includes(response?.status)
    ? response.status
    : 'PROVIDER_ERROR'

  return {
    ...response,
    available: Boolean(response?.available && status === 'AVAILABLE'),
    status,
    items: Array.isArray(response?.items) ? response.items : []
  }
}

export const TripService = {
  /**
   * 获取旅行列表
   */
  getTripList(params?: TripListQuery) {
    return http<TripListResponse>({
      url: '/trips',
      method: 'GET',
      data: params
    })
  },

  /**
   * 获取旅行详情
   */
  getTripDetail(tripId: string, options?: { noAuth?: boolean }) {
    return http<TripDetailResponse>({
      url: `/trips/${tripId}`,
      method: 'GET',
      ...(options?.noAuth ? { custom: { noAuth: true } } : {})
    })
  },

  /**
   * 创建旅行
   */
  createTrip(data: CreateTripRequest, custom?: RequestOptions['custom']) {
    return http<Trip>({
      url: '/trips',
      method: 'POST',
      data,
      ...(custom ? { custom } : {})
    })
  },

  /**
   * 更新旅行
   */
  updateTrip(tripId: string, data: UpdateTripRequest, custom?: RequestOptions['custom']) {
    return http<Trip>({
      url: `/trips/${tripId}`,
      method: 'PUT',
      data,
      ...(custom ? { custom } : {})
    })
  },

  /**
   * 删除旅行
   */
  deleteTrip(tripId: string) {
    return http<null>({
      url: `/trips/${tripId}`,
      method: 'DELETE'
    })
  },

  /**
   * 获取旅程天气预报
   */
  getTripWeather(tripId: string) {
    return http<TripWeatherResponse>({
      url: `/trips/${tripId}/weather`,
      method: 'GET',
      custom: {
        noToast: true
      }
    }).then(normalizeTripWeatherResponse)
  },

  /**
   * 获取旅行总结
   */
  getTripSummary(tripId: string) {
    return http<TripSummaryResponse>({
      url: `/trips/${tripId}/summary`,
      method: 'GET'
    })
  }
}
