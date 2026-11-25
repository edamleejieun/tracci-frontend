import { describe, expect, it } from 'vitest'
import { getImageFullSizeUrlCandidates } from '@/utils/image'

describe('getImageFullSizeUrlCandidates', () => {
  it('prefers the original image and keeps ordered fallbacks', () => {
    expect(
      getImageFullSizeUrlCandidates({
        url: 'https://example.com/original.jpg',
        previewUrl: 'https://example.com/preview.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg'
      })
    ).toEqual([
      'https://example.com/original.jpg',
      'https://example.com/preview.jpg',
      'https://example.com/thumb.jpg'
    ])
  })

  it('removes duplicate fallback URLs', () => {
    expect(
      getImageFullSizeUrlCandidates({
        url: 'https://example.com/cover.jpg',
        previewUrl: 'https://example.com/cover.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg'
      })
    ).toEqual(['https://example.com/cover.jpg', 'https://example.com/thumb.jpg'])
  })
})
