import type { APIRequestContext, APIResponse } from '@playwright/test'
import { loadEnv } from 'vite'

import { endpoints } from '../../../src/api/endpoints'
import { SUCCESS } from '../../../src/api/resultCode'

/**
 * 测试侧自行配置的前缀：从 .env(.env.development) 读取 VITE_API_PREFIX，
 * 与前端生产同源（只写一次，不再写死）。page.request 用它拼完整地址；
 * 生产由 @/api/http 的 axios baseURL 提供。缺失时回退 '/api'（本地 Vite 代理）。
 * 不进共享模块，测试不污染生产。
 */
const API_PREFIX = loadEnv('development', process.cwd()).VITE_API_PREFIX || '/api'

/**
 * E2E 数据准备 / 清理的最小工具集。
 *
 * 刻意不封装「角色 / 用户 / 权限」等资源方法——调用处直接用 page.request 即可：
 *
 *   await page.request.post(apiUrl(endpoints.role.create), { data: {...}, headers: auth() })
 *   await page.request.get(apiUrl(endpoints.role.list), { params: {...}, headers: auth() })
 *
 * 本文件存在的唯一理由：后端只认 `Authorization: Bearer`（见 AdminAuthFilter），
 * 而 page.request 只共享 Cookie、不会自动带该头，故每个请求都须显式传 headers: auth()。
 *
 * 地址统一取自 @/api/endpoints（与生产同一份，只写一次）。endpoints 里是相对路径，
 * 测试侧用 apiUrl() 拼上 API_PREFIX 得到完整地址（page.request 没有 axios 的 baseURL 机制）。
 */

let adminToken: string | null = null

/** 把相对资源路径拼成完整地址（测试侧替代 axios 的 baseURL） */
export const apiUrl = (path: string): string => API_PREFIX + path

/** 登录并保存 Token（用例内由 apiReady fixture 调用，beforeAll 由 ctx.request 调用） */
export async function loginAsAdmin(
  request: APIRequestContext,
  admin: { username: string; password: string },
): Promise<void> {
  const resp = await request.post(apiUrl(endpoints.auth.login), { data: admin })
  adminToken = await unwrap<string>(resp)
}

/** 每个 E2E 请求都要带的鉴权头 */
export function auth(): { Authorization: string } {
  if (!adminToken) {
    throw new Error('E2E 尚未登录：请先调用 loginAsAdmin()')
  }
  return { Authorization: `Bearer ${adminToken}` }
}

/** 解包业务 data；非成功码直接抛错，避免用例带着「假成功」继续跑 */
export async function unwrap<T>(resp: APIResponse): Promise<T> {
  const body = (await resp.json()) as { code: string; data: T; message?: string }
  if (body.code !== SUCCESS) {
    throw new Error(`E2E 接口失败：code=${body.code} message=${body.message ?? ''}`)
  }
  return body.data
}

/**
 * 清理接口地址：后端 internal 包，仅测试环境启用。
 * 生产用不到，故不进 @/api/endpoints（避免测试概念进生产）；前缀 API_PREFIX 由本文件自行配置。
 */
export const cleanupUrl = (prefix: string): string =>
  `${API_PREFIX}/internal/test/cleanup-e2e?prefix=${encodeURIComponent(prefix)}`
