/**
 * 请求日志中间件
 * 打印原始请求信息用于调试
 */

import type { Context, Next } from 'hono'
import type { Env } from '../types'

/**
 * ANSI 颜色代码
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // 基础颜色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // 明亮颜色
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // 灰色
  gray: '\x1b[90m',
}

/**
 * 为 JSON 添加语法高亮
 */
function highlightJSON(obj: any, indent: number = 0): string {
  const indentStr = '  '.repeat(indent)
  const nextIndent = '  '.repeat(indent + 1)

  // null
  if (obj === null) {
    return `${colors.gray}null${colors.reset}`
  }

  // undefined
  if (obj === undefined) {
    return `${colors.gray}undefined${colors.reset}`
  }

  // 布尔值
  if (typeof obj === 'boolean') {
    return `${colors.brightBlue}${obj}${colors.reset}`
  }

  // 数字
  if (typeof obj === 'number') {
    return `${colors.brightYellow}${obj}${colors.reset}`
  }

  // 字符串
  if (typeof obj === 'string') {
    // 转义特殊字符
    const escaped = JSON.stringify(obj)
    return `${colors.brightGreen}${escaped}${colors.reset}`
  }

  // 数组
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `${colors.dim}[]${colors.reset}`
    }

    const items = obj.map((item, index) => {
      const isLast = index === obj.length - 1
      const comma = isLast ? '' : `${colors.dim},${colors.reset}`
      return `${nextIndent}${highlightJSON(item, indent + 1)}${comma}`
    })

    return `${colors.dim}[${colors.reset}\n${items.join('\n')}\n${indentStr}${colors.dim}]${colors.reset}`
  }

  // 对象
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)

    if (keys.length === 0) {
      return `${colors.dim}{}${colors.reset}`
    }

    const items = keys.map((key, index) => {
      const isLast = index === keys.length - 1
      const comma = isLast ? '' : `${colors.dim},${colors.reset}`
      const keyStr = `${colors.brightCyan}"${key}"${colors.reset}`
      const valueStr = highlightJSON(obj[key], indent + 1)
      return `${nextIndent}${keyStr}${colors.dim}: ${colors.reset}${valueStr}${comma}`
    })

    return `${colors.dim}{${colors.reset}\n${items.join('\n')}\n${indentStr}${colors.dim}}${colors.reset}`
  }

  // 其他类型（函数、Symbol等）
  return `${colors.gray}${String(obj)}${colors.reset}`
}

/**
 * 彩色日志输出
 */
function colorLog(emoji: string, title: string, data: any, color: string = colors.brightCyan) {
  console.log(`${color}${colors.bold}=== ${emoji} ${title} ===${colors.reset}`)
  console.log(highlightJSON(data))
  console.log(`${color}${colors.dim}${'='.repeat(title.length + 10)}${colors.reset}`)
}

export interface LoggerOptions {
  logHeaders?: boolean
  logBody?: boolean
  maxBodyLength?: number
  includePaths?: string[]
  excludePaths?: string[]
}

export interface RequestLogInfo {
  timestamp: string
  method: string
  url: string
  path: string
  query: Record<string, string>
  userAgent?: string
  contentType?: string
  contentLength?: string
  ip: string
  country?: string
  region?: string
  city?: string
  authorization?: {
    type: string
    tokenLength: number
  }
  headers?: Record<string, string>
  body?: any
  bodyError?: string
}

export interface ResponseLogInfo {
  timestamp: string
  status: number
  statusText: string
  processingTime: string
  responseHeaders: Record<string, string>
  body?: any
  bodyError?: string
}

const defaultOptions: LoggerOptions = {
  logHeaders: true,
  logBody: true,
  maxBodyLength: 1000,
  includePaths: [], // 空数组表示包含所有路径
  excludePaths: ['/docs', '/openapi.json', '/favicon.ico'], // 排除静态资源
}

