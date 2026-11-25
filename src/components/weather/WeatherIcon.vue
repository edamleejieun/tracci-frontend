<template>
  <!--
    注意：勿使用 prop 名 `size`。
    UnoCSS 会生成 [size~=md]/[size~=lg] 等属性选择器（超大宽高），
    小程序组件 prop 会落到宿主属性上，导致天气图标被撑到封面区域。
  -->
  <view
    class="weather-icon inline-flex items-center justify-center shrink-0"
    :style="{ color }"
    :class="[iconClass, scaleClass]"
  />
</template>

<script lang="ts">
export default {
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { getWeatherColor } from '@/constants/weatherIcons'

const props = withDefaults(
  defineProps<{
    icon?: string
    /** 图标视觉档位；禁止命名为 size（会与 UnoCSS 属性选择器冲突） */
    iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    icon: 'unknown',
    iconSize: 'md'
  }
)

/** Map backend weather icon codes to Carbon icon classes */
const iconClassMap: Record<string, string> = {
  sunny: 'i-carbon-sunny',
  cloudy: 'i-carbon-partly-cloudy',
  overcast: 'i-carbon-cloudy',
  light_rain: 'i-carbon-rain-drizzle',
  moderate_rain: 'i-carbon-rain',
  heavy_rain: 'i-carbon-rain-heavy',
  snow: 'i-carbon-snow',
  fog: 'i-carbon-fog',
  unknown: 'i-carbon-partly-cloudy'
}

const iconClass = computed(() => iconClassMap[props.icon || 'unknown'] || iconClassMap.unknown)

const scaleClass = computed(() => {
  switch (props.iconSize) {
    case 'sm': return 'text-lg'
    case 'md': return 'text-2xl'
    case 'lg': return 'text-[28px]'
    case 'xl': return 'text-[36px]'
    default: return 'text-2xl'
  }
})

const color = computed(() => getWeatherColor(props.icon))
</script>

<style scoped>
/* 兜底：避免任何全局 size 属性规则把图标撑爆 */
.weather-icon {
  max-width: 2em;
  max-height: 2em;
  overflow: hidden;
}
</style>
