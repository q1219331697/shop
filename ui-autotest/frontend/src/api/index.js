import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

// 案例管理 API
export const caseApi = {
  getList: (params) => request.get('/cases', { params }),
  getDetail: (id) => request.get('/cases/' + id),
  create: (data) => request.post('/cases', data),
  update: (id, data) => request.put('/cases/' + id, data),
  delete: (id) => request.delete('/cases/' + id),
  batchDelete: (ids) => request.post('/cases/batch-delete', { ids }),
}

// 流程管理 API
export const flowApi = {
  getList: (params) => request.get('/flows', { params }),
  getDetail: (id) => request.get('/flows/' + id),
  create: (data) => request.post('/flows', data),
  update: (id, data) => request.put('/flows/' + id, data),
  delete: (id) => request.delete('/flows/' + id),
}

// 执行管理 API
export const execApi = {
  getList: (params) => request.get('/executions', { params }),
  getDetail: (id) => request.get('/executions/' + id),
  create: (data) => request.post('/executions', data),
}

// AI生成 API
export const aiApi = {
  generate: (data) => request.post('/ai/generate', data),
}

// 统计 API
export const statsApi = {
  getStats: () => request.get('/stats'),
}

export default request
