export type TripWeatherStatus =
  | 'AVAILABLE'
  | 'DATE_TOO_FAR'
  | 'PAST_TRIP_NOT_SUPPORTED'
  | 'LOCATION_MISSING'
  | 'PROVIDER_ERROR'

export type TripWeatherIcon =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'light_rain'
  | 'moderate_rain'
  | 'heavy_rain'
  | 'snow'
  | 'fog'
  | 'unknown'

export interface TripWeatherDailyItem {
  /** 正常为 yyyy-MM-dd；个别序列化可能给出 [y,m,d] */
  date: string | number[]
  /** 可能为「周一」或后端英文枚举 MONDAY */
  weekday?: string
  weather?: string
  tempMin?: number
  tempMax?: number
  wind?: string
  icon?: TripWeatherIcon
  pop?: number | null
  tip?: string
}

export interface TripWeatherResponse {
  available: boolean
  status: TripWeatherStatus
  source?: string
  forecastType?: string
  updatedAt?: string
  forecastLimitDays?: number
  message?: string | null
  locationName?: string
  items: TripWeatherDailyItem[]
}
