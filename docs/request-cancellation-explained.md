# '请求取消'说明

本文档解释为什么在开发环境中会看到 "Request cancelled" 日志，以及这是如何工作的。

## 🎯 TL;DR（简短总结）

**"Request cancelled" 不是错误**，而是 TanStack Query 的正常行为。它帮助：

- ✅ 避免内存泄漏
- ✅ 防止在组件卸载后更新状态
- ✅ 节省网络资源

## 📚 为什么会发生请求取消？

### 1. TanStack Query 的自动清理机制

TanStack Query 会在以下情况下**主动取消**正在进行的请求：

**场景 1: 组件快速卸载**

```typescript
function UserProfile() {
  // 组件挂载时，发起请求
  const { data } = useAccountProfile()

  return <div>{data?.name}</div>
}

// 执行流程：
// 1. 组件挂载 → 发起请求
// 2. 用户立即跳转到其他页面
// 3. 组件卸载 → TanStack Query 取消请求 ✅
```

**场景 2: 查询键变更**

```typescript
function UsersList() {
  const [page, setPage] = useState(1)

  // 每次 page 变化，取消旧请求，发起新请求
  const { data } = useListUsers({ page })

  return (
    <button onClick={() => setPage(2)}>
      下一页  {/* 点击会取消 page=1 的请求 */}
    </button>
  )
}
```

**场景 3: 手动刷新时取消正在进行的请求**

```typescript
const { data, refetch } = useListUsers();

// 连续点击刷新
refetch(); // 发起请求 1
refetch(); // 取消请求 1，发起请求 2 ✅
```

### 2. React 18 Strict Mode 的双重渲染

在开发环境中，React 18 的 Strict Mode 会**故意**挂载、卸载、再挂载组件，用于检测副作用问题：

```typescript
// 开发环境下的执行流程（仅在 development 模式）：
1. 组件首次挂载 → 发起请求 A
2. Strict Mode 故意卸载 → 取消请求 A ⏹️
3. Strict Mode 再次挂载 → 发起请求 B ✅
```

你可以在 `src/main.tsx` 看到：

```typescript
root.render(
  <StrictMode>  {/* ← Strict Mode 在开发环境启用 */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

**为什么要这样做？**

React 想帮你发现副作用清理不当的问题：

```typescript
// ❌ 糟糕的代码示例
useEffect(() => {
  const timer = setInterval(() => {
    updateData();
  }, 1000);

  // 忘记清理！内存泄漏 🐛
  // return () => clearInterval(timer)  ← 缺少这行
}, []);

// Strict Mode 会执行两次，暴露问题：
// 第一次挂载 → timer 1 启动
// 卸载（但 timer 1 没清理！） ← 内存泄漏被发现
// 第二次挂载 → timer 2 启动
// 结果：两个 timer 同时运行！开发者会注意到问题
```

## 🔄 完整的执行流程

```
用户访问 /test 页面
├─ React 渲染 UserProfileSection 组件
│  └─ useAccountProfile() 发起请求 (Request ID: 1)
│     └─ 请求进行中...
│
├─ React 18 Strict Mode 检测副作用（仅开发环境）
│  └─ 卸载组件
│     └─ TanStack Query 检测到组件卸载
│        └─ 调用 AbortController.abort()
│           └─ Axios 收到取消信号
│              └─ 抛出错误: { message: 'canceled', code: 'ERR_CANCELED' }
│                 └─ 进入 Response Interceptor 的错误处理
│                    └─ 特殊处理：静默忽略 ⏹️
│
├─ Strict Mode 重新挂载组件
│  └─ useAccountProfile() 发起新请求 (Request ID: 2)
│     └─ 这次请求会正常完成 ✅
```

## 🛠️ 我们的实现

在 `src/api/axios-instance.ts` 中，我们特殊处理了取消的请求：

```typescript
axiosInstance.interceptors.response.use(
  response => {
    // 成功的响应
    return response;
  },
  (error: AxiosError) => {
    // 检查是否是取消错误
    if (error.message === 'canceled' || error.code === 'ERR_CANCELED') {
      // 静默处理，不输出错误日志
      // 在开发环境可以取消注释下面这行来查看取消日志
      // console.log('⏹️  Request cancelled (normal behavior)')
      return Promise.reject(error);
    }

    // 如果不是取消错误，才输出详细的错误信息
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);
```

### 为什么要特殊处理？

**❌ 没有特殊处理时（会让开发者困惑）：**

```
控制台输出：
❌ Request setup error: canceled
  at axios-instance.ts:88
❌ Request setup error: canceled
  at axios-instance.ts:88
❌ Request setup error: canceled
...（可能重复多次，看起来像是严重错误）
```

**✅ 有特殊处理后（清爽明了）：**

```
控制台输出：
🚀 REST API Request: GET /api/profile { authenticated: true }
⏹️  Request cancelled (normal behavior)  ← 可选的轻量日志
🚀 REST API Request: GET /api/profile { authenticated: true }
✅ REST API Response: 200 /profile
```

## 📊 请求取消发生的频率

| 场景                 | 开发环境 | 生产环境               |
| -------------------- | -------- | ---------------------- |
| Strict Mode 双重渲染 | **高频** | 无（Strict Mode 关闭） |
| 用户快速切换页面     | 中频     | 中频                   |
| 查询参数快速变更     | 中频     | 中频                   |
| 网络重连时重新请求   | 低频     | 低频                   |
| Tab 切换导致的取消   | 低频     | 低频                   |

**结论**：请求取消在生产环境仍然会发生，只是频率较低。

## 🔍 如何验证请求取消？

你可以在代码中添加日志来观察：

```typescript
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  console.log('📤 发起请求:', config.url);

  // 监听取消信号
  config.signal?.addEventListener('abort', () => {
    console.log('🛑 请求被取消:', config.url);
  });

  return config;
});
```

## 📝 最佳实践

### ✅ 推荐做法

```typescript
// 1. 使用 enabled 选项控制查询时机
const { data } = useAccountProfile({
  query: {
    enabled: !!authToken, // 只有在有 token 时才查询
  },
});

// 2. 配置合理的缓存时间
const { data } = useListUsers(undefined, {
  query: {
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    refetchOnWindowFocus: false, // 减少不必要的重新请求
  },
});

// 3. 在组件卸载时不需要手动取消请求
// TanStack Query 会自动处理 ✅
```

### ❌ 不推荐做法

```typescript
// ❌ 不要手动管理 AbortController
// TanStack Query 已经帮你做了

// ❌ 不要禁用 Strict Mode
// <StrictMode> 是帮你发现问题的工具

// ❌ 不要在错误处理中隐藏所有错误
// 只静默处理取消错误，其他错误要正常显示
```

## 🔗 相关资源

- [TanStack Query - Request Cancellation](https://tanstack.com/query/latest/docs/react/guides/query-cancellation)
- [React 18 - Strict Mode](https://react.dev/reference/react/StrictMode)
- [Axios - Cancellation](https://axios-http.com/docs/cancellation)

## ✅ 总结

1. **请求取消是功能，不是 bug**
2. **Strict Mode 是质量检查工具，不是问题源头**
3. **它们协同工作，让你的代码更健壮**
4. **开发环境看到的频繁取消是正常的**
5. **生产环境也会有取消，但频率低**

当你在控制台看到 "Request cancelled" 时，不用担心 —— 这说明你的应用正在正确地管理请求生命周期！✨
