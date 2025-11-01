import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/test')({
  component: ApiTestPage,
});

function ApiTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">API Client Test</h1>
        <p className="text-muted-foreground">测试 Orval + TanStack Query 生成的 API 客户端</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：操作区 */}
        <div className="space-y-6">
        </div>

        {/* 右侧：查询区 */}
        <div className="space-y-6">
        </div>
      </div>
    </div>
  );
}

