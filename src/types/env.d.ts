/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址，如 http://localhost:8080（勿以 / 结尾） */
  readonly VITE_API_BASE_URL?: string
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

interface WxPrivacySettingResult {
  needAuthorization: boolean
  privacyContractName: string
}

interface WxPrivacyResolveResult {
  event: 'agree' | 'disagree'
  buttonId?: string
}

interface WxPrivacyApi {
  getPrivacySetting(options: {
    success?: (res: WxPrivacySettingResult) => void
    fail?: (err: unknown) => void
  }): void
  openPrivacyContract(options: {
    success?: () => void
    fail?: (err: unknown) => void
  }): void
  requirePrivacyAuthorize(options: {
    success?: () => void
    fail?: (err: unknown) => void
  }): void
  onNeedPrivacyAuthorization(
    listener: (resolve: (result: WxPrivacyResolveResult) => void) => void
  ): void
}

declare const wx: WxPrivacyApi
