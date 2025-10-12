import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:8787/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './tests/api-client/endpoints',
      client: 'axios',
      prettier: true,
      clean: true,
      override: {
        mutator: {
          path: './tests/api-client/axios-instance.ts',
          name: 'customAxios',
        },
      },
    },
  },
})
