import type { KnipConfig } from 'knip';

// 죽은 코드·미사용 의존성 검사. src/shared/ui는 shadcn 레지스트리 복사본이라 일부 export가 남는 게 정상.
const config: KnipConfig = {
  // shadcn 복사본은 entry로 둔다 — 안 쓰는 export는 보고하지 않되 그 의존성은 추적한다
  entry: ['src/routes/**/*.tsx', 'src/shared/ui/*.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  // tailwindcss·tw-animate-css·pretendard는 CSS @import로만 쓰인다
  ignoreDependencies: ['tailwindcss', 'tw-animate-css', 'pretendard'],
  vitest: { config: 'vitest.config.ts' },
};

export default config;
