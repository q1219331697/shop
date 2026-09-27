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


export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  // 配置全部显式：不设隐式默认值，缺项即报错（要改配置只改 env 文件 —— 见 .env 的 key 清单）。
  // dev / preview 起代理，必须有后端地址；build 不需要（生产同源，地址为空是预期）。
  const requiredKeys =
    command === 'serve' ? ['VITE_API_PREFIX', 'VITE_API_BASE_URL'] : ['VITE_API_PREFIX']
  for (const key of requiredKeys) {
    if (!env[key]) {
      throw new Error(
        `[vite.config] 当前模式（${mode}）缺少 ${key}：请在该模式的 env 文件中显式配置（见 .env 的 key 清单）`,
      )
    }
  }
  // 代理前缀与前端生产同源（.env 的 VITE_API_PREFIX），只写一次；
  // 改前缀只需改 .env，代理 / app(baseURL) / 测试(loadEnv) 三处一致。
  const apiPrefix = env.VITE_API_PREFIX
  // 代理上下文用正则精确匹配「/api 或 /api/…」，避免 /apixxx、/api-docs 被误代理
  // （Vite 规则：键以 ^ 开头按正则匹配，否则等价于 url.startsWith）
  const apiProxyContext = `^${apiPrefix}(/|$)`

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
    // 开发服务器：5173；后端目标 = VITE_API_BASE_URL（dev 模式 → .env.development）
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // 与下方 preview 的代理规则保持一致（只 target 不同）
        [apiProxyContext]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), ''),
        },
      },
    },
    // 预览 = E2E 测试服务：4173（=Vite preview 默认端口），与 dev(5173) 并存
    // 注意：以 `--mode preview` 启动（见 package.json 的 preview 脚本）→ env 来自 .env + .env.preview
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        // 与上方 server 的规则一致：两边都取 VITE_API_BASE_URL，只是生效的 mode 不同
        [apiProxyContext]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), ''),
        },
      },
    },
  }
})
