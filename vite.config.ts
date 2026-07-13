import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// Vite 配置 — 奶龙记账
// 单元测试（Vitest）会合并本文件；跑测时不要挂 Electron 插件，否则用例套件会初始化失败
const isVitest = !!process.env.VITEST

export default defineConfig({
  plugins: isVitest
    ? [react()]
    : [
        react(),
        electron([
          {
            // Electron 主进程入口
            entry: 'electron/main.ts',
          },
          {
            // 预加载脚本
            entry: 'electron/preload.ts',
            onstart(options) {
              options.reload()
            },
          },
        ]),
        // 这个插件允许渲染进程（React）通过 window.api 顺畅地与主进程进行通信
        renderer(),
      ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
