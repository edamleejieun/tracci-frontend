import type { ExportFormatType, ExportTemplateType } from '@/types/export'
import {
  DEFAULT_EXPORT_TEMPLATE,
  EXPORT_TEMPLATE_OPTIONS,
  normalizeExportTemplateId
} from '@/constants/exportOptions'

export interface ExportThemeTokens {
  id: ExportTemplateType
  name: string
  description: string
  bg: string
  textPrimary: string
  textSecondary: string
  muted: string
  cardBg: string
  statBg: string
  pillBg: string
  trackBg: string
  watermark: string
  brand: string
  accent: string
  photoRadius: number
  photoBorder?: string
  previewSwatch: string
  filmBorder: boolean
  filmGrain: boolean
  stars: boolean
  gradientOverlay: boolean
}

export const EXPORT_TEMPLATES: ExportTemplateType[] = EXPORT_TEMPLATE_OPTIONS.map(item => item.id)

export const EXPORT_FORMATS: { id: ExportFormatType; label: string; desc: string }[] = [
  { id: 'square', label: '方图', desc: '1:1 · 朋友圈 / 小红书' },
  { id: 'portrait', label: '竖图', desc: '9:16 · 手机保存' }
]

export const EXPORT_CANVAS_SIZE: Record<
  ExportFormatType,
  { width: number; height: number }
> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 }
}

const THEMES: Record<ExportTemplateType, ExportThemeTokens> = {
  'travel-cover': {
    id: 'travel-cover',
    name: '旅行封面',
    description: '大图主体，适合作为首图',
    bg: '#F8F7F4',
    textPrimary: '#2F2A25',
    textSecondary: '#7A746B',
    muted: '#9B958C',
    cardBg: '#FFFFFF',
    statBg: '#F8F6F2',
    pillBg: '#EDE9E3',
    trackBg: '#E5E0DA',
    watermark: '#C4BEB5',
    brand: '#9B958C',
    accent: '#4F7DFF',
    photoRadius: 24,
    previewSwatch: '#F8F6F2',
    filmBorder: false,
    filmGrain: false,
    stars: false,
    gradientOverlay: false
  },
  'film-collage': {
    id: 'film-collage',
    name: '胶片拼贴',
    description: '多图拼贴，复古手工感',
    bg: '#FAF9F6',
    textPrimary: '#2F2A25',
    textSecondary: '#7A746B',
    muted: '#9B958C',
    cardBg: '#FFFFFF',
    statBg: '#F8F7F4',
    pillBg: '#EFECEA',
    trackBg: '#E5E2DC',
    watermark: '#B7B1AA',
    brand: '#7A746B',
    accent: '#A98F72',
    photoRadius: 12,
    photoBorder: '#FFFFFF',
    previewSwatch: '#FAF9F6',
    filmBorder: true,
    filmGrain: false,
    stars: false,
    gradientOverlay: false
  },
  'minimal-summary': {
    id: 'minimal-summary',
    name: '极简总结',
    description: '数据为主，留白高级',
    bg: '#F8F7F4',
    textPrimary: '#2F2A25',
    textSecondary: '#7A746B',
    muted: '#9B958C',
    cardBg: '#FFFFFF',
    statBg: '#F8F7F4',
    pillBg: '#EFECEA',
    trackBg: '#E5E2DC',
    watermark: '#C4BEB5',
    brand: '#9B958C',
    accent: '#4F7DFF',
    photoRadius: 20,
    previewSwatch: '#F8F7F4',
    filmBorder: false,
    filmGrain: false,
    stars: false,
    gradientOverlay: false
  }
}

export function getExportTheme(template: ExportTemplateType | string): ExportThemeTokens {
  return THEMES[normalizeExportTemplateId(template)] ?? THEMES[DEFAULT_EXPORT_TEMPLATE]
}

export function getTemplateMeta(template: ExportTemplateType | string) {
  return THEMES[normalizeExportTemplateId(template)] ?? THEMES[DEFAULT_EXPORT_TEMPLATE]
}
