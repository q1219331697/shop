/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/storage'
import { startAutoRefreshToken, stopAutoRefreshToken } from '@/utils/http'
import type { LoginParams } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const username = ref<string>('')

  /** 登录 */
  async function login(params: LoginParams) {
    try {
      const loginToken = await loginApi(params)

      // HTTP 拦截器已处理响应：
      // - 成功时直接返回 data（token 字符串）
      // - 失败时抛出异常
      // 所以这里 loginToken 就是登录成功后的 Token 值

      // 保存 token 和 username
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
      await logoutApi()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      resetState()
    }
  }

  /** 重置状态 */
  function resetState() {
    token.value = ''
    username.value = ''
    removeToken()
    // 停止 Token 自动刷新
    stopAutoRefreshToken()
  }

  return {
    token,
    username,
    login,
    logout,
    resetState,
  }
})
