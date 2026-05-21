/**
 * HTTP 请求封装
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from './storage'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX,
  timeout: 15000,
})

// 请求拦截器
// Token 存储在 Cookie 中，但后端从请求头读取，因此需要从 Cookie 取出设置到 Header
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.set('Token', token)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    if (code === '0000') {
      return data
    }
    // Token 过期或无效
    if (code === '0600') {
      removeToken()
      router.push('/login')
      ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      })
      return Promise.reject(new Error(message || '未授权'))
    }
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    const { response } = error
    if (response) {
      if (response.status === 401) {
        removeToken()
        router.push('/login')
        ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        })
        return Promise.reject(new Error('未登录或登录已过期'))
      }
      switch (response.status) {
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.message || '请求失败')
      }
    } else {
      ElMessage.error('网络连接异常，请检查网络')
    }
    return Promise.reject(error)
  },
)

export function get<T>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.get(url, { params, ...config }) as Promise<T>
}

export function post<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config) as Promise<T>
}

export function put<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.put(url, data, config) as Promise<T>
}

export function del<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.delete(url, { data, ...config }) as Promise<T>
}

export default service
