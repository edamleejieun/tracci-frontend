import { onMounted, ref } from 'vue'

/** Tab 页无 Navbar 时，与首页顶栏一致的状态栏 + 顶栏留白 */
export function usePageTopInset() {
  const insetTop = ref(48)

  onMounted(() => {
    try {
      const sys = uni.getSystemInfoSync()
      let top = (sys.statusBarHeight || 0) + 12
      // #ifdef MP-WEIXIN
      const menu = uni.getMenuButtonBoundingClientRect()
      if (menu && menu.bottom > 0) {
        top = menu.bottom + 8
      }
      // #endif
      insetTop.value = top
    } catch {
      insetTop.value = 48
    }
  })

  return { insetTop }
}
