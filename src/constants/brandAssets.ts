/** 品牌主色（与 uno.config.ts `brand` 一致） */
export const BRAND_ACCENT = '#4F7DFF'
export const BRAND_TEXT = '#2F2A25'
export const BRAND_TEXT_MUTED = '#9B958C'

/**
 * uni-app 静态资源：使用 /static 路径，H5 与微信小程序均稳定。
 * 勿用 Vite import 的 assets URL（小程序端 image 易失效）。
 */
export const BRAND_LOGO_MARK = '/static/brand/logo-mark.png'

// ==================== 小程序品牌资产（generated） ====================

const GENERATED_BASE = '/static/brand/generated'

/** 小程序 App 图标（白底版，运行时仅保留分享所需尺寸） */
export const MINIAPP_ICON_WHITE = {
  base: GENERATED_BASE,
  sizes: [256] as const,
  /** 获取指定尺寸的小程序图标路径 */
  get(size: number): string {
    return `${GENERATED_BASE}/miniapp-icon-white-${size}.png`
  }
}

/** 品牌水印（灰色版，运行时仅保留首页 / 我的装饰尺寸） */
export const BRAND_WATERMARK_GREY = {
  base: GENERATED_BASE,
  sizes: [256] as const,
  get(size: number): string {
    return `${GENERATED_BASE}/brand-watermark-grey-${size}.png`
  }
}
