/**
 * HTTP 传输层（仅运行在浏览器）
 *
 * 基于 axios 的统一封装：注入 Token、解包业务 data、统一错误处理。
 * 本模块只服务于浏览器，因此可以放心直接使用 element-plus / storage，
 * 无需为任何非浏览器环境做兼容（测试侧不 import 本模块，见 @/api/endpoints 说明）。
 *
 * 会话清理与页面跳转不在这里做：本模块只把失败响应归一为「带业务码标记的错误」，
 * 由路由守卫统一决定是否清理会话、是否跳转登录页（见 @/router/guards）。
 *
 * 请求地址由 @/api/endpoints 提供（相对路径），前缀由下方 baseURL 补全。
 */
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

import { getToken } from '@/utils/storage'

import { SUCCESS, UNAUTHORIZED, FORBIDDEN } from './resultCode'

/** 携带业务码的错误，供上层区分「未认证 / 未授权 / 业务失败」 */
export type BizError = Error & { bizCode?: string }

/** 为错误附加业务码标记（仅在抛出点标记，不做任何清理动作） */
function withBizCode(error: Error, code: string): BizError {
  return Object.assign(error, { bizCode: code })
}

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
    // 未登录或登录已过期：只标记错误类型，会话清理与跳转由路由守卫统一处理
    if (code === UNAUTHORIZED) {
      throw withBizCode(new Error(message || '未登录或登录已过期'), code)
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
    const status: number | undefined = error.response?.status
    const errorMsg = error.response?.data?.message || error.message || '请求失败'

    // HTTP 401（网关等中间层返回）：同样只标记，交由路由守卫统一处理
    if (status === 401) {
      return Promise.reject(withBizCode(error, UNAUTHORIZED))
    }

    if (status === 403) {
      ElMessage.error(errorMsg || '无权限访问')
    } else if (error.response) {
      ElMessage.error(`请求失败 (${status})：${errorMsg}`)
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
 *   const data = await request.post<RoleItem[]>(endpoints.role.list, params)
 *
 * 为什么只保留 post？
 *   全站已统一为「POST + JSON」：路径末段表达动作语义，全部入参（含 id / ids / 分页 / 查询条件）
 *   走 body。GET / PUT / DELETE 已无使用场景，保留别名只会诱导写法回退。
 *   唯一的例外是测试侧的 apiClient（用 Playwright 原生 API 直连，不经过本模块）。
 *
 * 为什么走 instance.request + 第二泛型参数，而不是直接用 axios 的 post<T>？
 *   响应拦截器已解包 data，业务层希望方法返回 T 而非 AxiosResponse<T>。
 *   但 axios 的 post/... 只把 T 当作「响应体类型」，返回类型写死为 AxiosResponse<T>，
 *   无法表达「拦截器已解包」。而 axios.request 提供了第二泛型参数 R（最终返回类型），
 *   于是用 instance.request<unknown, T> 把返回收敛为 T —— 既不需要自定义类型，也不需要 as 断言。
 */
const request = {
  post: <T>(url: string, data?: unknown) =>
    instance.request<unknown, T>({ url, method: 'POST', data }),
}

export default request
