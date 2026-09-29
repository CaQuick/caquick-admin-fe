import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './msw/server';

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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});
afterAll(() => server.close());
