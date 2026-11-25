/**
 * Demo Journey 永久毕业标记。
 *
 * 用户创建首段真实旅程后，Demo 示例资格永久失效——即使后续删除全部旅程回到空态，
 * 示例也不再复现。标记按用户持久化，与 iOS 行为一致。
 *
 * 存储 key 格式：demo_graduated_v1_<userId>
 */

const GRADUATED_PREFIX = 'demo_graduated_v1_'

/** 获取当前用户的毕业标记 key */
export function getGraduatedKey(userId: string): string {
  return `${GRADUATED_PREFIX}${userId}`
}

/** 检查用户是否已毕业（有真实旅程后 Demo 不再展示） */
export function isGraduated(userId: string): boolean {
  if (!userId) return false
  try {
    return uni.getStorageSync(getGraduatedKey(userId)) === true
  } catch {
    return false
  }
}

/** 标记用户已毕业（创建首段真实旅程后调用） */
export function markGraduated(userId: string): void {
  if (!userId) return
  try {
    uni.setStorageSync(getGraduatedKey(userId), true)
  } catch (e) {
    console.warn('[demoGraduated] mark failed:', e)
  }
}

/** 清除毕业标记（仅测试 / 账号注销时使用） */
export function clearGraduated(userId: string): void {
  if (!userId) return
  try {
    uni.removeStorageSync(getGraduatedKey(userId))
  } catch {
    // ignore
  }
}
