
/**
 * HTTP 请求封装
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, setToken, removeToken, isTokenExpiringSoon, isTokenExpired, getAutoRefreshInterval } from '@/utils/storage'
import { SUCCESS, UNAUTHORIZED, FORBIDDEN } from '@/api/resultCode'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX,
  timeout: 15000,
})

// 是否正在续期 Token
let isRefreshing = false

/**
 * 心跳续期：向后端发送轻量请求，利用后端的滑动过期机制自动续期 Token
 * 后端 AdminAuthFilter 在每次有效请求时自动调用 refreshToken 延长 Redis 过期时间
 * 成功后更新本地过期时间记录
 */
function heartbeatRenew(): Promise<void> {
  const currentToken = getToken()
  if (!currentToken) {
    return Promise.reject(new Error('无 Token 可续期'))
  }

  // 使用原始 axios 发送心跳请求，携带 Token 头触发后端滑动过期续期
  // 调用后端专用 /token/heartbeat 接口：需要认证但无需特定权限，任何已登录用户均可访问
  return axios
    .get(`${import.meta.env.VITE_API_PREFIX}/token/heartbeat`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    })
    .then(() => {
      // 后端已自动续期，更新本地过期时间记录
      setToken(currentToken)
    })
}

/**
 * 处理 Token 过期（401）：直接跳转登录页
 * 由于后端采用滑动过期机制，收到 401 说明 Token 已在 Redis 中失效，无法续期
 */
function handleTokenExpired(): Promise<any> {
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
// 行业规范：使用 Authorization: Bearer <token> 格式传递 Token（RFC 6750）
// 主动续期：请求前检查 Token 是否即将过期，若即将过期则先发心跳续期
service.interceptors.request.use(
  async (config) => {
    const token = getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
      // Token 即将过期且当前不是心跳请求本身，先发心跳续期
      if (isTokenExpiringSoon() && !config.url?.includes('/token/heartbeat')) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            await heartbeatRenew()
          } catch {
            // 静默失败，继续用当前 Token 发请求
          } finally {
            isRefreshing = false
          }
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ==================== 后台定时自动续期 ====================
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

/**
 * 启动 Token 自动续期定时器
 * 每隔一定时间检查 Token 是否即将过期，若即将过期则发心跳请求续期
 * 后端滑动过期机制会在每次有效请求时自动延长 Token 有效期
 * 续期频率（1分钟）远小于 Token 过期时间（2小时），确保 Token 永不过期
 */
export function startAutoRefreshToken(): void {
  stopAutoRefreshToken()
  autoRefreshTimer = setInterval(() => {
    if (!getToken() || isTokenExpired()) {
      // 无 Token 或已过期，停止定时器
      stopAutoRefreshToken()
      return
    }
    if (isTokenExpiringSoon() && !isRefreshing) {
      isRefreshing = true
      heartbeatRenew()
        .catch(() => {
          // 续期失败，清除登录状态
          removeToken()
          stopAutoRefreshToken()
          router.push('/login')
        })
        .finally(() => {
          isRefreshing = false
        })
    }
  }, getAutoRefreshInterval())
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
      ElMessage.error(message || '无权限访问')
      return Promise.reject(new Error(message || '无权限访问'))
    }
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    const { response } = error
    if (response) {
      if (response.status === 401) {
        return handleTokenExpired()
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
