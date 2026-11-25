import { http } from '@/utils/http'
import type { StatsOverviewResponse } from '@/types/stats'

export const StatsService = {
  /**
   * 获取统计概览
   * @param params 包含可选的 tripId，不传则为全局统计
   */
  getStatsOverview(params?: { tripId?: string }) {
    return http<StatsOverviewResponse>({
      url: '/stats/overview',
      method: 'GET',
      data: params
    })
  }
}
