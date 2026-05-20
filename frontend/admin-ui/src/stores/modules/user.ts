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
    const result = await loginApi(params)
    token.value = result.token
    username.value = params.username
    setToken(result.token)
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
