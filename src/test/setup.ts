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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});
afterAll(() => server.close());
