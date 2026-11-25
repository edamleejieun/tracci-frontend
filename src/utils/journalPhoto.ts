import type { JournalPhotoItem } from '@/types/file'
import { getImageListDisplayUrl, getImagePreviewUrl } from '@/utils/image'

export function normalizeJournalPhoto(
  photo: JournalPhotoItem | null | undefined,
  index = 0
): JournalPhotoItem | null {
  const fileId = photo?.fileId?.trim()
  if (!fileId) return null

  const width = Number(photo.width)
  const height = Number(photo.height)

  return {
    fileId,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    previewUrl: photo.previewUrl,
    exportUrl: photo.exportUrl,
    watermarkedUrl: photo.watermarkedUrl,
    width: Number.isFinite(width) ? width : undefined,
    height: Number.isFinite(height) ? height : undefined,
    sortOrder: Number(photo.sortOrder ?? index + 1)
  }
}

export function normalizeJournalPhotos(
  photos: JournalPhotoItem[] | null | undefined
): JournalPhotoItem[] {
  if (!photos?.length) return []
  return photos
    .map((item, index) => normalizeJournalPhoto(item, index))
    .filter((p): p is JournalPhotoItem => p != null)
}

export function normalizeTravelLogPhotos<T extends { photos?: JournalPhotoItem[] }>(
  log: T
): T {
  if (!log.photos?.length) return log
  return {
    ...log,
    photos: normalizeJournalPhotos(log.photos)
  }
}

export function journalPhotoNeedsAccessUrl(photo: JournalPhotoItem): boolean {
  return Boolean(photo.fileId) && !getImageListDisplayUrl(photo)
}

export async function enrichJournalPhotoWithAccessUrl(
  photo: JournalPhotoItem,
  fetchAccessUrl: (fileId: string) => Promise<Partial<JournalPhotoItem>>
): Promise<JournalPhotoItem> {
  if (!journalPhotoNeedsAccessUrl(photo)) return photo
  try {
    const access = await fetchAccessUrl(photo.fileId)
    const merged = { ...photo, ...access, fileId: photo.fileId }
    if (getImageListDisplayUrl(merged) || getImagePreviewUrl(merged)) return merged
  } catch (e) {
    console.warn('[journalPhoto] getAccessUrl failed:', photo.fileId, e)
  }
  return photo
}
