import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { installZodKorean } from '@/shared/lib/zod-locale';

import { server } from './msw/server';

// 앱 부팅(main.tsx)과 같은 zod 문구 설정
installZodKorean();

// findBy·waitFor 기본 1초는 전체 스위트를 병렬로 돌릴 때 부하로 간헐 초과한다(단독 실행은 통과)
configure({ asyncUtilTimeout: 3000 });

// jsdom에 없는 브라우저 API — Radix Switch 등이 쓴다
class ResizeObserverStub {
  observe(): void {
    // jsdom 스텁
  }
  unobserve(): void {
    // jsdom 스텁
  }
  disconnect(): void {
    // jsdom 스텁
  }
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
// Radix Select·Popover가 쓰는 포인터 캡처·스크롤 API
const proto = Element.prototype as Element & Record<string, unknown>;
proto.hasPointerCapture ??= () => false;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
proto.scrollIntoView ??= () => undefined;

/** sonner가 import될 때 문서에 넣는 토스트 스타일시트를 찾는 표식 */
const SONNER_STYLE_MARKER = 'data-sonner-toaster';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// sonner는 import 시점에 97규칙짜리 <style>을 넣는다. jsdom은 DOM이 바뀔 때마다 스타일 캐시를 버리고
// getComputedStyle에서 문서의 모든 규칙을 다시 대조하는데, 역할·이름 조회가 조회 1회에 이를 100번 넘게 부른다.
// 조작 직후 조회가 66ms → 22ms, 전체 스위트(커버리지) 합계 135초 → 99초. jsdom에서 토스트 CSS는 쓸 데가 없다
beforeEach(() => {
  document.querySelectorAll('style').forEach((el) => {
    if (el.textContent?.includes(SONNER_STYLE_MARKER)) el.remove();
  });
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});
afterAll(() => server.close());
