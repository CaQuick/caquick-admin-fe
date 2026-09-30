import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app';
import '@/app/globals.css';
import { installZodKorean } from '@/shared/lib/zod-locale';

// 메시지를 적지 않은 검증 규칙도 한국어로 보이게 한다
installZodKorean();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
