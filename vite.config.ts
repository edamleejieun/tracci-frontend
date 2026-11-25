/// <reference types="vitest" />
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    uni(),
    UnoCSS()
  ],
  esbuild: command === 'build'
    ? {
        drop: ['console', 'debugger'],
        legalComments: 'none'
      }
    : undefined,
  build: command === 'build'
    ? {
        target: 'es2015',
        // 减小 chunk 大小警告阈值，便于发现大文件
        chunkSizeWarningLimit: 500
      }
    : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    // 使用 Node 环境，不加载 uni-app 插件
    environment: 'node',
    // 全局注入 uni mock
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    // 仅匹配 __tests__ 和 *.test.ts，排除 setup 文件
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    // 不覆盖产物
    coverage: {
      provider: 'v8',
      include: ['src/utils/demoJourneyValidator.ts', 'src/utils/demoGraduated.ts'],
      reporter: ['text', 'json', 'html']
    }
  }
}))
