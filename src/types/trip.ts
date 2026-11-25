export type TripStatus = 'planning' | 'ongoing' | 'completed'

export type TripPermission =
  | 'trip.read'
  | 'trip.content.edit'
  | 'trip.update'
  | 'trip.delete'
  | 'trip.invitation.create'
  | 'trip.members.manage'
  | 'trip.ownership.transfer'
  | 'trip.share.manage'

export interface TripAccess {
  role: 'owner' | 'editor' | 'viewer'
  permissions: TripPermission[]
}

/** 旅程目的地：城市/区域级，不含 POI、地址、经纬度（与后端 destination 一致） */
export interface TripDestination {
  name: string
  adcode?: string
  cityCode?: string
  provinceName?: string
  cityName?: string
  districtName?: string
}

export type TripDestinationRequest = TripDestination

export interface CoverPhoto {
  fileId: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  width?: number
  height?: number
}

export interface Trip {
  id: string
  title: string
  startDate: string
  endDate: string
  status: TripStatus
  totalDays: number
  destination?: TripDestination
  coverPhoto?: CoverPhoto
  baseCurrency?: string
  totalCny?: string
  nodeCount?: number
  journalCount?: number
  access?: TripAccess
  createdAt?: string
  updatedAt?: string
}

export interface CreateTripRequest {
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  coverFileId?: string
  baseCurrency?: string
  destination?: TripDestinationRequest
}

export interface UpdateTripRequest {
  title?: string
  startDate?: string
  endDate?: string
  coverFileId?: string
  baseCurrency?: string
  destination?: TripDestinationRequest
}

export interface TripListQuery {
  page?: number
  pageSize?: number
  status?: TripStatus
  keyword?: string
}

export interface TripListResponse {
  list: Trip[]
  total: number
  page: number
  pageSize: number
}

export type TripDetailResponse = Trip
