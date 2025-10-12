# API 后端部署指南

本文档详细说明如何部署和配置 Cloudflare Workers 后端 API。

## 前置要求

1. **Cloudflare 账号**: [注册免费账号](https://dash.cloudflare.com/sign-up)
2. **Wrangler CLI**: Cloudflare Workers 的命令行工具
   ```bash
   npm install -g wrangler
   ```
3. **登录 Cloudflare**:
   ```bash
   wrangler login
   ```

## 步骤 1: 安装依赖

```bash
cd workers
npm install
```

## 步骤 2: 创建 D1 数据库

```bash
npm run db:create
```

这会输出类似以下内容:
```
✅ Successfully created DB 'playground-db'
📋 Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**复制 Database ID**，并更新 `workers/wrangler.toml` 文件:

```toml
[[d1_databases]]
binding = "DB"
database_name = "playground-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 替换为你的 ID
```

## 步骤 3: 运行数据库迁移（本地测试）

```bash
npm run db:migrate
```

这会在本地创建数据库表结构。

## 步骤 4: 创建 R2 存储桶

```bash
npm run r2:create
```

如果提示已存在，可以跳过此步骤。

## 步骤 5: 配置 Secrets

需要设置以下 secrets（加密环境变量）:

### JWT_SECRET (必需)
用于 JWT token 签名的密钥。建议使用随机生成的强密码:

```bash
# 方法 1: 使用 openssl 生成随机密钥
openssl rand -base64 32

# 方法 2: 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 然后设置到 Wrangler
wrangler secret put JWT_SECRET
# 粘贴生成的密钥
```

### ADMIN_EMAIL (可选)
管理员邮箱，用于创建初始管理员账号:

```bash
wrangler secret put ADMIN_EMAIL
# 输入: admin@yourdomain.com
```

### RESEND_API_KEY (可选)
用于发送邮件验证码的 API Key。如果不设置，验证码会在开发环境下直接返回:

```bash
wrangler secret put RESEND_API_KEY
# 输入你的 Resend API Key
```

## 步骤 6: 本地开发测试

```bash
npm run dev
```

API 将运行在 `http://localhost:8787`

### 测试 API

使用 curl 或 Postman 测试:

```bash
# 健康检查
curl http://localhost:8787/

# 请求验证码
curl -X POST http://localhost:8787/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"register"}'

# 注册用户
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"SecurePass123",
    "verification_code":"123456",
    "display_name":"Test User"
  }'
```

## 步骤 7: 部署到生产环境

### 7.1 运行生产数据库迁移

```bash
npm run db:migrate:prod
```

### 7.2 更新生产环境配置

编辑 `workers/wrangler.toml`，更新生产环境变量:

```toml
[env.production]
vars = {
  ENVIRONMENT = "production",
  ALLOWED_ORIGINS = "https://your-domain.com"
}
```

### 7.3 部署

```bash
npm run deploy
```

部署成功后会输出 Worker 的 URL:
```
✅ Deployed to https://playground-api.your-account.workers.dev
```

## 步骤 8: 配置前端

### 8.1 更新 Vite 配置

编辑 `vite.config.ts`，添加 API 代理:

```typescript
export default defineConfig({
  // ...
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',  // 本地开发
        changeOrigin: true,
      },
    },
  },
})
```

### 8.2 更新 Axios 配置

编辑 `src/api/axios-instance.ts`:

```typescript
export const axiosInstance = Axios.create({
  // 开发环境使用代理，生产环境使用完整 URL
  baseURL: import.meta.env.PROD
    ? 'https://playground-api.your-account.workers.dev'
    : '/api',
  timeout: 30000,
})
```

或者创建环境变量文件:

`.env.local`:
```
VITE_API_BASE_URL=http://localhost:8787
```

`.env.production`:
```
VITE_API_BASE_URL=https://playground-api.your-account.workers.dev
```

然后在代码中使用:
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
```

## 步骤 9: 创建初始管理员账号

两种方式:

### 方式 1: 通过 API 注册

1. 注册一个普通用户
2. 使用数据库命令提升为管理员:

```bash
wrangler d1 execute playground-db --remote --command \
  "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'"
```

### 方式 2: 直接在数据库创建

```bash
# 生成密码哈希（需要在 Workers 环境中运行）
# 或者先注册一个账号，然后复制 password_hash

wrangler d1 execute playground-db --remote --command \
  "INSERT INTO users (id, email, username, password_hash, display_name, role, email_verified, created_at, updated_at)
   VALUES (
     '$(uuidgen)',
     'admin@example.com',
     'admin',
     'your-password-hash',
     'Administrator',
     'admin',
     1,
     $(date +%s),
     $(date +%s)
   )"
```

## 测试清单

部署完成后，测试以下功能:

- [ ] 健康检查: `GET /`
- [ ] 请求验证码: `POST /api/auth/verify-code`
- [ ] 用户注册: `POST /api/auth/register`
- [ ] 用户登录: `POST /api/auth/login`
- [ ] 获取个人信息: `GET /api/auth/me`
- [ ] 发表评论: `POST /api/comments`
- [ ] 获取评论列表: `GET /api/comments/:postSlug`
- [ ] 发布动态: `POST /api/feed`
- [ ] 获取动态列表: `GET /api/feed`
- [ ] 记录访问: `POST /api/analytics/track`

## 监控和日志

### 查看日志

在 Cloudflare Dashboard:
1. 进入 Workers & Pages
2. 选择你的 Worker (`playground-api`)
3. 点击 "Logs" 标签页
4. 实时查看请求日志和错误

### 查看数据库

```bash
# 查看用户列表
wrangler d1 execute playground-db --remote --command \
  "SELECT id, email, username, role, email_verified FROM users"

# 查看评论数量
wrangler d1 execute playground-db --remote --command \
  "SELECT post_slug, COUNT(*) as count FROM comments GROUP BY post_slug"

# 查看访问统计
wrangler d1 execute playground-db --remote --command \
  "SELECT date, SUM(views) as total_views FROM analytics_daily GROUP BY date ORDER BY date DESC LIMIT 7"
```

## 故障排查

### 问题 1: 无法连接数据库

**错误**: `Database not found` 或 `D1_ERROR`

**解决**:
1. 检查 `wrangler.toml` 中的 `database_id` 是否正确
2. 确认已运行迁移: `npm run db:migrate:prod`
3. 检查 binding 名称是否为 `DB`

### 问题 2: JWT 验证失败

**错误**: `Invalid or expired token`

**解决**:
1. 确认已设置 `JWT_SECRET`: `wrangler secret put JWT_SECRET`
2. 检查 token 是否过期（默认 7 天）
3. 确认请求头格式: `Authorization: Bearer <token>`

### 问题 3: CORS 错误

**错误**: `Access-Control-Allow-Origin` error

**解决**:
1. 更新 `wrangler.toml` 中的 `ALLOWED_ORIGINS`
2. 确认包含前端域名，用逗号分隔
3. 重新部署: `npm run deploy`

### 问题 4: 速率限制

**错误**: `Too Many Requests`

**解决**:
- 等待 1 分钟后重试
- 或修改 `src/middleware/ratelimit.ts` 中的限制设置

## 安全建议

1. **JWT Secret**: 使用强随机密钥，定期轮换
2. **CORS**: 仅允许可信域名
3. **Rate Limiting**: 根据实际情况调整限流配置
4. **密码策略**: 可在 `src/utils/password.ts` 中加强密码要求
5. **输入验证**: 所有用户输入都经过 sanitize 和验证
6. **SQL 注入**: 使用参数化查询（已实现）

## 成本估算

基于 Cloudflare 免费层:

- **Workers**: 100,000 请求/天 → 约 300 万请求/月
- **D1**:
  - 5GB 存储
  - 500 万行读取/天
  - 10 万行写入/天
- **R2**:
  - 10GB 存储
  - 100 万 A 类操作/月
  - 1000 万 B 类操作/月

对于小型个人网站，完全在免费额度内。

## 下一步优化

- [ ] 实现邮件服务集成（Resend/SendGrid）
- [ ] 添加图片上传功能（R2）
- [ ] 实现 WebSocket 支持（Durable Objects）
- [ ] 添加缓存层（KV）
- [ ] 实现分布式速率限制
- [ ] 添加更多管理员功能
- [ ] 编写 API 测试

## 参考资料

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)
- [Hono 框架文档](https://hono.dev/)
