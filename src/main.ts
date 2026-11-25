import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { setAppPinia } from '@/stores/pinia-instance'
import App from './App.vue'
import 'uno.css'
import './styles/main.css'

export function createApp() {
  const app = createSSRApp(App)
  const store = Pinia.createPinia()

  setAppPinia(store)
  app.use(store)

  return {
    app,
    Pinia
  }
}
