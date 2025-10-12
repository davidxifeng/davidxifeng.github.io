# 请求日志功能

## 📋 概述

我们已经成功在 Cloudflare Workers API 中添加了完整的请求日志功能，用于调试和监控API请求。这个功能通过中间件实现，可以记录所有传入和传出的HTTP请求的详细信息。

## 🎯 实现的功能

### ✅ **基础日志中间件**（当前使用）
- **请求信息**：HTTP方法、URL、用户代理、时间戳
- **响应信息**：状态码、处理时间
- **简洁输出**：适合快速调试和监控

### 🚀 **高级日志中间件**（备用选项）
- **完整请求头**：记录所有HTTP头部信息
- **请求体记录**：支持JSON和文本内容，自动截断长内容
- **敏感数据脱敏**：自动遮蔽密码、令牌等敏感信息
- **地理位置信息**：记录IP地址、国家、地区、城市（Cloudflare提供）
- **认证信息**：记录JWT令牌类型和长度，不记录实际令牌内容
- **性能监控**：计算每个请求的处理时间
- **灵活配置**：支持路径过滤、头部控制等

## 🔧 使用方法

### 当前实现（基础版本）

日志功能已经集成到 `src/index.ts` 中：

```typescript
// Add simple logging middleware for debugging
app.use('*', async (c, next) => {
  const startTime = Date.now()
  const method = c.req.method
  const url = c.req.url
  const userAgent = c.req.header('User-Agent') || 'Unknown'

  console.log(`=== 📥 ${method} ${url} ===`)
  console.log(`User-Agent: ${userAgent}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  await next()

  const processingTime = Date.now() - startTime
  const status = c.res.status

  console.log(`=== 📤 RESPONSE ${status} (${processingTime}ms) ===`)
  console.log('')
})
```

### 高级版本使用方法

如需使用更详细的日志功能，可以替换为：

```typescript
import { createLogger } from './middleware/logger'

app.use('*', createLogger({
  logHeaders: true,
  logBody: true,
  maxBodyLength: 2000,
  includePaths: ['/api'], // 只记录 API 请求
  excludePaths: ['/docs', '/openapi.json', '/favicon.ico'],
}))
```

## 📊 日志输出示例

### 基础日志输出
```
=== 📥 GET http://localhost:8787/ ===
User-Agent: curl/7.79.1
Timestamp: 2023-12-07T10:30:45.123Z
=== 📤 RESPONSE 200 (5ms) ===
```

### 高级日志输出示例
```json
=== 📥 INCOMING REQUEST ===
{
  "timestamp": "2023-12-07T10:30:45.123Z",
  "method": "POST",
  "url": "http://localhost:8787/api/auth/login",
  "path": "/api/auth/login",
  "query": {},
  "userAgent": "curl/7.79.1",
  "contentType": "application/json",
  "ip": "192.168.1.100",
  "country": "US",
  "authorization": {
    "type": "Bearer",
    "tokenLength": 180
  },
  "headers": {
    "host": "localhost:8787",
    "user-agent": "curl/7.79.1",
    "accept": "*/*",
    "content-type": "application/json",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "body": {
    "username": "testuser",
    "password": "[MASKED]"
  }
}
=========================

=== 📤 OUTGOING RESPONSE ===
{
  "timestamp": "2023-12-07T10:30:45.128Z",
  "status": 200,
  "statusText": "OK",
  "processingTime": "5ms",
  "responseHeaders": {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  }
}
===========================
```

## 🔒 安全特性

### 敏感数据脱敏
高级日志中间件会自动检测并脱敏以下类型的敏感数据：

- `password`, `token`, `secret`, `key`
- `authorization`, `auth`, `credential`
- `accessToken`, `refreshToken`, `jwt`, `bearer`

脱敏后的值将显示为 `[MASKED]`。

### JWT令牌处理
对于Authorization头中的JWT令牌：
- 记录令牌类型（如 "Bearer"）
- 记录令牌长度（用于调试）
- **不记录**实际令牌内容

## ⚙️ 配置选项

### LoggerOptions 接口
```typescript
interface LoggerOptions {
  logHeaders?: boolean        // 是否记录请求头
  logBody?: boolean          // 是否记录请求体
  maxBodyLength?: number     // 请求体最大长度
  includePaths?: string[]    // 包含的路径列表
  excludePaths?: string[]    // 排除的路径列表
}
```

### 默认配置
```typescript
{
  logHeaders: true,
  logBody: true,
  maxBodyLength: 1000,
  includePaths: [], // 空数组表示包含所有路径
  excludePaths: ['/docs', '/openapi.json', '/favicon.ico'],
}
```

## 🚀 快速开始

### 1. 使用基础日志功能（当前已启用）
API请求会自动记录基础信息：
```bash
curl http://localhost:8787/api/auth/me
```

### 2. 启用高级日志功能
修改 `src/index.ts`：
```typescript
// 替换现有的日志中间件
import { createLogger } from './middleware/logger'

app.use('*', createLogger({
  logHeaders: true,
  logBody: true,
  maxBodyLength: 2000,
  includePaths: ['/api'],
  excludePaths: ['/docs', '/openapi.json'],
}))
```

### 3. 测试日志输出
```bash
# 测试GET请求
curl http://localhost:8787/

# 测试POST请求
curl -X POST http://localhost:8787/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "register"}'

# 测试带认证的请求
curl http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer your-jwt-token"
```

## 📁 相关文件

- `src/middleware/logger.ts` - 高级日志中间件实现
- `src/index.ts` - 当前集成的基础日志中间件
- `docs/REQUEST_LOGGING.md` - 本文档

## 🎯 使用场景

### 🛠️ 开发调试
- 查看API请求详情
- 验证请求头和参数
- 调试认证问题

### 🔍 问题排查
- 分析请求失败原因
- 检查请求格式
- 监控API性能

### 📈 监控分析
- 统计API使用情况
- 识别热门端点
- 监控响应时间

## ⚠️ 注意事项

1. **性能影响**：高级日志功能可能会影响API响应时间
2. **存储成本**：生产环境中要考虑日志存储成本
3. **隐私保护**：确保敏感信息已正确脱敏
4. **日志轮转**：生产环境需要配置日志轮转策略

## 🔮 扩展建议

1. **日志聚合**：集成ELK Stack或类似工具
2. **实时监控**：添加告警功能
3. **分析仪表板**：创建日志分析仪表板
4. **性能优化**：添加异步日志写入
5. **结构化日志**：使用JSON格式便于解析