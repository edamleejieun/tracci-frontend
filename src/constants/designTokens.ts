/**
 * 设计 Token
 * 暖调呼吸感分层体系：通过色温差分层替代边框，暖棕阴影替代冷黑阴影。
 * 开支分类色以产品文档莫兰迪色为准。
 */

export const DESIGN_COLORS = {
  brand: '#4F7DFF',
  brandLight: '#7B9FFF',
  brandShadow: 'rgba(79, 125, 255, 0.3)',
  brandBg: 'rgba(79, 125, 255, 0.1)',
  background: '#FFFFFF',
  /** 区域底色——暖米色，让白卡片浮起 */
  warmBg: '#FBFAF6',
  /** 卡片内部微底色——比卡片白略暖，用于卡片内的信息区域 */
  warmSurface: '#FAF8F5',
  /** Sheet / 面板背景——暖白，略暖于纯白 */
  warmSheet: '#FBFAF8',
  card: '#FFFBF4',
  cardAlt: '#F2F2F7',
  subtle: '#F2F2F7',
  hover: '#FAF8F5',
  warmAccent: '#F5F0EB',
  /** 暖色分割线 */
  warmDivider: '#EDE8E2',
  /** 暖色边框（最小化使用） */
  warmBorder: '#E8E4DE',
  textPrimary: '#2F2A25',
  textBody: '#5C5650',
  textSecondary: '#7A746B',
  /** 装饰/禁用级弱文案（对比约 2.97:1，勿作正文） */
  textMuted: '#9B958C',
  /** 次要但需可读的正文（白底约 5.7:1，达 WCAG AA） */
  textMutedStrong: '#6E655C',
  textDisabled: '#C4BEB5',
  textInverse: '#FFFFFF',
  border: '#DCDCE0',
  borderSubtle: '#F2F2F7',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#22C55E',
  successBg: '#E8F5E9',
  warning: '#F59E0B',
  featured: '#FFB800',
} as const

/** 装饰点缀色 —— 莫兰迪暖色系，用于标签、色块、图标点缀 */
export const ACCENT_COLORS = {
  warmApricot: '#F5E6D3',
  mistBlue: '#D6E5ED',
  mossGreen: '#D8E5D0',
  warmPink: '#F0DDD8',
  warmGold: '#F2E8D5',
} as const

/** 开支分类（莫兰迪色，与 stats / 导出一致） */
export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  food: '#E8B87D',
  transport: '#7DB8E8',
  hotel: '#B8A4D9',
  lodging: '#B8A4D9',
  attraction: '#8FD9B6',
  shopping: '#E8D97D',
  other: '#B7B1AA'
}

/** 行程节点类型标签配色 */
export const NODE_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  transport: { bg: '#E3F2FD', text: '#1976D2', label: '交通' },
  lodging: { bg: '#F3E5F5', text: '#7B1FA2', label: '住宿' },
  hotel: { bg: '#F3E5F5', text: '#7B1FA2', label: '住宿' },
  food: { bg: '#FFF3E0', text: '#E65100', label: '餐饮' },
  restaurant: { bg: '#FFF3E0', text: '#E65100', label: '餐饮' },
  attraction: { bg: '#E8F5E9', text: '#2E7D32', label: '景点' },
  shopping: { bg: '#FCE4EC', text: '#C2185B', label: '购物' },
  other: { bg: '#F5F5F5', text: '#616161', label: '其他' }
}

/** 旅程状态 badge 配色（消除 UnoCSS opacity 修饰符在部分 target 的兼容风险） */
export const TRIP_STATUS_BADGE_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  ongoing: { bg: '#4F7DFF', text: '#FFFFFF' },
  planning: { bg: '#FEF3C7', text: '#B45309' },
  completed: { bg: '#FAF8F5', text: '#6E655C' },
} as const
export const MOOD_COLORS: Record<string, string> = {
  happy: '#FFD93D',
  relaxed: '#6BCB77',
  excited: '#FF6B6B',
  peaceful: '#4D96FF',
  thoughtful: '#9B59B6'
}

export const MOOD_LABELS: Record<string, string> = {
  happy: '开心',
  relaxed: '放松',
  excited: '兴奋',
  peaceful: '平静',
  thoughtful: '沉思'
}

