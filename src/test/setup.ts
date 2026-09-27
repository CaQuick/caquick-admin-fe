import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './msw/server';

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
