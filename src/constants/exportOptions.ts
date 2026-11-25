import type {
  ExportContentOptions,
  ExportCopyStyle,
  ExportFormatType,
  ExportTemplateType
} from '@/types/export'

export const DEFAULT_EXPORT_TEMPLATE: ExportTemplateType = 'travel-cover'
export const DEFAULT_EXPORT_FORMAT: ExportFormatType = 'square'

export const DEFAULT_EXPORT_CONTENT_OPTIONS: ExportContentOptions = {
  showDate: true,
  showDays: true,
  showItineraryCount: true,
  showJournalCount: true,
  showExpense: false,
  showVisitedPlaces: true,
  showExpenseDistribution: false,
  showWatermark: true,
  copyStyle: 'mood'
}

export const EXPORT_TEMPLATE_OPTIONS: {
  id: ExportTemplateType
  name: string
  label: string
  description: string
  previewType: 'cover' | 'collage' | 'minimal'
}[] = [
  {
    id: 'travel-cover',
    name: 'Travel Cover',
    label: '旅行封面',
    description: '大图主体，适合朋友圈和小红书首图',
    previewType: 'cover'
  },
  {
    id: 'film-collage',
    name: 'Film Collage',
    label: '胶片拼贴',
    description: '多图拼贴，保留旅行手账感',
    previewType: 'collage'
  },
  {
    id: 'minimal-summary',
    name: 'Minimal Summary',
    label: '极简总结',
    description: '留白和数据为主，安静清爽',
    previewType: 'minimal'
  }
]

export const EXPORT_COPY_STYLE_OPTIONS: {
  id: ExportCopyStyle
  label: string
  description: string
  example: string
}[] = [
  {
    id: 'none',
    label: '不显示',
    description: '只保留主要信息',
    example: ''
  },
  {
    id: 'concise',
    label: '简洁总结',
    description: '例如“5 天旅程 · 走过 4 个地方”',
    example: '5 天旅程 · 走过 4 个地方'
  },
  {
    id: 'mood',
    label: '氛围短句',
    description: '例如“把这几天，慢慢留在路上”',
    example: '把这几天，慢慢留在路上'
  }
]

export const EXPORT_CONTENT_OPTION_GROUPS: {
  title: string
  items: {
    key: keyof Omit<ExportContentOptions, 'copyStyle'>
    label: string
    description: string
    icon: string
    requires?: 'expense' | 'places'
  }[]
}[] = [
  {
    title: '基础信息',
    items: [
      { key: 'showDate', label: '日期', description: '旅行起止日期', icon: 'i-carbon-calendar' },
      { key: 'showDays', label: '天数', description: '旅程总天数', icon: 'i-carbon-time' },
      {
        key: 'showVisitedPlaces',
        label: '去过的景点',
        description: '展示景点标签',
        icon: 'i-carbon-location',
        requires: 'places'
      }
    ]
  },
  {
    title: '旅行记录',
    items: [
      {
        key: 'showItineraryCount',
        label: '行程数',
        description: '行程节点数量',
        icon: 'i-carbon-map'
      },
      {
        key: 'showJournalCount',
        label: '日志数',
        description: '旅行日志数量',
        icon: 'i-carbon-notebook'
      }
    ]
  },
  {
    title: '费用信息',
    items: [
      {
        key: 'showExpense',
        label: '花费',
        description: '展示总花费',
        icon: 'i-carbon-wallet',
        requires: 'expense'
      },
      {
        key: 'showExpenseDistribution',
        label: '开支分布',
        description: '展示费用分类条',
        icon: 'i-carbon-chart-stacked',
        requires: 'expense'
      }
    ]
  }
]

export function normalizeExportTemplateId(
  value?: string | null
): ExportTemplateType {
  if (!value) return DEFAULT_EXPORT_TEMPLATE
  if (value === 'travel-cover' || value === 'film-collage' || value === 'minimal-summary') {
    return value
  }
  return DEFAULT_EXPORT_TEMPLATE
}

export function normalizeExportContentOptions(
  value?: Partial<ExportContentOptions> | null
): ExportContentOptions {
  const merged = {
    ...DEFAULT_EXPORT_CONTENT_OPTIONS,
    ...(value || {})
  }

  // 当前阶段不开放水印关闭
  merged.showWatermark = true

  if (!merged.showExpense) {
    merged.showExpenseDistribution = false
  }

  if (!EXPORT_COPY_STYLE_OPTIONS.some(item => item.id === merged.copyStyle)) {
    merged.copyStyle = DEFAULT_EXPORT_CONTENT_OPTIONS.copyStyle
  }

  return merged
}
