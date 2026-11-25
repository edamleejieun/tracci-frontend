import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { presetUni } from '@uni-helper/unocss-preset-uni'
import carbonIcons from '@iconify-json/carbon/icons.json'

/** 小程序 WXSS 对 CSS 转义与选择器较敏感；presetUni + unocss-applet 会生成各端可编译的样式 */
export default defineConfig({
  envMode: 'build',
  safelist: [
    'i-carbon-chart-stacked',
  ],
  presets: [
    presetUni(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: carbonIcons,
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  theme: {
    colors: {
      primary: '#2F2A25',
      secondary: '#7A746B',
      muted: '#9B958C',
      /** 次要可读正文（白底约 5.7:1，WCAG AA） */
      'muted-strong': '#6E655C',
      disabled: '#C4BEB5',
      background: '#FFFFFF',
      card: '#FFFFFF',
      /** 区域底色——暖米色，让白卡片浮起 */
      'warm-bg': '#FBFAF6',
      /** 卡片内部微底色——比卡片白略暖 */
      'warm-surface': '#FAF8F5',
      /** Sheet 背景——暖白 */
      'warm-sheet': '#FBFAF8',
      /** 暖色分割线 */
      'warm-divider': '#EDE8E2',
      /** 暖色边框（最小化使用） */
      'warm-border': '#E8E4DE',
      subtle: '#F7F4EF',
      accent: '#4F7DFF',
      brand: '#4F7DFF',
      danger: '#EF4444',
      'danger-bg': '#FEF2F2',
      border: '#DCDCE0',
      featured: '#FFB800',
      success: '#22C55E',
    },
    borderRadius: {
      xl: '12px',
      '2xl': '16px',
      '3xl': '24px',
    },
    boxShadow: {
      /** 暖棕阴影体系 */
      soft: '0 2px 12px -2px rgba(139, 115, 85, 0.10)',
      card: '0 6px 20px -4px rgba(139, 115, 85, 0.12), 0 2px 8px -2px rgba(139, 115, 85, 0.08)',
      sm: '0 2px 12px -2px rgba(139, 115, 85, 0.10)',
      elevated:
        '0 12px 32px -6px rgba(139, 115, 85, 0.16), 0 4px 12px -2px rgba(139, 115, 85, 0.10)',
      fab: '0 8px 24px rgba(79, 125, 255, 0.35)',
      export:
        '0 20px 40px -8px rgba(139, 115, 85, 0.14), 0 8px 16px -4px rgba(139, 115, 85, 0.10)',
      /** 输入框微阴影——让输入区域在白底上轻微浮起 */
      input: '0 1px 4px rgba(139, 115, 85, 0.08)',
    },
  },
  rules: [
    ['safe-pb', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
    ['safe-pt', { 'padding-top': 'env(safe-area-inset-top)' }],
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',
      /** 标准卡片：白底上的轻材质，避免在纯白背景里形成厚重卡片墙 */
    'card-base':
      'bg-card rounded-[22px] shadow-soft overflow-hidden',
    /** Hero 卡片：更大圆角，常用于首页 / 概览等视觉焦点 */
    'card-hero':
      'relative bg-card rounded-[28px] overflow-hidden',
    /** 浮起卡片：加重阴影，用于弹层 / 重要 CTA 卡片 */
    'card-elevated':
      'bg-card rounded-[24px] shadow-elevated overflow-hidden',
    /** 暖色区域包裹——用于列表、表单区块的背景 */
    'surface-warm':
      'bg-warm-bg rounded-[24px]',
    /** 开放式内容面板：用于白底上的轻分区 */
    'surface-open':
      'bg-white rounded-[24px] overflow-hidden',
    /** 暖调内容岛：用于表单、数据和列表内部的低对比分组 */
    'surface-tint':
      'bg-warm-surface rounded-[20px]',
    /** 列表行：替代厚卡片堆叠 */
    'surface-row':
      'bg-white rounded-[18px] active:bg-warm-surface transition-colors',
    /** Sheet 面板 */
    'sheet-panel': 'bg-warm-sheet rounded-t-[28px]',
    /** 暖色分割线 */
    'divider-warm': 'border-t border-warm-divider',
    /** 输入框——白底微阴影浮起在暖底之上 */
    'input-warm':
      'bg-white rounded-xl shadow-input',
    /** 标签 Pill */
    'surface-pill':
      'bg-white rounded-full shadow-sm',
    'btn-primary':
      'bg-brand text-white rounded-full flex-center active:scale-95 transition-transform',
    'btn-secondary':
      'bg-white text-primary border border-warm-border rounded-full flex-center active:scale-95 transition-transform',
    'btn-ghost':
      'bg-transparent text-secondary rounded-full flex-center active:bg-warm-border/20 transition-colors',
    'text-title': 'text-xl font-bold text-primary',
    'text-subtitle': 'text-base font-medium text-primary',
    'text-body': 'text-sm text-secondary',
    'text-caption': 'text-xs text-secondary/80',
    'page-wrapper':
      'min-h-screen bg-background text-primary overflow-x-hidden safe-pb',
    'page-shell':
      'min-h-screen bg-background text-primary overflow-x-hidden',
    'glass-surface':
      'bg-white border-t border-warm-border/60',
    'text-page-title': 'text-xl font-semibold text-primary tracking-tight',
    'text-page-subtitle': 'text-[13px] text-muted-strong',
    'text-section-title': 'text-lg font-semibold text-primary tracking-tight',
    'text-label': 'text-[13px] font-medium text-secondary',
    'text-big-number':
      'text-[42px] font-semibold text-primary tracking-tight leading-none',
    'input-surface': 'bg-warm-surface rounded-xl',
    'border-subtle': 'border-warm-border/60',
    'bg-danger-subtle': 'bg-danger-bg',
    'text-warm-muted': 'text-[#B8B0A6]',
    /** 需可读的次要文案（日期、副标题、空态说明等） */
    'text-muted-readable': 'text-muted-strong',
  },
})
