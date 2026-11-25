import type { ExportFormatType } from '@/types/export'

/** 导出图布局设计稿基准宽度（像素） */
export const EXPORT_DESIGN_BASE_WIDTH = 1080

/** 设计稿画布尺寸（与 EXPORT_CANVAS_SIZE 一致） */
export const EXPORT_DESIGN_SIZE: Record<
  ExportFormatType,
  { width: number; height: number }
> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 }
}

/** 1080 设计稿下的布局与排版常量 */
export const EXPORT_DESIGN_LAYOUT = {
  /** 画布左右内边距 */
  padding: 60,

  header: {
    /** 顶部品牌行距画布顶（方图 / 竖图） */
    topInset: { square: 28, portrait: 36 } as Record<ExportFormatType, number>,
    brandFontSize: 28,
    dateFontSize: 24,
    /** 品牌+日期行占用高度（至下一区块顶） */
    brandRowHeight: { square: 44, portrait: 52 } as Record<ExportFormatType, number>,

    destinationLabelFontSize: 26,
    destinationLabelLineHeight: 32,
    /** 「目的地」标签底 → 标题顶 */
    destinationToTitleGap: 12,

    titleFontSize: 56,
    titleLineHeight: 68,
    titleMaxLines: 2,
    /**
     * 标题块底 → 照片区顶
     * 标题改为顶对齐后，单行标题需用较小间距才能与旧版照片区起点对齐
     */
    titleBottomGap: { square: 18, portrait: 36 } as Record<ExportFormatType, number>
  },

  watermarkFontSize: 24,
  watermarkMaxWidthRatio: 0.82,

  photo: {
    gap: 12,
    squareHeightRatio: 0.32,
    portraitHeightRatio: 0.36,
    squareBottomGap: 32,
    portraitBottomGap: 40,
    collageLeftRatio: 1.2 / 2.2,
    collageTopRatio: 1 / 1.8,
    borderWidth: 4
  },

  stats: {
    gap: 8,
    squarePillHeight: 84,
    portraitPillHeight: 96,
    pillRadius: 20,
    borderWidth: 2,
    valueFontSize: 37,
    minValueFontSize: 24,
    labelFontSize: 22,
    valueBaseline: 48,
    labelBaseline: 72,
    squareBottomGap: 28,
    portraitBottomGap: 36
  },

  expense: {
    barHeight: 20,
    barToLegendGap: 20,
    legendFontSize: 22,
    legendItemGap: 16,
    legendDotSize: 6,
    legendRowGap: 10,
    legendMaxLines: 2,
    /** 图例区结束后额外留白（与旧版 y += 28 对齐） */
    legendBottomGap: 28
  }
} as const
