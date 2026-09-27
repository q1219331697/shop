/**
 * ⚠️ 禁止 AI 改写本文件（DO NOT MODIFY BY AI）
 *
 * 本文件为人工维护的构建/代理配置，涉及前后端接口前缀、
 * 代理转发与测试链路的一致性，AI 不得自动修改。
 * 如需变更，请由人工确认后手动修改。
 */
import path from 'path'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // 代理前缀与前端生产同源（.env 的 VITE_API_PREFIX），只写一次；
  // 改前缀只需改 .env，代理 / app(baseURL) / 测试(loadEnv) 三处一致。
  const apiPrefix = env.VITE_API_PREFIX || '/api'

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: [
          'vue',
          'vue-router',
          'pinia',
          // 接口层统一入口：只注册 api 聚合对象本身，
          // 新增/修改接口只需改 src/api/index.ts，无需再动构建配置
          { '@/api': ['api'] },
        ],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        [apiPrefix]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), ''),
        },
      },
    },
  }
})
