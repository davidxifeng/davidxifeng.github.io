# 快速入门指南

这份指南将帮助你快速启动和运行整个项目（前端 + 后端）。

## 🚀 5 分钟快速启动

### 前提条件

确保你已安装：
- [Bun](https://bun.sh/) (JavaScript 运行时)
- [Node.js](https://nodejs.org/) 18+ (用于 Wrangler)
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up) (免费)

### 第 1 步: 启动后端（Cloudflare Workers）

```bash
# 1. 进入 workers 目录
cd workers

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare（首次使用）
wrangler login

# 4. 创建 D1 数据库
npm run db:create
# 复制输出的 database_id，更新 wrangler.toml

# 5. 运行数据库迁移
npm run db:migrate

# 6. 设置 JWT Secret
wrangler secret put JWT_SECRET
# 输入任意强密码（建议使用: openssl rand -base64 32）

# 7. 启动开发服务器
npm run dev
# Workers API 运行在: http://localhost:8787
```

### 第 2 步: 启动前端

在另一个终端窗口：

```bash
# 1. 回到项目根目录
cd ..

# 2. 安装依赖（如果还没安装）
bun install

# 3. 启动开发服务器
bun run dev
# 前端运行在: http://localhost:3000
```

### 第 3 步: 测试功能

1. 打开浏览器访问 `http://localhost:3000`
2. 尝试注册一个新账号：
   - 导航到注册页面
   - 填写邮箱、用户名、密码
   - 在开发环境下，验证码会直接在 Workers 控制台显示
3. 登录后即可测试评论和 Feed 功能

## 📁 项目结构

```
playground/
├── workers/              # Cloudflare Workers 后端
│   ├── src/
│   │   ├── handlers/     # API 处理器
│   │   ├── middleware/   # 中间件
│   │   ├── db/          # 数据库 schema 和迁移
│   │   ├── utils/       # 工具函数
│   │   └── index.ts     # 主入口
│   ├── wrangler.toml    # Wrangler 配置
│   └── package.json
│
├── src/
│   ├── routes/          # 页面路由
│   ├── components/      # React 组件
│   │   └── comments/    # 评论组件
│   ├── stores/          # Zustand stores
│   │   └── authStore.ts # 认证状态管理
│   └── api/             # API 客户端
│
└── docs/                # 文档
    ├── API_BACKEND_SETUP.md  # 后端部署指南
    └── QUICK_START.md        # 本文件
```

## 🔧 常用命令

### 后端（Workers）

```bash
cd workers

# 开发
npm run dev                    # 启动本地开发服务器

# 数据库
npm run db:migrate             # 运行迁移（本地）
npm run db:migrate:prod        # 运行迁移（生产）
npm run db:console             # 打开数据库控制台

# 部署
npm run deploy                 # 部署到 Cloudflare
```

### 前端

```bash
# 开发
bun run dev                    # 启动开发服务器

# 构建
bun run build                  # 构建生产版本
bun run serve                  # 预览生产构建

# 测试
bun run test                   # 运行测试
```

## 🎯 核心功能

### 1. 用户认证

```typescript
import { useAuthStore } from '@/stores/authStore'

function MyComponent() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  // 注册/登录后调用
  setAuth(token, userData)

  // 登出
  clearAuth()
}
```

### 2. 评论系统

```tsx
import { CommentSection } from '@/components/comments/CommentSection'

function BlogPost() {
  return (
    <div>
      <article>{/* 博客内容 */}</article>
      <CommentSection postSlug="my-blog-post" />
    </div>
  )
}
```

### 3. API 调用

```typescript
import { axiosInstance } from '@/api/axios-instance'

// GET 请求
const { data } = await axiosInstance.get('/api/feed')

// POST 请求（自动添加 Authorization 头）
await axiosInstance.post('/api/comments', {
  post_slug: 'my-post',
  content: 'Great article!',
})
```

## 🔐 创建管理员账号

有两种方式：

### 方式 1: 注册后提升权限

```bash
# 1. 通过前端注册一个普通账号

# 2. 使用 Wrangler 提升为管理员
cd workers
wrangler d1 execute playground-db --local --command \
  "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'"
```

### 方式 2: 设置环境变量

```bash
# 设置管理员邮箱
wrangler secret put ADMIN_EMAIL
# 输入: admin@yourdomain.com

# 用这个邮箱注册，自动获得管理员权限
```

## 📊 查看数据

```bash
cd workers

# 查看所有用户
wrangler d1 execute playground-db --local --command \
  "SELECT id, email, username, role FROM users"

# 查看评论
wrangler d1 execute playground-db --local --command \
  "SELECT * FROM comments ORDER BY created_at DESC LIMIT 10"

# 查看访问统计
wrangler d1 execute playground-db --local --command \
  "SELECT path, SUM(views) as total FROM analytics_daily GROUP BY path"
```

## 🚨 故障排查

### 问题：Workers 启动失败

**检查**:
1. 是否安装了 Node.js 18+？
2. 是否运行了 `npm install`？
3. 是否登录了 Cloudflare？`wrangler whoami`

### 问题：前端无法连接 API

**检查**:
1. Workers 是否在运行？访问 `http://localhost:8787`
2. Vite 代理是否配置正确？查看 `vite.config.ts`
3. 浏览器控制台是否有 CORS 错误？

### 问题：数据库错误

**解决**:
```bash
cd workers

# 重置本地数据库
rm -rf .wrangler
npm run db:migrate
```

### 问题：JWT 验证失败

**解决**:
```bash
# 确认已设置 JWT_SECRET
wrangler secret list

# 如果没有，设置一个
wrangler secret put JWT_SECRET
```

## 📝 下一步

1. **添加邮件服务**: 集成 Resend 发送真实的验证码邮件
2. **实现图片上传**: 使用 R2 存储用户上传的图片
3. **创建管理后台**: 评论审核、用户管理等功能
4. **优化 UI**: 添加更多动画和交互效果
5. **部署到生产**: 使用 Cloudflare Pages 部署前端

## 📚 相关文档

- [API 后端部署指南](./API_BACKEND_SETUP.md) - 详细的后端配置和部署说明
- [Workers README](../workers/README.md) - Workers 项目详细文档
- [项目 README](../README.md) - 项目总览

## 💡 提示

- **开发环境**: 验证码会在 Workers 控制台显示，无需真实邮件服务
- **数据持久化**: 本地开发使用 `.wrangler` 目录存储数据
- **热重载**: 修改代码后，前端和后端都会自动重载
- **日志查看**: Workers 日志在运行 `npm run dev` 的终端显示

## 🎉 成功！

如果你看到这里，说明已经成功启动了项目！现在可以：

- 探索现有功能
- 修改代码看效果
- 开始开发新功能
- 部署到生产环境

有问题？查看 [API_BACKEND_SETUP.md](./API_BACKEND_SETUP.md) 获取更多帮助。
