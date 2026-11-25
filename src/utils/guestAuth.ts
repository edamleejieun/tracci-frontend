import { useUserStore } from '@/stores/user'

export interface GuestLoginPromptOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
}

export function navigateToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

/** 弹窗引导登录，返回用户是否点击「去登录」 */
export function promptLogin(options?: GuestLoginPromptOptions): Promise<boolean> {
  return new Promise(resolve => {
    uni.showModal({
      title: options?.title ?? '需要登录',
      content:
        options?.content ??
        '登录后你的旅程会安全保存在云端，随时查看、统计与分享。',
      confirmText: options?.confirmText ?? '去登录',
      cancelText: options?.cancelText ?? '再看看',
      success: res => {
        if (res.confirm) {
          navigateToLogin()
        }
        resolve(!!res.confirm)
      },
      fail: () => resolve(false)
    })
  })
}

/**
 * 写操作 / 需账号能力的前置校验。
 * 已登录返回 true；未登录弹窗引导，返回 false（即使用户点「去登录」也返回 false，避免继续执行写操作）。
 */
export async function requireLogin(options?: GuestLoginPromptOptions): Promise<boolean> {
  const userStore = useUserStore()
  if (userStore.isLogin()) return true
  await promptLogin(options)
  return false
}

/** 子页面入口守卫：未登录时提示并返回，避免进入可写页面 */
export function guardProtectedPage(): boolean {
  const userStore = useUserStore()
  if (userStore.isLogin()) return true

  uni.showToast({ title: '请先登录', icon: 'none' })

  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
      return
    }
    uni.switchTab({ url: '/pages/index/index' })
  }, 600)

  return false
}
