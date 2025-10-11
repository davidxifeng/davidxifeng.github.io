import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    output: {
      mode: 'single',
      target: './src/api/generated/api.ts',
      client: 'react-query',
      prettier: {
        printWidth: 100,
        tabWidth: 4,
        trailingComma: 'es5',
        semi: true,
      },
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    input: {
      target: 'http://localhost:8089/schema/openapi.json',
    },
  },
});
