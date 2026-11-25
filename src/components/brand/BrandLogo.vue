<template>
  <image
    :src="BRAND_LOGO_MARK"
    :style="{ width: s + 'px', height: s + 'px', borderRadius: borderRadius + 'px' }"
    class="brand-logo"
    mode="aspectFill"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_LOGO_MARK } from '@/constants/brandAssets'

const props = withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 32
  }
)

const s = computed(() => props.size)
const borderRadius = computed(() => (s.value >= 32 ? s.value * 0.25 : s.value * 0.2))
</script>

<style scoped>
.brand-logo {
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.06);
  display: block;
  flex-shrink: 0;
}
</style>
