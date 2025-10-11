import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  useListUsers,
  useCreateUser,
  useAccountLogin,
  useAccountProfile,
  type UserCreate,
  type AccountLogin,
} from '@/api';
import { authHelpers } from '@/api/axios-instance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/test')({
  component: ApiTestPage,
});

function ApiTestPage() {
  const currentToken = authHelpers.getToken();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">API Client Test</h1>
        <p className="text-muted-foreground">测试 Orval + TanStack Query 生成的 API 客户端</p>

        {/* 显示当前认证状态 */}
        <div
          className={`p-3 rounded-md text-sm ${currentToken ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{currentToken ? '🔐 已认证' : '🔓 未认证'}</span>
            {currentToken && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  authHelpers.removeToken();
                  window.location.reload();
                }}
              >
                清除 Token
              </Button>
            )}
          </div>
          {currentToken && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">查看 Token</summary>
              <pre className="text-xs mt-2 p-2 bg-white rounded overflow-auto max-w-full">{currentToken}</pre>
            </details>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：操作区 */}
        <div className="space-y-6">
          <LoginSection />
          <CreateUserSection />
        </div>

        {/* 右侧：查询区 */}
        <div className="space-y-6">
          <UserProfileSection />
          <UserListSection />
        </div>
      </div>
    </div>
  );
}

/**
 * 登录功能测试
 */
function LoginSection() {
  const [loginData, setLoginData] = useState<AccountLogin>({
    username: '',
    password: '',
  });
  const [loginResult, setLoginResult] = useState<any>(null);

  const loginMutation = useAccountLogin({
    mutation: {
      onSuccess: (data: any) => {
        setLoginResult({ success: true, data });
        console.log('登录成功:', data);

        // 保存 token 到 localStorage
        if (data.access_token) {
          authHelpers.setToken(data.access_token);
          console.log('✅ Token 已保存到 localStorage');
        }
      },
      onError: (error: any) => {
        setLoginResult({ success: false, error: error.message });
        console.error('登录失败:', error);
      },
    },
  });

  const handleLogin = () => {
    loginMutation.mutate({ data: loginData });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">1. 用户登录</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">用户名</label>
          <Input
            placeholder="请输入用户名"
            value={loginData.username}
            onChange={e => setLoginData({ ...loginData, username: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">密码</label>
          <Input
            type="password"
            placeholder="请输入密码"
            value={loginData.password}
            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
          />
        </div>

        <Button onClick={handleLogin} disabled={loginMutation.isPending} className="w-full">
          {loginMutation.isPending ? '登录中...' : '登录'}
        </Button>

        {/* 结果展示 */}
        {loginResult && (
          <div
            className={`p-4 rounded-md ${
              loginResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <h3 className="font-semibold mb-2">{loginResult.success ? '✅ 登录成功' : '❌ 登录失败'}</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
              {JSON.stringify(loginResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * 创建用户功能测试
 */
function CreateUserSection() {
  const [userData, setUserData] = useState<UserCreate>({
    email: '',
    password: '',
    name: '',
    isActive: true,
    isVerified: false,
  });
  const [createResult, setCreateResult] = useState<any>(null);

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: data => {
        setCreateResult({ success: true, data });
        console.log('创建用户成功:', data);
        // 清空表单
        setUserData({
          email: '',
          password: '',
          name: '',
          isActive: true,
          isVerified: false,
        });
      },
      onError: (error: any) => {
        setCreateResult({ success: false, error: error.message });
        console.error('创建用户失败:', error);
      },
    },
  });

  const handleCreate = () => {
    createMutation.mutate({ data: userData });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">2. 创建用户</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">邮箱 *</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={userData.email}
            onChange={e => setUserData({ ...userData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">密码 *</label>
          <Input
            type="password"
            placeholder="请输入密码"
            value={userData.password}
            onChange={e => setUserData({ ...userData, password: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">姓名</label>
          <Input
            placeholder="请输入姓名"
            value={userData.name || ''}
            onChange={e => setUserData({ ...userData, name: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={userData.isActive}
              onChange={e => setUserData({ ...userData, isActive: e.target.checked })}
            />
            <span className="text-sm">激活状态</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={userData.isVerified}
              onChange={e => setUserData({ ...userData, isVerified: e.target.checked })}
            />
            <span className="text-sm">已验证</span>
          </label>
        </div>

        <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? '创建中...' : '创建用户'}
        </Button>

        {/* 结果展示 */}
        {createResult && (
          <div
            className={`p-4 rounded-md ${
              createResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <h3 className="font-semibold mb-2">{createResult.success ? '✅ 创建成功' : '❌ 创建失败'}</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
              {JSON.stringify(createResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * 当前用户信息
 */
function UserProfileSection() {
  const hasToken = !!authHelpers.getToken();

  const { data, isLoading, error, refetch } = useAccountProfile({
    query: {
      enabled: hasToken, // 只有在有 token 时才查询
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">当前用户信息</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">加载中...</p>}

      {!!error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">⚠️ 未登录或登录已过期</p>
          <p className="text-xs text-yellow-600 mt-1">{String(error)}</p>
        </div>
      )}

      {data && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </Card>
  );
}

/**
 * 用户列表查询
 */
function UserListSection() {
  const { data, isLoading, error, refetch, isFetching } = useListUsers(undefined, {
    query: {
      // 禁用自动刷新
      refetchOnWindowFocus: false,
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">3. 用户列表</h2>
        <div className="flex items-center gap-2">
          {isFetching && <span className="text-sm text-muted-foreground">更新中...</span>}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            刷新
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">加载用户列表中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-semibold text-red-800 mb-2">❌ 加载失败</h3>
          <p className="text-sm text-red-600">{String(error)}</p>
        </div>
      )}

      {/* 数据展示 */}
      {data && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-2">📊 总计: {data.total || data.items?.length || 0} 个用户</h3>
            <div className="grid gap-2 max-h-96 overflow-auto">
              {data.items?.map((user: any, index: number) => (
                <div key={user.id || index} className="p-3 bg-white border rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.id && <p className="text-xs text-muted-foreground">ID: {user.id}</p>}
                    </div>
                    <div className="flex gap-2">
                      {user.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">激活</span>
                      )}
                      {user.isVerified && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">已验证</span>
                      )}
                    </div>
                  </div>
                </div>
              )) || <p className="text-center text-muted-foreground py-4">暂无用户数据</p>}
            </div>
          </div>

          {/* 原始响应 */}
          <details className="cursor-pointer">
            <summary className="text-sm font-medium mb-2">查看原始响应数据</summary>
            <pre className="text-xs overflow-auto max-h-60 bg-gray-100 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </Card>
  );
}
