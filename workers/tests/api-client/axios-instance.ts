import Axios, { AxiosRequestConfig, AxiosError } from 'axios'

/**
 * API 客户端配置
 * 用于 Orval 生成的纯 Axios 客户端（不依赖 React）
 */

// 当前认证 Token（内存存储，适合测试环境）
let currentToken: string | null = null

/**
 * Axios 实例配置
 */
export const axiosInstance = Axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8787/',
  timeout: 30000, // 30 秒超时
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器：自动添加认证 Token
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // 如果有 token，自动添加到请求头
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`
    }

    // 开发环境日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
        authenticated: !!currentToken,
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ [API] Request error:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器：处理错误和日志
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error: AxiosError) => {
    // 错误处理
    if (error.response) {
      const status = error.response.status
      const message = (error.response.data as any)?.message || error.message

      console.error(`❌ [API] ${status} ${error.config?.url}:`, message)

      // 处理特定错误码
      switch (status) {
        case 401:
          console.warn('⚠️  Unauthorized - Token 可能已失效')
          break
        case 403:
          console.warn('⚠️  Forbidden - 无权限访问')
          break
        case 404:
          console.warn('⚠️  Not Found - 资源不存在')
          break
        case 500:
          console.warn('⚠️  Server Error - 服务器错误')
          break
      }
    } else if (error.request) {
      console.error('❌ [API] Network error - 无响应')
      console.warn('⚠️  检查 API 服务器是否运行')
    } else {
      console.error('❌ [API] Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * Orval Mutator
 * 这是 Orval 生成代码使用的函数
 */
export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance.request<T>(config).then(({ data }) => data)
}

/**
 * Token 管理工具
 */
export const authManager = {
  /**
   * 设置认证 Token
   * @param token JWT token
   */
  setToken: (token: string) => {
    currentToken = token
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [Auth] Token 已设置')
    }
  },

  /**
   * 获取当前 Token
   */
  getToken: (): string | null => {
    return currentToken
  },

  /**
   * 清除认证 Token
   */
  clearToken: () => {
    currentToken = null
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 [Auth] Token 已清除')
    }
  },

  /**
   * 检查是否已认证
   */
  isAuthenticated: (): boolean => {
    return !!currentToken
  },
}

/**
 * 导出默认实例（兼容性）
 */
export default customAxios
