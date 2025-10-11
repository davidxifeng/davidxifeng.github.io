import { defineConfig } from 'orval';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Orval API 客户端配置
 * 使用本地 OpenAPI Schema 文件生成类型安全的 API 客户端
 *
 * 使用流程:
 * 1. 运行 `bun run fetch:api` 下载 OpenAPI schema
 * 2. 运行 `bun run generate:api` 生成 API 客户端
 */

// 本地 OpenAPI Schema 文件路径
const openApiSchemaPath = resolve(process.cwd(), 'openapi-schema.json');

// 读取本地 schema 文件（如果存在）
let openApiInput = {
  target: openApiSchemaPath,
};

try {
  const schemaContent = readFileSync(openApiSchemaPath, 'utf8');
  const schemaData = JSON.parse(schemaContent);

  // 如果文件存在且内容有效，直接使用 JSON 对象
  openApiInput = {
    target: schemaData,
  };

  console.log('✅ 使用本地 OpenAPI Schema 文件');
} catch (error) {
  console.warn('⚠️  本地 OpenAPI Schema 文件不存在或无效，请先运行:');
  console.warn('   bun run fetch:api');

  // 回退到远程 URL（作为备选方案）
  openApiInput = {
    target: 'http://localhost:8089/schema/openapi.json',
  };
}

export default defineConfig({
  api: {
    output: {
      mode: 'single',
      target: './src/api/generated/api.ts',
      client: 'react-query',
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    input: openApiInput,
  },
});
