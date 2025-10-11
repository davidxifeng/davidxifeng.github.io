# GitHub Actions 工作流文档

本文档描述了项目中使用的 GitHub Actions 工作流的配置和用途。

## 📋 工作流概览

项目包含三个主要的工作流：

1. **CI** (`.github/workflows/ci.yml`) - 持续集成
2. **Deploy** (`.github/workflows/deploy.yml`) - 部署到 GitHub Pages
3. **Sync Schema** (`.github/workflows/sync-schema.yml`) - OpenAPI Schema 同步

## 🔄 CI 工作流 (`.github/workflows/ci.yml`)

### 触发条件
- **Pull Request**: 目标分支为 `main`
- **Push**: 推送到 `main` 分支

### 主要任务

#### 1. 测试任务 (`test`)
```yaml
- 验证 OpenAPI Schema 文件
- 生成 API 客户端
- TypeScript 编译检查
- 验证生成的 API 客户端
```

**步骤说明**：
1. **Checkout**: 获取源代码
2. **Setup Bun**: 安装 Bun 运行时
3. **Install Dependencies**: 安装项目依赖
4. **Check OpenAPI Schema**: 检查本地 schema 文件状态
5. **Validate OpenAPI Schema**: 验证 JSON 格式和内容
6. **Generate API Client**: 使用 Orval 生成 API 客户端
7. **Type Check**: TypeScript 编译检查
8. **Test API Client Generation**: 验证生成的客户端代码

#### 2. Schema 同步任务 (`schema-sync`)
```yaml
- 仅在推送到 main 分支时运行
- 检查远程服务器是否有 schema 更新
- 自动创建 PR 同步更新
```

**步骤说明**：
1. **Checkout**: 获取源代码（包含写入权限）
2. **Setup Bun**: 安装 Bun 运行时
3. **Install Dependencies**: 安装项目依赖
4. **Check for Schema Updates**: 比较本地和远程 schema
5. **Create PR for Schema Update**: 如有更新则创建 PR

## 🚀 部署工作流 (`.github/workflows/deploy.yml`)

### 触发条件
- **Push**: 推送到 `main` 分支
- **Manual**: 手动触发 (`workflow_dispatch`)

### 主要任务

1. **Verify OpenAPI Schema**: 验证 schema 文件存在且格式正确
2. **Generate API Client**: 生成 API 客户端代码
3. **Verify API Client Generation**: 确保客户端生成成功
4. **Build**: 构建生产版本
5. **Verify Build Output**: 验证构建输出文件
6. **Deploy**: 部署到 GitHub Pages

## 🔄 Schema 同步工作流 (`.github/workflows/sync-schema.yml`)

### 触发条件
- **Schedule**: 每天北京时间上午 9 点 (UTC+1)
- **Manual**: 手动触发，支持强制更新选项

### 主要任务

1. **Fetch Latest Schema**: 从服务器获取最新 schema
2. **Compare with Local Schema**: 比较本地和远程差异
3. **Force Update Check**: 处理强制更新选项
4. **Create or Update PR**: 需要时创建/更新 Pull Request
5. **Summary**: 生成操作摘要

### 手动触发选项

```bash
# 普通同步
gh workflow run sync-schema.yml

# 强制更新
gh workflow run sync-schema.yml -f force=true
```

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `API_SERVER_URL` | OpenAPI 服务器地址 | `http://localhost:8089/schema/openapi.json` |

### 权限配置

#### CI 工作流
- `contents: read` - 读取仓库内容

#### Deploy 工作流
- `contents: read` - 读取仓库内容
- `pages: write` - 写入 GitHub Pages
- `id-token: write` - OIDC 令牌

#### Sync Schema 工作流
- `contents: write` - 写入仓库内容
- `pull-requests: write` - 创建和管理 PR

## 🛠️ 故障排除

### 常见问题

#### 1. Schema 文件验证失败
```bash
# 本地检查
bun run fetch:api:check

# 验证 JSON 格式
jq empty openapi-schema.json
```

#### 2. API 客户端生成失败
```bash
# 清理并重新生成
rm -rf src/api/generated/
bun run generate:api
```

#### 3. 构建失败
```bash
# 本地构建测试
bun run build

# 检查 TypeScript 错误
tsc --noEmit
```

#### 4. Schema 同步失败
- 检查服务器是否正常运行
- 验证 `API_SERVER_URL` 配置
- 检查网络连接

### 调试技巧

#### 查看 Workflow 运行日志
1. 访问 GitHub 仓库的 Actions 页面
2. 点击具体的工作流运行
3. 查看各个步骤的详细日志

#### 本地复现 CI 环境
```bash
# 安装相同的 Bun 版本
bun install

# 运行相同的验证步骤
bun run fetch:api:check
bun run generate:api
bun run build
```

#### 手动触发 Sync Schema
```bash
# 强制同步
gh workflow run sync-schema.yml -f force=true

# 查看运行结果
gh run list --workflow=sync-schema.yml
```

## 📊 工作流状态徽章

可以在 README 中添加以下徽章：

```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
![Deploy](https://github.com/username/repo/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![Sync Schema](https://github.com/username/repo/workflows/Sync%20OpenAPI%20Schema/badge.svg)
```

## 🔄 开发工作流

### 日常开发流程

1. **开发阶段**:
   ```bash
   bun run dev
   bun run generate:api:watch  # 可选：监听 schema 变化
   ```

2. **提交前检查**:
   ```bash
   bun run build  # 确保 TypeScript 编译通过
   bun run fetch:api:check  # 检查 schema 状态
   ```

3. **API 变更后**:
   ```bash
   bun run api:refresh  # 重新下载并生成客户端
   ```

### Schema 更新流程

1. **自动更新**:
   - 每天自动检查服务器更新
   - 自动创建 PR 同步变更

2. **手动更新**:
   ```bash
   # 本地更新
   bun run fetch:api:force
   bun run generate:api

   # 触发远程同步
   gh workflow run sync-schema.yml -f force=true
   ```

3. **验证更新**:
   - 检查 CI/CD 是否通过
   - 本地测试 API 功能
   - 审查并合并 PR

## 📚 相关文档

- [API 工作流文档](./api-workflow.md)
- [Orval 官方文档](https://orval.dev/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)