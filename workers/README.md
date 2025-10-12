# Playground API - Cloudflare Workers Backend

基于 Cloudflare Workers + D1 + R2 的全功能后端 API，为静态网站提供动态功能。

## 功能特性

- ✅ **用户认证**: JWT 认证，注册/登录，邮箱验证码
- ✅ **博客评论**: 嵌套评论，点赞，审核
- ✅ **动态 Feed**: 类似 Twitter 的时间线，发布/点赞/删除
- ✅ **访客统计**: 页面访问追踪，统计分析面板
- ✅ **权限管理**: 管理员和普通用户角色
- ✅ **OpenAPI 文档**: 自动生成的交互式 API 文档
- ✅ **CORS 支持**: 跨域资源共享配置

## 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (轻量级 Web 框架)
- **OpenAPI**: Chanfana (自动文档生成)
- **Database**: D1 (SQLite)
- **Storage**: R2 (对象存储)
- **Auth**: JWT (jose 库)
- **Validation**: Zod

## 快速开始

### 1. 安装依赖

```bash
cd workers
npm install
```

### 2. 创建 D1 数据库

```bash
npm run db:create
```

复制输出的 `database_id`，更新 `wrangler.toml` 中的 `database_id` 字段。

### 3. 运行数据库迁移

```bash
npm run db:migrate
```

### 4. 创建 R2 存储桶

```bash
npm run r2:create
```

### 5. 设置 Secrets

```bash
# JWT 密钥 (随机生成)
wrangler secret put JWT_SECRET

# 管理员邮箱 (可选)
wrangler secret put ADMIN_EMAIL

# 邮件服务 API Key (可选，用于发送验证码)
wrangler secret put RESEND_API_KEY
```

### 6. 本地开发

```bash
npm run dev
```

API 将运行在 `http://localhost:8787`

**OpenAPI 文档**: http://localhost:8787/docs

### 7. 部署到 Cloudflare

```bash
npm run deploy
```

## API 文档

### 交互式文档

启动服务后访问 http://localhost:8787/docs 查看：
- 完整的 API 文档
- 交互式测试界面
- 请求/响应示例
- Schema 验证规则

### 认证 API

#### POST /api/auth/verify-code
请求验证码

**Request:**
```json
{
  "email": "user@example.com",
  "type": "register"
}
```

**Response:**
```json
{
  "message": "Verification code sent to your email",
  "dev_code": "123456"  // 仅开发环境
}
```

#### POST /api/auth/register
注册新用户

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "verification_code": "123456",
  "display_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "user"
  }
}
```

#### POST /api/auth/login
登录

**Request:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

#### GET /api/auth/me
获取当前用户信息（需要认证）

**Headers:**
```
Authorization: Bearer <token>
```

### 评论 API

#### GET /api/comments/:postSlug
获取文章评论

**Query Params:**
- `page`: 页码 (default: 1)
- `limit`: 每页数量 (default: 20, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "post_slug": "my-blog-post",
      "content": "Great article!",
      "user": {
        "username": "johndoe",
        "display_name": "John Doe",
        "avatar_url": "https://..."
      },
      "likes_count": 5,
      "created_at": 1704067200,
      "replies": []
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "has_more": false
}
```

#### POST /api/comments
发表评论（需要认证）

**Request:**
```json
{
  "post_slug": "my-blog-post",
  "content": "Great article!",
  "parent_id": "uuid"  // 可选，用于回复评论
}
```

#### PUT /api/comments/:id
编辑评论（仅作者和管理员）

#### DELETE /api/comments/:id
删除评论（仅作者和管理员）

#### POST /api/comments/:id/like
点赞/取消点赞评论

### Feed API

#### GET /api/feed
获取公开动态列表

**Query Params:**
- `page`: 页码
- `limit`: 每页数量

#### POST /api/feed
发布动态（需要认证）

**Request:**
```json
{
  "content": "Hello world!",
  "images": ["https://r2.../image1.jpg"],
  "visibility": "public"
}
```

#### DELETE /api/feed/:id
删除动态（仅作者和管理员）

#### POST /api/feed/:id/like
点赞/取消点赞动态

### 统计 API

#### POST /api/analytics/track
记录页面访问（公开接口）

**Request:**
```json
{
  "path": "/blog/my-post",
  "referrer": "https://google.com"
}
```

