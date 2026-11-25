import { EXPORT_DESIGN_BASE_WIDTH } from '@/export/layout/designTokens'

/** 将 1080 设计稿坐标换算为实际画布像素 */
export function getScale(canvasWidth: number): number {
  return canvasWidth / EXPORT_DESIGN_BASE_WIDTH
}

export function s(designPx: number, scale: number): number {
  return Math.round(designPx * scale)
}
