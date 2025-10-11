# API 客户端开发工作流

本文档描述了使用 OpenAPI Schema 生成类型安全的 API 客户端的完整工作流程。

## 🚀 快速开始

### 1. 下载 OpenAPI Schema

```bash
# 下载 Schema（如果本地不存在）
bun run fetch:api

# 强制重新下载
bun run fetch:api:force

# 检查本地 Schema 文件
bun run fetch:api:check
```

### 2. 生成 API 客户端

```bash
# 生成 API 客户端代码
bun run generate:api

# 监听模式（开发时推荐）
bun run generate:api:watch
```

### 3. 一键刷新

```bash
# 重新下载 Schema 并生成客户端
bun run api:refresh
```

## 📋 命令详解

### 下载命令

| 命令 | 描述 |
|------|------|
| `bun run fetch:api` | 下载 OpenAPI Schema（仅当本地文件不存在时） |
| `bun run fetch:api:force` | 强制重新下载，覆盖本地文件 |
| `bun run fetch:api:check` | 检查本地 Schema 文件状态 |

### 生成命令

| 命令 | 描述 |
|------|------|
| `bun run generate:api` | 根据本地 Schema 生成 API 客户端 |
| `bun run generate:api:watch` | 监听模式，Schema 变化时自动重新生成 |
| `bun run api:refresh` | 组合命令：重新下载 + 生成客户端 |

## 🔄 开发工作流

### 日常开发

1. **启动开发服务器**：
   ```bash
   bun run dev
   ```

2. **API 变更时**：
   ```bash
   bun run api:refresh
   ```

3. **开发时监听模式**（可选）：
   ```bash
   # 终端 1: API schema 监听
   bun run generate:api:watch

   # 终端 2: 开发服务器
   bun run dev
   ```

### 首次设置

1. **克隆项目后**：
   ```bash
   bun install
   bun run fetch:api
   bun run generate:api
   ```

2. **测试 API 客户端**：
   ```bash
   bun run dev
   # 访问 http://localhost:3000/test
   ```

## 📁 文件结构

```
playground/
├── scripts/
│   └── fetch-openapi.js    # Schema 下载脚本
├── openapi-schema.json     # 本地 Schema 文件（.gitignore）
├── orval.config.ts         # Orval 配置文件
├── src/
│   └── api/
│       ├── generated/      # 自动生成的 API 客户端
│       ├── axios-instance.ts  # 自定义 axios 实例
│       ├── index.ts        # API 导出入口
│       └── query-client.ts # TanStack Query 配置
└── docs/
    ├── api-workflow.md     # 本文档
    └── api-client-guide.md # 详细使用指南
```

## ⚙️ 配置说明

### Orval 配置 (`orval.config.ts`)

- **本地优先**：优先使用本地 `openapi-schema.json` 文件
- **远程回退**：本地文件不存在时回退到远程 URL
- **错误处理**：文件缺失时提供清晰的错误提示

### 下载脚本配置

- **源地址**：`http://localhost:8089/schema/openapi.json`
- **重试机制**：自动重试 3 次
- **超时设置**：10 秒超时
- **文件验证**：下载后验证 JSON 格式

## 🛠️ 故障排除

### 常见问题

**Q: 下载失败怎么办？**
```bash
# 检查服务器是否运行
curl http://localhost:8089/schema/openapi.json

# 强制重新下载
bun run fetch:api:force
```

**Q: 生成的客户端类型错误？**
```bash
# 清理并重新生成
rm -rf src/api/generated/
bun run fetch:api:force
bun run generate:api
```

**Q: 如何使用不同的 OpenAPI 源？**
```bash
# 编辑脚本中的配置
vim scripts/fetch-openapi.js
# 修改 OPENAPI_URL 常量
```

### 调试技巧

1. **检查 Schema 内容**：
   ```bash
   bun run fetch:api:check
   ```

2. **查看生成日志**：
   ```bash
   bun run generate:api --verbose
   ```

3. **验证生成的类型**：
   ```bash
   bun run build
   # 检查 TypeScript 编译错误
   ```

## 📚 相关文档

- [Orval 官方文档](https://orval.dev/)
- [OpenAPI 规范](https://swagger.io/specification/)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [API 客户端详细指南](./api-client-guide.md)