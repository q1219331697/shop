/**
 * HTTP 传输层（仅运行在浏览器）
 *
 * 基于 axios 的统一封装：注入 Token、解包业务 data、统一错误处理。
 * 本模块只服务于浏览器，因此可以放心直接使用 router / element-plus / storage，
 * 无需为任何非浏览器环境做兼容（测试侧不 import 本模块，见 @/api/endpoints 说明）。
 *
 * 请求地址由 @/api/endpoints 提供（相对路径），前缀由下方 baseURL 补全。
 */
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

import router from '@/router'
import { getToken, removeToken } from '@/utils/storage'

import { SUCCESS, UNAUTHORIZED, FORBIDDEN } from './resultCode'


const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX,
  timeout: 15000,
})

// 请求拦截器：注入 Token
instance.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：解包 data + 统一错误处理
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    if (code === SUCCESS) {
      return data
    }
    // 未登录或登录已过期
    if (code === UNAUTHORIZED) {
      removeToken()
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
        ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => router.push('/login'))
          .catch(() => {})
      }
      throw new Error(message || '未登录或登录已过期')
    }
    // 无权限访问
    if (code === FORBIDDEN) {
      ElMessage.error(message || '无权限访问')
      throw new Error(message || '无权限访问')
    }
    // 其他业务错误
    ElMessage.error(message || '请求失败')
    throw new Error(message || '请求失败')
  },
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || '请求失败'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        removeToken()
        if (router.currentRoute.value.path !== '/login') {
          router.push('/login')
          ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
          })
            .then(() => router.push('/login'))
            .catch(() => {})
        }
      } else if (status === 403) {
        ElMessage.error(errorMsg || '无权限访问')
      } else {
        ElMessage.error(`请求失败 (${status})：${errorMsg}`)
      }
    } else {
      ElMessage.error('网络连接异常，请检查网络')
    }
    return Promise.reject(error)
  },
)

// ==================== 业务传输入口 ====================

/**
 * 业务统一使用的传输入口（基于 axios），默认导出供业务模块使用：
 *   import request from '@/api/http'
 *   const data = await request.get<RoleItem>('/api/role/1')
 *
 * 为什么走 instance.request + 第二泛型参数，而不是直接用 axios 的 get/post<T>？
 *   响应拦截器已解包 data，业务层希望方法返回 T 而非 AxiosResponse<T>。
 *   但 axios 的 get/post/... 只把 T 当作「响应体类型」，返回类型写死为 AxiosResponse<T>，
 *   无法表达「拦截器已解包」。而 axios.request 提供了第二泛型参数 R（最终返回类型），
 *   于是用 instance.request<unknown, T> 把返回收敛为 T —— 既不需要自定义类型，也不需要 as 断言。
 */
const request = {
  get: <T>(url: string, params?: object) =>
    instance.request<unknown, T>({ url, method: 'GET', params }),
  post: <T>(url: string, data?: unknown) =>
    instance.request<unknown, T>({ url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown) =>
    instance.request<unknown, T>({ url, method: 'PUT', data }),
  delete: <T>(url: string, data?: unknown) =>
    instance.request<unknown, T>({ url, method: 'DELETE', data }),
}

export default request
