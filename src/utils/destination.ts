import type { LocationPoiDTO, PlaceInfo } from '@/types/location'
import type { TripDestination } from '@/types/trip'

export function poiToPlace(poi: LocationPoiDTO): PlaceInfo {
  return {
    poiId: poi.poiId,
    name: poi.name,
    address: poi.address,
    latitude: poi.latitude,
    longitude: poi.longitude,
    adcode: poi.adcode,
    cityCode: poi.cityCode,
    provinceName: poi.provinceName,
    cityName: poi.cityName,
    districtName: poi.districtName
  }
}

/** 将 POI 选择收敛为城市级目的地（不含区县，避免选市时带上某个区） */
export function placeToTripDestination(place: PlaceInfo | TripDestination): TripDestination {
  const cityName = place.cityName?.trim()
  const provinceName = place.provinceName?.trim()
  const name = cityName || provinceName || place.name.trim()

  const result: TripDestination = { name }
  if (provinceName) result.provinceName = provinceName
  if (cityName) result.cityName = cityName
  if (place.adcode) result.adcode = place.adcode
  if (place.cityCode) result.cityCode = place.cityCode
  return result
}

export function getCityKeyFromPlace(place: PlaceInfo | TripDestination): string {
  const parts = [place.provinceName, place.cityName].filter(Boolean)
  return parts.length > 0 ? parts.join('|') : place.name
}

export function getCityKeyFromPoi(poi: LocationPoiDTO): string {
  const parts = [poi.provinceName, poi.cityName].filter(Boolean)
  return parts.length > 0 ? parts.join('|') : poi.name
}

export function getCityDisplayLabelFromPoi(poi: LocationPoiDTO): string {
  const cityName = poi.cityName?.trim()
  const provinceName = poi.provinceName?.trim()
  if (provinceName && cityName && provinceName !== cityName) {
    return `${provinceName} ${cityName}`
  }
  return cityName || provinceName || poi.name
}

/** 同一城市多条 POI 时，优先保留城市级条目而非某个区县 */
function cityPoiRepresentativeScore(poi: LocationPoiDTO): number {
  const cityName = poi.cityName?.trim()
  const districtName = poi.districtName?.trim()
  const name = poi.name?.trim() || ''
  if (!districtName) return 0
  if (cityName && (name === cityName || name === cityName.replace(/市$/, ''))) return 1
  if (cityName && name.includes(cityName)) return 2
  return 10
}

export function dedupePoiResultsByCity(items: LocationPoiDTO[]): LocationPoiDTO[] {
  const bestByCity = new Map<string, LocationPoiDTO>()
  for (const item of items) {
    const key = getCityKeyFromPoi(item)
    const existing = bestByCity.get(key)
    if (!existing || cityPoiRepresentativeScore(item) < cityPoiRepresentativeScore(existing)) {
      bestByCity.set(key, item)
    }
  }
  return [...bestByCity.values()]
}

export function formatDestinationRegion(dest: PlaceInfo | TripDestination): string {
  const parts = [dest.cityName, dest.districtName].filter(Boolean)
  return parts.join(' · ')
}

function formatGeoDestinationLabel(dest: TripDestination): string {
  if (dest.provinceName && dest.cityName && dest.provinceName !== dest.cityName) {
    return `${dest.provinceName} ${dest.cityName}`
  }
  if (dest.cityName) return dest.cityName
  return dest.name.trim()
}

export function getTripDestinationDisplayName(trip: {
  destination?: TripDestination
}): string {
  if (!trip.destination) return ''
  return formatGeoDestinationLabel(placeToTripDestination(trip.destination))
}

export function parseDestinationFromTrip(trip: {
  destination?: TripDestination
}): TripDestination | null {
  if (!trip.destination?.name?.trim()) return null
  return placeToTripDestination(trip.destination)
}

export function getTripPoiSearchCity(trip: { destination?: TripDestination }): string | undefined {
  const dest = parseDestinationFromTrip(trip)
  if (!dest) return undefined
  return dest.cityName || dest.provinceName || dest.name
}

export function buildDestinationSubmitPayload(
  dest: TripDestination | null | undefined
): { destination?: TripDestination } {
  if (!dest?.name?.trim()) return {}
  return { destination: placeToTripDestination(dest) }
}

/** 去掉常见行政区划后缀，便于城市名模糊匹配 */
function normalizeGeoName(name?: string): string {
  return (name ?? '')
    .trim()
    .replace(/(特别行政区|自治区|自治州|地区|盟|市|省|区|县)$/u, '')
}

function geoNamesMatch(a?: string, b?: string): boolean {
  const left = normalizeGeoName(a)
  const right = normalizeGeoName(b)
  if (!left || !right) return false
  return left === right || left.includes(right) || right.includes(left)
}

/** POI 是否落在旅程目的地范围内（客户端二次过滤，弥补后端 city 参数未严格收窄的情况） */
export function isPoiInTripDestinationScope(
  poi: LocationPoiDTO,
  destination?: TripDestination | string | null
): boolean {
  if (!destination) return true

  if (typeof destination === 'string') {
    const scope = destination.trim()
    if (!scope) return true
    return [poi.cityName, poi.provinceName, poi.districtName, poi.name].some(label =>
      geoNamesMatch(label, scope)
    )
  }

  const dest = placeToTripDestination(destination)
  const scopeLabels = [dest.cityName, dest.provinceName, dest.name].filter(Boolean)
  if (scopeLabels.length === 0) return true

  const poiLabels = [poi.cityName, poi.provinceName, poi.districtName]
  if (scopeLabels.some(scope => poiLabels.some(label => geoNamesMatch(label, scope)))) {
    return true
  }

  if (dest.adcode && poi.adcode) {
    const destPrefix = dest.adcode.slice(0, 4)
    const poiPrefix = poi.adcode.slice(0, 4)
    if (destPrefix.length >= 4 && poiPrefix.length >= 4 && destPrefix === poiPrefix) {
      return true
    }
  }

  return false
}

export function filterPoiResultsByTripDestination(
  items: LocationPoiDTO[],
  destination?: TripDestination | string | null
): LocationPoiDTO[] {
  if (!destination) return items
  return items.filter(item => isPoiInTripDestinationScope(item, destination))
}
