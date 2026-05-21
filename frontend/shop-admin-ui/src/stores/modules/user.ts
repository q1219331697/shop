/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { setToken, removeToken } from '@/utils/storage'
import type { LoginParams } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const username = ref<string>('')

  /** 登录 */
  async function login(params: LoginParams) {
    const tokenStr = await loginApi(params)
    token.value = tokenStr
    username.value = params.username
    // 将 Token 写入 Cookie，后续请求从 Cookie 读取并通过 Header 发送
    setToken(tokenStr)
  }

  /** 退出登录 */
  async function logout() {
    try {
      await logoutApi()
    } finally {
      resetState()
    }
  }

  /** 重置状态 */
  function resetState() {
    token.value = ''
    username.value = ''
    removeToken()
  }

  return {
    token,
    username,
    login,
    logout,
    resetState,
  }
})
