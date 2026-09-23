/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { LoginParams } from '@/api'
import { startAutoRefreshToken, stopAutoRefreshToken } from '@/api/auth'
import { removeToken, setToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  /** 当前登录管理员ID（由后端回填，供「自身保护」等按身份判断的场景使用） */
  const userId = ref<number | null>(null)
  const username = ref<string>('')

  /**
   * 拉取当前登录账号信息。
   *
   * Token 存在 Cookie 里，整页刷新后 Store 会重建，账号身份只能回后端取；
   * 否则顶栏账号名会退化成占位文案，「管理员列表禁止操作自己」也会失效。
   * 失败不抛出：身份缺失只影响前端展示与交互，后端仍会拦截自身操作。
   */
  async function loadProfile() {
    try {
      const profile = await api.adminUser.current()
      userId.value = profile.id
      username.value = profile.username
    } catch (error) {
      console.warn('[UserStore] 获取当前登录账号信息失败:', error)
    }
  }

  /** 登录 */
  async function login(params: LoginParams) {
    try {
      const loginToken = await api.auth.login(params)

      // HTTP 拦截器已处理响应：
      // - 成功时直接返回 data（token 字符串）
      // - 失败时抛出异常
      // 所以这里 loginToken 就是登录成功后的 Token 值

      // 保存 token 和 username（userId 由 loadProfile 在路由守卫中回填）
      token.value = loginToken
      username.value = params.username

      // 将 Token 写入 Cookie，后续请求从 Cookie 读取并通过 Header 发送
      setToken(loginToken)

      // 启动 Token 自动刷新，确保 Token 永不过期
      startAutoRefreshToken()
    } catch (error) {
      console.error('[UserStore] 登录异常:', error)
      // 确保登录失败时清理状态
      resetState()
      throw error
    }
  }

  /** 退出登录 */
  async function logout() {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      resetState()
    }
  }

  /** 重置状态 */
  function resetState() {
    token.value = ''
    userId.value = null
    username.value = ''
    removeToken()
    // 停止 Token 自动刷新
    stopAutoRefreshToken()
  }

  return {
    token,
    userId,
    username,
    loadProfile,
    login,
    logout,
    resetState,
  }
})