/** 暖棕阴影基准色 */
const WARM_SHADOW = '139, 115, 85'

/** 阴影（内联 style 或 Canvas 使用）—— 暖棕基调，模拟午后自然光 */
export const DESIGN_SHADOWS = {
  /** 微小阴影，用于标签、小型微浮起 */
  soft: `0 2px 12px -2px rgba(${WARM_SHADOW}, 0.10)`,
  /** 卡片标准阴影 */
  card: `0 6px 20px -4px rgba(${WARM_SHADOW}, 0.12), 0 2px 8px -2px rgba(${WARM_SHADOW}, 0.08)`,
  /** 中等阴影 */
  md: `0 4px 20px -4px rgba(${WARM_SHADOW}, 0.12)`,
  /** 大阴影，弹层/浮动卡片 */
  lg: `0 12px 32px -6px rgba(${WARM_SHADOW}, 0.16), 0 4px 12px -2px rgba(${WARM_SHADOW}, 0.10)`,
  /** 导出用大阴影 */
  export: `0 20px 40px -8px rgba(${WARM_SHADOW}, 0.14), 0 8px 16px -4px rgba(${WARM_SHADOW}, 0.10)`,
  /** 毛玻璃面板阴影 */
  glass: `0 8px 32px -4px rgba(${WARM_SHADOW}, 0.1), 0 4px 12px -2px rgba(${WARM_SHADOW}, 0.05)`,
  /** 输入框微阴影 —— 让输入区域在白底上轻微浮起 */
  input: `0 1px 4px rgba(${WARM_SHADOW}, 0.08)`,
  /** 输入框聚焦光晕 */
  inputFocus: `0 0 0 2px rgba(79, 125, 255, 0.12)`,
} as const

/** UnoCSS 圆角 class 名 */
export const DESIGN_RADIUS = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-[20px]',
  xl: 'rounded-[24px]',
  xxl: 'rounded-[28px]',
  full: 'rounded-full'
} as const

/** 导出模板展示元数据（id 与 exportTheme.ts / API 一致） */
export const EXPORT_TEMPLATE_META = {
  'travel-cover': {
    v0Id: 'travel-cover',
    label: '旅行封面',
    name: 'Travel Cover'
  },
  'film-collage': {
    v0Id: 'film-collage',
    label: '胶片拼贴',
    name: 'Film Collage'
  },
  'minimal-summary': {
    v0Id: 'minimal-summary',
    label: '极简总结',
    name: 'Minimal Summary'
  }
} as const

export type ExportTemplateKey = keyof typeof EXPORT_TEMPLATE_META

/** 组合 typography UnoCSS class */
export const TYPOGRAPHY = {
  pageTitle: 'text-xl font-semibold text-primary tracking-tight',
  pageSubtitle: 'text-[13px] text-muted',
  sectionTitle: 'text-lg font-semibold text-primary tracking-tight',
  sectionSubtitle: 'text-[13px] text-muted',
  cardTitle: 'text-[15px] font-semibold text-primary',
  cardBody: 'text-sm text-[#5C5650] leading-relaxed',
  label: 'text-[13px] font-medium text-secondary',
  caption: 'text-[11px] text-muted',
  bigNumber: 'text-[42px] font-semibold text-primary tracking-tight leading-none'
} as const

export function getNodeTypeStyle(type?: string) {
  if (!type) return NODE_TYPE_STYLES.other
  const normalized = type.toLowerCase()
  return NODE_TYPE_STYLES[normalized] ?? NODE_TYPE_STYLES.other
}

export function getExpenseCategoryColor(category?: string): string {
  if (!category) return EXPENSE_CATEGORY_COLORS.other
  return EXPENSE_CATEGORY_COLORS[category] ?? EXPENSE_CATEGORY_COLORS.other
}

export function getMoodColor(mood?: string): string {
  if (!mood) return DESIGN_COLORS.subtle
  return MOOD_COLORS[mood] ?? DESIGN_COLORS.subtle
}

export function getMoodLabel(mood?: string): string {
  if (!mood) return ''
  return MOOD_LABELS[mood] ?? ''
}