export function createLogger(options: LoggerOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const startTime = Date.now()
    const url = new URL(c.req.url)
    const path = url.pathname + url.search

    // 检查是否应该记录此路径
    const shouldLog =
      (opts.includePaths && opts.includePaths.length === 0 || opts.includePaths?.some(p => path.startsWith(p))) &&
      !opts.excludePaths?.some(p => path.startsWith(p))

    if (!shouldLog) {
      await next()
      return
    }

    // 收集请求信息
    const requestInfo: RequestLogInfo = {
      timestamp: new Date().toISOString(),
      method: c.req.method,
      url: c.req.url,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: c.req.header('User-Agent'),
      contentType: c.req.header('Content-Type'),
      contentLength: c.req.header('Content-Length'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      country: c.req.header('CF-IPCountry'),
      region: c.req.header('CF-IPRegion'),
      city: c.req.header('CF-IPCITY'),
    }

    // 添加认证信息
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      requestInfo.authorization = {
        type: authHeader.split(' ')[0],
        tokenLength: authHeader.split(' ')[1]?.length || 0,
        // 不直接记录令牌内容，只记录元数据
      }
    }

    // 添加请求头
    if (opts.logHeaders) {
      const allHeaders = c.req.header()

      if (allHeaders && typeof allHeaders === 'object') {
        // 使用 Object.entries() 遍历所有头部
        requestInfo.headers = Object.entries(allHeaders).reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, string>)
      }
    }

    // 添加请求体
    // 使用 clone() 来读取 body，这样不会影响后续 handler 的读取
    if (opts.logBody && c.env.ENVIRONMENT === 'development' && ['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      try {
        const contentType = c.req.header('Content-Type') || ''

        // 克隆请求以读取 body，不影响原始请求
        const clonedReq = c.req.raw.clone()

        if (contentType.includes('application/json')) {
          const body = await clonedReq.json()
          const bodyStr = JSON.stringify(body, null, 2)
          const maxLength = opts.maxBodyLength ?? 1000

          if (bodyStr.length > maxLength) {
            requestInfo.body = bodyStr.substring(0, maxLength) + '...[truncated]'
          } else {
            requestInfo.body = body
          }

          // 对于敏感信息进行脱敏
          if (requestInfo.body) {
            requestInfo.body = maskSensitiveData(requestInfo.body)
          }
        } else if (contentType.includes('text/')) {
          const body = await clonedReq.text()
          const maxLength = opts.maxBodyLength ?? 1000

          if (body.length > maxLength) {
            requestInfo.body = body.substring(0, maxLength) + '...[truncated]'
          } else {
            requestInfo.body = body
          }
        } else {
          requestInfo.body = `[Binary data: ${contentType}]`
        }
      } catch (error) {
        requestInfo.bodyError = `Failed to read body: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // 打印请求信息
    colorLog('📥', 'INCOMING REQUEST', requestInfo, colors.brightCyan)

    // 继续处理请求
    await next()

    // 计算处理时间
    const endTime = Date.now()
    const processingTime = endTime - startTime

    // 收集响应信息
    const responseInfo: ResponseLogInfo = {
      timestamp: new Date().toISOString(),
      status: c.res.status,
      statusText: getStatusText(c.res.status),
      processingTime: `${processingTime}ms`,
      responseHeaders: {},
    }
    // 添加响应头
    if (opts.logHeaders) {
      const headers: Record<string, string> = {}
      c.res.headers.forEach((value, key) => {
        headers[key] = value
      })
      responseInfo.responseHeaders = headers
    }

    // 添加响应体
    if (opts.logBody && c.env.ENVIRONMENT === 'development' && c.res) {
      try {
        const contentType = c.res.headers.get('Content-Type') || ''

        // 克隆响应以读取 body，不影响原始响应
        const clonedRes = c.res.clone()

        if (contentType.includes('application/json')) {
          const body = await clonedRes.json()
          const bodyStr = JSON.stringify(body, null, 2)
          const maxLength = opts.maxBodyLength ?? 1000

          if (bodyStr.length > maxLength) {
            responseInfo.body = bodyStr.substring(0, maxLength) + '...[truncated]'
          } else {
            responseInfo.body = body
          }

          // 对敏感信息进行脱敏
          if (responseInfo.body) {
            responseInfo.body = maskSensitiveData(responseInfo.body)
          }
        } else if (contentType.includes('text/')) {
          const body = await clonedRes.text()
          const maxLength = opts.maxBodyLength ?? 1000

          if (body.length > maxLength) {
            responseInfo.body = body.substring(0, maxLength) + '...[truncated]'
          } else {
            responseInfo.body = body
          }
        } else if (contentType.includes('application/octet-stream') ||
                   contentType.includes('image/') ||
                   contentType.includes('video/') ||
                   contentType.includes('audio/')) {
          responseInfo.body = `[Binary data: ${contentType}]`
        } else if (contentType) {
          // 其他未知类型，尝试读取为文本
          const body = await clonedRes.text()
          const maxLength = opts.maxBodyLength ?? 1000

          if (body.length > maxLength) {
            responseInfo.body = body.substring(0, maxLength) + '...[truncated]'
          } else {
            responseInfo.body = body
          }
        }
      } catch (error) {
        responseInfo.bodyError = `Failed to read response body: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // 打印响应信息
    const responseColor = c.res.status >= 400 ? colors.brightRed :
                         c.res.status >= 300 ? colors.brightYellow :
                         colors.brightGreen
    colorLog('📤', 'OUTGOING RESPONSE', responseInfo, responseColor)
    console.log('') // 空行分隔
  }
}

/**
 * 脱敏敏感数据
 */
function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'auth',
    'credential',
    'accessToken',
    'refreshToken',
    'jwt',
    'bearer'
  ]

  const masked = Array.isArray(obj) ? [...obj] : { ...obj }

  for (const key in masked) {
    if (typeof key === 'string' && sensitiveFields.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      masked[key] = '[MASKED]'
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  }

  return masked
}

/**
 * 获取状态码对应的文本
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  }

  return statusTexts[status] || 'Unknown'
}

// 导出默认实例
export const logger = createLogger()