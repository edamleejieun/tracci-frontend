import type { PlaceInfo } from '@/types/location'
import type { JournalLocation } from '@/types/journal'

export function parsePlaceFromJournal(entry: { location?: JournalLocation }): PlaceInfo | null {
  if (!entry.location?.name?.trim()) return null
  return { ...entry.location }
}

export function buildJournalLocationSubmitPayload(
  place: PlaceInfo | null | undefined,
  options?: { clearOnEmpty?: boolean }
): { location?: JournalLocation | Record<string, never> } {
  const name = place?.name?.trim()
  if (!name) {
    if (options?.clearOnEmpty) {
      return { location: {} }
    }
    return {}
  }

  return {
    location: { ...place, name }
  }
}

export function getJournalLocationDisplayText(entry: { location?: JournalLocation }): string {
  if (!entry.location) return ''
  return entry.location.name?.trim() || entry.location.address?.trim() || ''
}
