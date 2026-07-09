import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// Vite 配置 — 奶龙记账
export default defineConfig({
  plugins: [
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
