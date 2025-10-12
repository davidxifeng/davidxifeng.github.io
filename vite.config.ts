import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeHighlight from 'rehype-highlight';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [rehypeHighlight],
      providerImportSource: '@mdx-js/react',
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    viteReact(),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: '/',
  server: {
    proxy: {
      '/lm-studio': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/lm-studio/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('LM Studio proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Proxying request to LM Studio:', req.method, req.url);
          });
        },
      },
      // API proxy for development
      // Comment/uncomment based on which backend you're using:

      // Option 1: Cloudflare Workers (recommended)
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Workers API proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Proxying request to Workers:', req.method, req.url);
          });
        },
      },

      // Option 2: Litestar (legacy)
      // '/api': {
      //   target: 'http://localhost:8089',
      //   changeOrigin: true,
      //   rewrite: path => path.replace(/^\/api/, ''),
      //   configure: (proxy, _options) => {
      //     proxy.on('error', (err, _req, _res) => {
      //       console.log('Litestar API proxy error:', err);
      //     });
      //     proxy.on('proxyReq', (_proxyReq, req, _res) => {
      //       console.log('Proxying request to Litestar:', req.method, req.url);
      //     });
      //   },
      // },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
