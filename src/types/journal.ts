import type { JournalPhotoItem } from './file'
import type { PlaceInfo } from './location'

/** 日志结构化地点（与行程节点 location 字段一致） */
export type JournalLocation = PlaceInfo

export interface TravelLogItem {
  id: string
  tripId: string
  content: string
  location?: JournalLocation
  occurredAt: string
  isHighlight: boolean
  mood?: string | null
  /** 可见性：'private' 仅自己可见；'public'/缺省 对协作成员公开（对齐 iOS JournalEntry.visibility） */
  visibility?: 'private' | 'public' | null
  /** 作者信息（多人协作下展示；对齐 iOS JournalEntry.authorId/authorName） */
  authorId?: string | null
  authorName?: string | null
  photos?: JournalPhotoItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateTravelLogRequest {
  content: string
  location?: JournalLocation
  occurredAt: string
  isHighlight?: boolean
  mood?: string | null
  fileIds?: string[]
  /** 私密：仅自己可见；省略即公开 */
  visibility?: 'private' | 'public' | null
}

export interface UpdateTravelLogRequest {
  content?: string
  location?: JournalLocation | Record<string, never>
  occurredAt?: string
  isHighlight?: boolean
  mood?: string | null
  fileIds?: string[]
  /** 私密：仅自己可见；省略即按后端默认（公开） */
  visibility?: 'private' | 'public' | null
}

export interface TravelLogListResponse {
  list: TravelLogItem[]
  total: number
  page: number
  pageSize: number
}
