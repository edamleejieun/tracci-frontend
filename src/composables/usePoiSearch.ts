import { ref, watch, onUnmounted, unref, type MaybeRef } from 'vue'
import { LocationService } from '@/services/location'
import type { LocationPoiDTO } from '@/types/location'

export type PoiSearchStatus = 'idle' | 'too-short' | 'loading' | 'success' | 'empty' | 'error'

const MIN_KEYWORD_LENGTH = 2
const DEBOUNCE_MS = 400
const PAGE_SIZE = 10

export function usePoiSearch(options?: {
  city?: MaybeRef<string | undefined>
  debounceMs?: number
}) {
  const keyword = ref('')
  const items = ref<LocationPoiDTO[]>([])
  const status = ref<PoiSearchStatus>('idle')
  const hasMore = ref(false)
  const page = ref(1)
  const loadingMore = ref(false)
  const activeKeyword = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestSeq = 0

  const clearDebounce = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  const resetResults = () => {
    items.value = []
    hasMore.value = false
    page.value = 1
    loadingMore.value = false
  }

  const runSearch = async (trimmed: string, append = false) => {
    const seq = ++requestSeq
    const nextPage = append ? page.value + 1 : 1

    if (!append) {
      status.value = 'loading'
      resetResults()
      activeKeyword.value = trimmed
    } else {
      loadingMore.value = true
    }

    try {
      const res = await LocationService.searchPoi({
        keyword: trimmed,
        city: unref(options?.city),
        page: nextPage,
        size: PAGE_SIZE
      })
      if (seq !== requestSeq) return

      const newItems = res.items ?? []
      if (append) {
        items.value = [...items.value, ...newItems]
      } else {
        items.value = newItems
      }
      hasMore.value = res.hasMore ?? false
      page.value = res.page ?? nextPage
      status.value = items.value.length > 0 ? 'success' : 'empty'
    } catch {
      if (seq !== requestSeq) return
      if (!append) {
        resetResults()
        status.value = 'error'
      }
    } finally {
      if (seq === requestSeq) {
        loadingMore.value = false
      }
    }
  }

  const scheduleSearch = (raw: string) => {
    clearDebounce()
    const trimmed = raw.trim()

    if (!trimmed) {
      requestSeq++
      activeKeyword.value = ''
      resetResults()
      status.value = 'idle'
      return
    }

    if (trimmed.length < MIN_KEYWORD_LENGTH) {
      requestSeq++
      activeKeyword.value = ''
      resetResults()
      status.value = 'too-short'
      return
    }

    debounceTimer = setTimeout(() => {
      runSearch(trimmed, false)
    }, options?.debounceMs ?? DEBOUNCE_MS)
  }

  const loadMore = async () => {
    const trimmed = activeKeyword.value.trim()
    if (!trimmed || !hasMore.value || loadingMore.value || status.value !== 'success') {
      return
    }
    await runSearch(trimmed, true)
  }

  watch(keyword, value => {
    scheduleSearch(value)
  })

  const clearKeyword = () => {
    keyword.value = ''
    requestSeq++
    activeKeyword.value = ''
    resetResults()
    status.value = 'idle'
  }

  onUnmounted(() => {
    clearDebounce()
    requestSeq++
  })

  return {
    keyword,
    items,
    status,
    hasMore,
    page,
    loadingMore,
    minKeywordLength: MIN_KEYWORD_LENGTH,
    clearKeyword,
    loadMore
  }
}
