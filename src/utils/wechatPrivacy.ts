export const WECHAT_PRIVACY_AGREE_BUTTON_ID = 'wechat-privacy-agree-btn'

export interface PrivacySettingResult {
  needAuthorization: boolean
  privacyContractName: string
}

type WxPrivacyResolve = (result: {
  event: 'agree' | 'disagree'
  buttonId?: string
}) => void

export interface PrivacyPopupRequest {
  contractName: string
  onAgree: () => void
  onDisagree: () => void
  wxResolve?: WxPrivacyResolve
}

let popupHandler: ((request: PrivacyPopupRequest) => void) | null = null

export function setPrivacyPopupHandler(handler: ((request: PrivacyPopupRequest) => void) | null) {
  popupHandler = handler
}

function showPrivacyPopup(request: PrivacyPopupRequest) {
  if (popupHandler) {
    popupHandler(request)
    return
  }

  uni.showToast({
    title: '请先阅读并同意隐私指引',
    icon: 'none'
  })
  request.onDisagree()
}

export function getPrivacySetting(): Promise<PrivacySettingResult> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx.getPrivacySetting !== 'function') {
      resolve({
        needAuthorization: false,
        privacyContractName: ''
      })
      return
    }

    wx.getPrivacySetting({
      success: res => {
        resolve({
          needAuthorization: !!res.needAuthorization,
          privacyContractName: res.privacyContractName || '《用户隐私保护指引》'
        })
      },
      fail: err => reject(err)
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve({
    needAuthorization: false,
    privacyContractName: ''
  })
  // #endif
}

/** 当前环境是否支持打开微信官方隐私保护指引 */
export function canOpenWechatPrivacyContract(): boolean {
  // #ifdef MP-WEIXIN
  if (typeof wx === 'undefined') return false
  if (typeof wx.openPrivacyContract === 'function') return true
  if (typeof wx.canIUse === 'function') {
    return wx.canIUse('openPrivacyContract')
  }
  return false
  // #endif

  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/**
 * 打开微信平台配置的《用户隐私保护指引》官方页面。
 * 需在微信小程序环境且基础库支持 wx.openPrivacyContract。
 */
export function openWechatPrivacyContract(): Promise<void> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    if (!canOpenWechatPrivacyContract()) {
      uni.showModal({
        title: '无法打开',
        content: '当前微信版本过低或未配置隐私保护指引，请升级微信后重试，或在微信公众平台完善隐私设置。',
        showCancel: false
      })
      reject(new Error('API_NOT_SUPPORTED'))
      return
    }

    wx.openPrivacyContract({
      success: () => resolve(),
      fail: err => {
        const msg = (err as { errMsg?: string })?.errMsg || ''
        if (msg.includes('cancel')) {
          reject(new Error('USER_CANCEL'))
          return
        }
        uni.showToast({ title: '暂时无法打开隐私指引', icon: 'none' })
        reject(err)
      }
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('NOT_WECHAT'))
  // #endif
}

export function initWechatPrivacyListener() {
  // #ifdef MP-WEIXIN
  if (typeof wx === 'undefined' || !wx.onNeedPrivacyAuthorization) return

  wx.onNeedPrivacyAuthorization(resolve => {
    let settled = false
    const finish = (result: { event: 'agree' | 'disagree'; buttonId?: string }) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    const fallbackTimer = setTimeout(() => {
      finish({ event: 'disagree' })
    }, 60000)

    getPrivacySetting()
      .then(setting => {
        showPrivacyPopup({
          contractName: setting.privacyContractName,
          wxResolve: result => {
            clearTimeout(fallbackTimer)
            finish(result)
          },
          onAgree: () => {
            clearTimeout(fallbackTimer)
            finish({ event: 'agree' })
          },
          onDisagree: () => {
            clearTimeout(fallbackTimer)
            finish({ event: 'disagree' })
          }
        })
      })
      .catch(() => {
        clearTimeout(fallbackTimer)
        finish({ event: 'disagree' })
      })
  })
  // #endif
}

export async function ensureWechatPrivacyAuthorized(): Promise<boolean> {
  // #ifdef MP-WEIXIN
  try {
    const setting = await getPrivacySetting()
    if (!setting.needAuthorization) {
      return true
    }

    return new Promise<boolean>(resolve => {
      let settled = false
      const finish = (granted: boolean) => {
        if (settled) return
        settled = true
        resolve(granted)
      }
      const fallbackTimer = setTimeout(() => {
        finish(false)
      }, 60000)

      if (typeof wx === 'undefined' || typeof wx.requirePrivacyAuthorize !== 'function') {
        clearTimeout(fallbackTimer)
        finish(true)
        return
      }

      wx.requirePrivacyAuthorize({
        success: () => {
          clearTimeout(fallbackTimer)
          finish(true)
        },
        fail: () => {
          clearTimeout(fallbackTimer)
          finish(false)
        }
      })
    })
  } catch {
    return false
  }
  // #endif

  // #ifndef MP-WEIXIN
  return true
  // #endif
}

export function navigateToLegalPage(type: 'terms' | 'privacy') {
  uni.navigateTo({
    url: type === 'terms' ? '/pages/legal/terms' : '/pages/legal/privacy'
  })
}
