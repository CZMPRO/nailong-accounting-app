import { defineConfig } from 'vitest/config'

// Vitest 配置 — 仅用于 Node 环境的纯逻辑单元测试（不启动 Electron 窗口）
export default defineConfig({
  test: {
    environment: 'node',
    include: ['electron/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'dist-electron', 'release'],
  },
})