#### GET /api/analytics/stats
获取统计数据（仅管理员）

#### GET /api/analytics/popular
获取热门页面（公开接口）

## 速率限制

推荐使用 Cloudflare Dashboard 配置 Rate Limiting：

1. 进入 Cloudflare Dashboard
2. 选择 Workers & Pages
3. 选择你的 Worker
4. 进入 Settings > Rate Limiting
5. 配置规则，例如：
   - `/api/auth/*` - 10 请求/分钟
   - `/api/*` - 100 请求/分钟

参考：https://developers.cloudflare.com/workers/configuration/rate-limiting/

## 数据库管理

### 查看数据

```bash
# 本地数据库
wrangler d1 execute playground-db --local --command "SELECT * FROM users"

# 生产数据库
wrangler d1 execute playground-db --remote --command "SELECT * FROM users"
```

### 创建新迁移

1. 在 `src/db/migrations/` 创建新文件：`000X_description.sql`
2. 编写 SQL 语句
3. 运行迁移：`npm run db:migrate` (本地) 或 `npm run db:migrate:prod` (生产)

## 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
ENVIRONMENT = "development"
ALLOWED_ORIGINS = "http://localhost:3000,https://your-domain.com"
```

Secrets (通过 `wrangler secret put` 设置):
- `JWT_SECRET`: JWT 签名密钥
- `ADMIN_EMAIL`: 管理员邮箱（可选）
- `RESEND_API_KEY`: 邮件服务 API Key（可选）

## 生产部署清单

- [ ] 更新 `wrangler.toml` 中的 `database_id`
- [ ] 更新 `ALLOWED_ORIGINS` 为生产域名
- [ ] 设置所有必要的 Secrets
- [ ] 运行生产数据库迁移：`npm run db:migrate:prod`
- [ ] 创建 R2 存储桶（生产环境）
- [ ] 配置 Cloudflare Rate Limiting
- [ ] 部署：`npm run deploy`
- [ ] 测试所有 API 端点
- [ ] 配置前端 API 基础 URL

## Cloudflare 免费额度

- **Workers**: 100,000 请求/天
- **D1**: 5GB 存储, 500 万行读取/天
- **R2**: 10GB 存储, 100 万 A 类操作/月

## 故障排查

### Workers 无法连接数据库
- 检查 `wrangler.toml` 中的 `database_id` 是否正确
- 确认已运行数据库迁移

### CORS 错误
- 检查 `ALLOWED_ORIGINS` 环境变量
- 确认前端请求包含正确的 Origin 头

### JWT 验证失败
- 确认已设置 `JWT_SECRET`
- 检查 token 是否过期
- 验证 Authorization 头格式: `Bearer <token>`

### 全局作用域错误
如果遇到 "Disallowed operation called within global scope" 错误：
- 确保没有在全局作用域使用异步 I/O
- 不要使用 `setInterval` 或 `setTimeout` 在全局
- 所有异步操作应在 handler 中执行

## 开发建议

1. **本地开发**: 使用 `--local` 标志操作本地 D1 数据库
2. **日志**: Workers 日志在 Cloudflare Dashboard 查看
3. **测试**: 使用 OpenAPI 文档界面测试 API
4. **监控**: 在 Cloudflare Dashboard 查看请求统计和错误日志

## 架构说明

### OpenAPI 端点
使用 Chanfana 框架，自动生成文档：
```typescript
import { OpenAPIRoute } from 'chanfana'

export class MyEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['MyTag'],
    summary: 'My endpoint',
    // ...
  }

  async handle(c: Context) {
    // 实现逻辑
  }
}
```

### 中间件
- `requireAuth`: 需要认证
- `optionalAuth`: 可选认证
- `requireAdmin`: 需要管理员权限

### 类型安全
使用 Zod schemas 进行验证：
```typescript
import { z } from 'zod'
import { Str, Num, Bool } from 'chanfana'

export const MySchema = z.object({
  name: Str({ example: 'John' }),
  age: Num({ minimum: 0 }),
  active: Bool(),
})
```

## 下一步

- [ ] 集成邮件服务（Resend/SendGrid）发送验证码
- [ ] 实现图片上传到 R2
- [ ] 添加 WebSocket 支持（使用 Durable Objects）
- [ ] 添加缓存层（KV）
- [ ] 添加更多管理员功能
- [ ] 编写单元测试

## 许可证

MIT
