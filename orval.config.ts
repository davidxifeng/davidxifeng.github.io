import { defineConfig } from 'orval';

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
    input: {
      target: 'http://localhost:8089/schema/openapi.json',
    },
  },
});
