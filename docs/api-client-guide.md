# API Client 使用指南

本文档介绍如何使用 Orval + TanStack Query 构建的 OpenAPI 客户端。

## 📚 目录

- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [生成 API 客户端](#生成-api-客户端)
- [使用生成的 Hooks](#使用生成的-hooks)
- [高级用法](#高级用法)
- [API 配置管理](#api-配置管理)
- [常见问题](#常见问题)

## 快速开始

### 1. 确保后端服务运行

确保你的 Litestar 后端服务正在运行：

```bash
# 后端服务应该运行在 http://localhost:8089
# OpenAPI 规范端点: http://localhost:8089/schema/openapi.json
```

### 2. 生成 API 客户端代码

```bash
# 一次性生成
bun run generate:api

# 监听模式（后端 API 变化时自动重新生成）
bun run generate:api:watch

# 生成并启动开发服务器
bun run dev:full
```

### 3. 在组件中使用

```tsx
import { useGetUsers } from '@/api';

function UsersList() {
  const { data, isLoading, error } = useGetUsers();

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 配置说明

### Orval 配置 (`orval.config.ts`)

```typescript
export default defineConfig({
  api: {
    input: {
      // OpenAPI 规范来源
      target: 'http://localhost:8089/schema/openapi.json',
    },
    output: {
      // 生成文件位置
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/model.ts',

      // 使用 TanStack Query
      client: 'react-query',

      // 自定义 Axios 实例
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
```

### Vite 代理配置

开发环境下，前端通过代理访问后端 API：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8089',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

## 生成 API 客户端

### 从运行的服务生成

```bash
bun run generate:api
```

Orval 将会：

1. 从 `http://localhost:8089/schema/openapi.json` 获取 OpenAPI 规范
2. 生成 TypeScript 类型定义到 `src/api/generated/model.ts`
3. 生成 React Query hooks 到 `src/api/generated/endpoints.ts`
4. 自动格式化生成的代码

### 从本地文件生成

如果你有本地的 OpenAPI JSON 文件：

```typescript
// orval.config.ts
input: {
  target: '../path-to-litestar-project/openapi.json',
}
```

## 使用生成的 Hooks

### Query Hooks（查询数据）

```tsx
import { useGetUser, useGetUsers } from '@/api/generated/endpoints';

function UserProfile({ userId }: { userId: string }) {
  // 获取单个用户
  const { data: user, isLoading, error, refetch } = useGetUser(userId);

  // 手动刷新数据
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      {isLoading && <p>加载中...</p>}
      {error && <p>错误: {error.message}</p>}
      {user && (
        <>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <button onClick={handleRefresh}>刷新</button>
        </>
      )}
    </div>
  );
}

function UsersList() {
  // 获取用户列表
  const {
    data: users,
    isLoading,
    error,
    isFetching, // 后台刷新状态
  } = useGetUsers();

  return (
    <div>
      {isFetching && <p>更新中...</p>}
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Mutation Hooks（修改数据）

```tsx
import { useCreateUser, useUpdateUser, useDeleteUser } from '@/api/generated/endpoints';
import { useQueryClient } from '@tanstack/react-query';

function UserForm() {
  const queryClient = useQueryClient();

  // 创建用户
  const createMutation = useCreateUser({
    onSuccess: newUser => {
      console.log('用户创建成功:', newUser);
      // 刷新用户列表缓存
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: error => {
      console.error('创建失败:', error);
    },
  });

  // 更新用户
  const updateMutation = useUpdateUser({
    onSuccess: updatedUser => {
      console.log('用户更新成功:', updatedUser);
      // 更新特定用户的缓存
      queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
    },
  });

  // 删除用户
  const deleteMutation = useDeleteUser({
    onSuccess: (_, userId) => {
      console.log('用户删除成功');
      // 从缓存中移除
      queryClient.removeQueries({ queryKey: ['users', userId] });
      // 刷新列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreate = (userData: CreateUserDto) => {
    createMutation.mutate(userData);
  };

  const handleUpdate = (userId: string, userData: UpdateUserDto) => {
    updateMutation.mutate({ userId, data: userData });
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  return (
    <div>
      <button
        onClick={() => handleCreate({ name: 'Alice', email: 'alice@example.com' })}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? '创建中...' : '创建用户'}
      </button>

      {createMutation.isError && <p>错误: {createMutation.error.message}</p>}
    </div>
  );
}
```

### 带参数的查询

```tsx
import { useGetUsers } from '@/api/generated/endpoints';
import { useState } from 'react';

function FilteredUsersList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'active',
  });

  // 传递查询参数
  const { data, isLoading } = useGetUsers({
    params: filters,
  });

  return (
    <div>
      <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
        <option value="active">活跃</option>
        <option value="inactive">非活跃</option>
      </select>

      {/* 用户列表 */}
      {data?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}

      {/* 分页 */}
      <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>上一页</button>
      <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>下一页</button>
    </div>
  );
}
```

## 高级用法

### 乐观更新

```tsx
import { useUpdateUser } from '@/api/generated/endpoints';
import { useQueryClient } from '@tanstack/react-query';

function OptimisticUpdate({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const updateMutation = useUpdateUser({
    // 在发送请求前立即更新 UI
    onMutate: async newUserData => {
      // 取消正在进行的查询，避免冲突
      await queryClient.cancelQueries({ queryKey: ['users', userId] });

      // 获取当前缓存的数据
      const previousUser = queryClient.getQueryData(['users', userId]);

      // 乐观更新缓存
      queryClient.setQueryData(['users', userId], newUserData);

      // 返回上下文，用于回滚
      return { previousUser };
    },
    // 如果失败，回滚到之前的状态
    onError: (err, newUserData, context) => {
      queryClient.setQueryData(['users', userId], context?.previousUser);
    },
    // 无论成功还是失败，都重新获取数据
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });

  return <button onClick={() => updateMutation.mutate({ name: 'New Name' })}>更新用户</button>;
}
```

### 手动缓存管理

```tsx
import { useQueryClient, queryKeys } from '@/api';

function CacheManagement() {
  const queryClient = useQueryClient();

  // 使缓存失效（触发重新获取）
  const invalidateUsers = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.scope('users'),
    });
  };

  // 预取数据
  const prefetchUser = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => fetchUser(userId),
    });
  };

  // 手动设置缓存数据
  const setUserCache = (userId: string, userData: User) => {
    queryClient.setQueryData(['users', userId], userData);
  };

  // 获取缓存数据
  const getCachedUser = (userId: string) => {
    return queryClient.getQueryData(['users', userId]);
  };

  // 清除缓存
  const clearUserCache = (userId: string) => {
    queryClient.removeQueries({ queryKey: ['users', userId] });
  };

  return <div>{/* UI */}</div>;
}
```

### 依赖查询

```tsx
function UserPosts({ userId }: { userId: string }) {
  // 先获取用户
  const { data: user } = useGetUser(userId);

  // 只有在用户数据存在时才获取帖子
  const { data: posts } = useGetUserPosts(userId, {
    enabled: !!user, // 依赖条件
  });

  return (
    <div>
      <h1>{user?.name}</h1>
      <ul>
        {posts?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 并行查询

```tsx
function Dashboard() {
  // 并行获取多个数据
  const usersQuery = useGetUsers();
  const postsQuery = useGetPosts();
  const statsQuery = useGetStats();

  // 检查所有查询是否完成
  const isLoading = usersQuery.isLoading || postsQuery.isLoading || statsQuery.isLoading;
  const hasError = usersQuery.error || postsQuery.error || statsQuery.error;

  if (isLoading) return <div>加载中...</div>;
  if (hasError) return <div>出错了</div>;

  return (
    <div>
      <UsersList users={usersQuery.data} />
      <PostsList posts={postsQuery.data} />
      <Stats data={statsQuery.data} />
    </div>
  );
}
```

## API 配置管理

### 动态 BaseURL 和认证

自定义 Axios 实例会自动从 `apiConfigStore` 读取配置：

```tsx
import { useAPIConfigStore } from '@/stores/apiConfigStore';

function APISettings() {
  const { effectiveBaseURL, apiKey, setAPIKey, setCustomBaseURL } = useAPIConfigStore();

  return (
    <div>
      <p>当前 API: {effectiveBaseURL}</p>
      <input type="password" value={apiKey} onChange={e => setAPIKey(e.target.value)} placeholder="API Key" />
    </div>
  );
}
```

### 切换 API Provider

```tsx
import { useAPIConfigStore, API_PROVIDERS } from '@/stores/apiConfigStore';

function ProviderSelector() {
  const { selectedProviderId, setProvider } = useAPIConfigStore();

  return (
    <select value={selectedProviderId} onChange={e => setProvider(e.target.value)}>
      {API_PROVIDERS.map(provider => (
        <option key={provider.id} value={provider.id}>
          {provider.name}
        </option>
      ))}
    </select>
  );
}
```

## 开发调试

### React Query DevTools

开发环境下自动启用，可以查看：

- 所有查询的状态
- 缓存数据
- 网络请求历史
- 手动触发重新获取

在浏览器中按下 DevTools 按钮即可打开。

### Axios 请求日志

开发环境下，所有 API 请求都会在控制台输出：

```
🚀 API Request: GET http://localhost:8089/users
✅ API Response: 200 /users
```

## 常见问题

### Q: 生成失败，报错 "Cannot connect to OpenAPI endpoint"

**A:** 确保 Litestar 后端服务正在运行，并且端口正确（默认 8089）。

```bash
# 检查后端是否运行
curl http://localhost:8089/schema/openapi.json
```

### Q: 如何处理不同环境的 API URL？

**A:** 使用环境变量或 `apiConfigStore` 动态配置。生产环境中，通过 `setCustomBaseURL` 设置生产 API 地址。

### Q: 生成的代码能直接修改吗？

**A:** 不建议。生成的代码会被覆盖。如果需要自定义逻辑，应该：

1. 在 `orval.config.ts` 中配置覆盖规则
2. 或者创建包装函数

### Q: 如何禁用某个查询的自动刷新？

**A:** 使用查询选项：

```tsx
const { data } = useGetUsers({
  staleTime: Infinity, // 永不过期
  refetchOnWindowFocus: false, // 不在窗口聚焦时刷新
});
```

### Q: 如何实现分页？

**A:** 使用状态管理分页参数：

```tsx
const [page, setPage] = useState(1);
const { data } = useGetUsers({ params: { page, limit: 10 } });
```

### Q: 生成的类型不准确怎么办？

**A:** 检查后端 OpenAPI 规范是否正确。Litestar 应该自动生成准确的类型定义。如果需要，可以在后端手动调整 schema 定义。

## 最佳实践

1. **使用查询键工厂**：统一管理查询键，避免硬编码
2. **合理设置缓存时间**：根据数据更新频率调整 `staleTime`
3. **错误处理**：始终处理 `error` 状态
4. **加载状态**：提供友好的加载指示器
5. **乐观更新**：对用户操作提供即时反馈
6. **避免过度重新获取**：合理配置 `refetchOnWindowFocus` 和 `refetchOnMount`

## 相关资源

- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Orval 文档](https://orval.dev/)
- [Axios 文档](https://axios-http.com/)
- [Litestar OpenAPI 文档](https://docs.litestar.dev/)
