<template>
  <button
    class="flex-center transition-all duration-200 rounded-full font-medium m-0"
    :class="[
      typeClass,
      sizeClass,
      block ? 'w-full' : '',
      disabled || loading
        ? 'opacity-50 cursor-not-allowed active:scale-100'
        : 'active:scale-[0.96]',
      customClass
    ]"
    :disabled="disabled || loading"
    @click.stop="onClick"
  >
    <view v-if="loading" class="i-carbon-circle-dash animate-spin mr-1.5"></view>
    <view v-else-if="icon" :class="icon" class="mr-1.5"></view>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    icon?: string
    block?: boolean
    disabled?: boolean
    loading?: boolean
    customClass?: string
  }>(),
  {
    type: 'primary',
    size: 'md',
    block: false,
    disabled: false,
    loading: false,
    customClass: ''
  }
)

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

const onClick = (e: Event) => {
  if (props.disabled || props.loading) return
  emit('click', e)
}

const typeClass = computed(() => {
  switch (props.type) {
    case 'primary':
      return 'bg-brand text-white shadow-sm'
    case 'secondary':
      return 'bg-white text-brand border border-warm-border shadow-sm'
    case 'outline':
      return 'bg-transparent border-2 border-brand text-brand'
    case 'text':
      return 'bg-transparent text-brand active:bg-subtle'
    case 'danger':
      return 'bg-danger text-white shadow-sm'
    default:
      return 'bg-brand text-white'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-3 py-1.5'
    case 'md':
      return 'text-sm px-5 py-2.5'
    case 'lg':
      return 'text-base px-6 py-3.5'
    default:
      return 'text-sm px-5 py-2.5'
  }
})
</script>

<style scoped>
/* 去除小程序/H5 默认的 button 边框 */
button::after {
  border: none;
}
button {
  line-height: normal;
}
</style>
