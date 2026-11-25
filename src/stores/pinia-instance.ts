import type { Pinia } from 'pinia'

let appPinia: Pinia | null = null

export function setAppPinia(pinia: Pinia) {
  appPinia = pinia
}

export function getAppPinia(): Pinia | null {
  return appPinia
}
