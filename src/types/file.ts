export type FileBusinessType =
  | 'JOURNAL_PHOTO'
  | 'TRIP_COVER'
  | 'AVATAR'
  | 'FEEDBACK_ATTACHMENT'

export interface UploadCredentialRequest {
  businessType: FileBusinessType
  businessId?: string
  fileName: string
  contentType: string
  size: number
  uploadMethod?: 'PUT' | 'POST'
}

export interface UploadCredentialResponse {
  fileId: string
  objectKey: string
  uploadUrl: string
  method: string
  headers?: Record<string, string>
  formData?: Record<string, string>
  fileFieldName?: string
  expiresAt: string
}

export interface ConfirmUploadRequest {
  etag?: string
  width?: number
  height?: number
}

export type FileUploadStatus = 'waiting' | 'uploading' | 'uploaded' | 'failed'

export interface FileItem {
  id: string
  objectKey: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  contentType: string
  size: number
  width?: number
  height?: number
  status: string
}

export interface AccessUrlResponse {
  fileId: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  expiresAt?: string
}

export interface JournalPhotoItem {
  fileId: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  width?: number
  height?: number
  sortOrder: number
}

export interface LocalUploadFile {
  id: string // 临时 ID，用于前端列表渲染和状态追踪
  fileId?: string // 后端返回的 fileId
  localPath: string // 本地临时路径
  fileName: string
  contentType: string
  size: number
  width?: number
  height?: number
  status: FileUploadStatus
  progress: number
  error?: string
  uploadUrl?: string
  url?: string
  thumbnailUrl?: string
  previewUrl?: string
  exportUrl?: string
  watermarkedUrl?: string
  method?: string
  headers?: Record<string, string>
  formData?: Record<string, string>
  fileFieldName?: string
  businessType?: FileBusinessType
  businessId?: string
}
