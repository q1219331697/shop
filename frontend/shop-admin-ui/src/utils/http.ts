/**
 * HTTP 请求封装
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getToken,
  setToken,
  removeToken,
} from '@/utils/storage'
import { SUCCESS, UNAUTHORIZED, FORBIDDEN } from '@/api/resultCode'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX,
  timeout: 15000,
})

// 是否正在刷新 Token
let isRefreshing = false

/**
 * 刷新Token：每25分钟调用一次
 * 后端 AdminUserService.refreshToken 方法会延长 Redis 中 Token 的有效时间
 * 如果 Token 无效，返回 401 错误
 */
async function refreshToken(): Promise<void> {
  const currentToken = getToken()
  if (!currentToken) {
    return Promise.reject(new Error('无 Token 可刷新'))
  }

  try {
    const response = await axios.post(`${import.meta.env.VITE_API_PREFIX}/public/token/refresh`, {}, {
      headers: { Authorization: `Bearer ${currentToken}` },
    })

    if (response.data.code === SUCCESS) {
      // 刷新成功，更新本地 Token（如果有新 Token 返回）
      if (response.data.data) {
        setToken(response.data.data)
      }
    } else {
      throw new Error(response.data.message || 'Token 刷新失败')
    }
  } catch (error: unknown) {
    // 刷新失败，清除登录状态
    removeToken()
    router.push('/login')
    ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning',
    })
    return Promise.reject(error)
  }
}

/**
 * 处理 Token 过期（401）：直接跳转登录页
 */
function handleTokenExpired(): Promise<void> {
  removeToken()
  router.push('/login')
  ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
  })
  return Promise.reject(new Error('未登录或登录已过期'))
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ==================== 后台定时自动刷新Token ====================
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

/**
 * 启动 Token 自动刷新定时器
 * 每25分钟调用一次 /token/refresh 接口刷新 Token
 */
export function startAutoRefreshToken(): void {
  stopAutoRefreshToken()
  autoRefreshTimer = setInterval(() => {
    if (!getToken()) {
      // 无 Token，停止定时器
      stopAutoRefreshToken()
      return
    }
    if (!isRefreshing) {
      isRefreshing = true
      refreshToken()
        .catch(() => {
          // 刷新失败，清除登录状态
        })
        .finally(() => {
          isRefreshing = false
        })
    }
  }, 25 * 60 * 1000) // 25分钟
}

/**
 * 停止 Token 自动刷新定时器
 */
export function stopAutoRefreshToken(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    if (code === SUCCESS) {
      return data
    }
    // 未登录或登录已过期
    if (code === UNAUTHORIZED) {
      return handleTokenExpired()
    }
    // 无权限访问
    if (code === FORBIDDEN) {
      return Promise.reject(new Error(message || '无权限访问'))
    }
    // 其他业务错误（非 200），显示错误提示
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    // 统一处理所有请求错误
    const errorMsg = error.response?.data?.message || error.message || '请求失败'
    if (error.response) {
      ElMessage.error(`请求失败 (${error.response.status})：${errorMsg}`)
    } else {
      ElMessage.error('网络连接异常，请检查网络')
    }
    return Promise.reject(error)
  },
)

/**
 * 判断是否为服务器错误（5xx）
 * 服务器错误不应该在请求拦截器中显示提示，应该由调用者决定如何处理
 */
export function isServerError(error: Error | unknown): boolean {
  const axiosError = error as { response?: { status?: number } }
  const status = axiosError?.response?.status
  return status !== undefined && status >= 500 && status < 600
}

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
