import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30秒超时，适合API测试
    hookTimeout: 30000,
  },
})