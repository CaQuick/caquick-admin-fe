import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 로컬 개발은 /graphql·/auth를 백엔드(기본 localhost:4000)로 프록시해 same-origin으로 만든다 — CORS·쿠키 설정 없이 refresh 쿠키가 돈다.
// 운영 빌드는 VITE_API_BASE_URL(절대 URL)로 api.caquick.site에 직접 붙는다.
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: process.env.DEV_API_ORIGIN ?? 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.DEV_API_ORIGIN ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: { sourcemap: false, target: 'es2023' },
});
