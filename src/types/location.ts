/** city：旅程目的地（精确到市）；poi：行程节点等精确地点 */
export type PoiSearchPrecision = 'city' | 'poi'

/** 前端统一的地点选择结构（Trip 目的地、行程节点地点等） */
export interface PlaceInfo {
  poiId?: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  adcode?: string
  cityCode?: string
  provinceName?: string
  cityName?: string
  districtName?: string
}

export interface LocationPoiDTO {
  poiId: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  provinceName?: string
  cityName?: string
  districtName?: string
  adcode?: string
  cityCode?: string
  typeCode?: string
  typeName?: string
  source?: string
}

export interface LocationPoiSearchParams {
  keyword: string
  city?: string
  latitude?: number
  longitude?: number
  page?: number
  size?: number
}

export interface LocationPoiSearchResponse {
  items: LocationPoiDTO[]
  page: number
  size: number
  hasMore: boolean
  source: string
}
