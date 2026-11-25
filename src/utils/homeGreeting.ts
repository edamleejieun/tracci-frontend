export interface HomeGreetingCopy {
  greeting: string
  subtext: string
}

/** 根据时段与是否有进行中旅程，生成首页 Hero 文案 */
export function getHomeGreetingCopy(hour: number, hasOngoingTrip: boolean): HomeGreetingCopy {
  const isLateNight = hour >= 22 || hour < 5
  const isMorning = hour >= 5 && hour < 12
  const isAfternoon = hour >= 12 && hour < 18

  if (isLateNight) {
    return {
      greeting: '夜深了',
      subtext: hasOngoingTrip
        ? '旅途还在继续，记录一下今天的开支吧'
        : '早点休息，新旅程随时可以开始'
    }
  }

  if (isMorning) {
    return {
      greeting: '早上好',
      subtext: hasOngoingTrip ? '今天的行程，从查看 itinerary 开始' : '新的一天，规划下一段旅程'
    }
  }

  if (isAfternoon) {
    return {
      greeting: '下午好',
      subtext: hasOngoingTrip ? '旅途进行中，记一笔开支或日志' : '有空的话，规划下一段旅程'
    }
  }

  return {
    greeting: '晚上好',
    subtext: hasOngoingTrip ? '今天的记录，还差几笔' : '今天有什么想记录的？'
  }
}
