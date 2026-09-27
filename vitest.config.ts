import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    // Node fetch는 상대 URL을 못 받는다 — 스펙은 이 오리진으로 요청하고 MSW가 가로챈다
    env: { VITE_API_BASE_URL: 'http://api.test' },
    include: ['src/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/graphql/generated/**',
        'src/shared/ui/**',
        'src/routeTree.gen.ts',
        'src/main.tsx',
        'src/**/*.d.ts',
      ],
      thresholds: { lines: 80, statements: 80, branches: 70, functions: 80 },
    },
  },
});
