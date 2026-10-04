import { act, renderHook } from '@testing-library/react';

import { liveStatus } from '@/shared/lib/live-status';
import { useLiveNow } from './use-live-now';

const START = '2026-10-01T00:00:00.000Z';

describe('노출 상태의 지금', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T23:58:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('화면을 켜 둔 채 시작 시각이 되면 예약이 노출 중으로, 종료 시각이 되면 종료로 바뀐다', () => {
    const b = { isActive: true, startsAt: START, endsAt: '2026-10-01T00:30:00.000Z' };
    const { result } = renderHook(() => liveStatus(b, useLiveNow([b])));
    expect(result.current).toBe('SCHEDULED');

    act(() => {
      vi.advanceTimersByTime(2 * 60_000 - 1);
    });
    expect(result.current).toBe('SCHEDULED');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('LIVE');

    act(() => {
      vi.advanceTimersByTime(30 * 60_000);
    });
    expect(result.current).toBe('ENDED');
    // 더 바뀔 시각이 없으면 타이머를 두지 않는다
    expect(vi.getTimerCount()).toBe(0);
  });

  it('나중에 받은 목록의 경계가 이미 지났으면 곧바로 다시 잡는다', () => {
    const { result, rerender } = renderHook(
      ({ banners }) => liveStatus(banners[0] ?? { isActive: false }, useLiveNow(banners)),
      { initialProps: { banners: [] as { isActive: boolean; startsAt?: string }[] } },
    );
    // 경계가 없어 '지금'이 멈춘 사이 시각이 시작 시각을 넘는다
    vi.setSystemTime(new Date('2026-10-01T00:05:00.000Z'));
    rerender({ banners: [{ isActive: true, startsAt: START }] });
    expect(result.current).toBe('SCHEDULED');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('LIVE');
  });

  it('언마운트하면 타이머를 정리한다', () => {
    const b = { isActive: true, startsAt: START };
    const { unmount } = renderHook(() => useLiveNow([b]));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('두 달 남은 경계는 setTimeout 상한(약 24.8일)씩 나눠 기다린다', () => {
    const b = { isActive: true, startsAt: '2026-12-01T00:00:00.000Z' };
    // 상한을 넘기면 브라우저는 곧바로 불러 다시 그리기를 반복한다 — 가짜 타이머는 이를 흉내 내지 않아 지연 값을 직접 본다
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const { result } = renderHook(() => liveStatus(b, useLiveNow([b])));
    expect(spy.mock.calls.map(([, ms]) => ms)).toContain(2 ** 31 - 1);
    expect(spy.mock.calls.every(([, ms]) => (ms ?? 0) <= 2 ** 31 - 1)).toBe(true);
    for (const _ of [1, 2]) {
      act(() => {
        vi.advanceTimersByTime(2 ** 31 - 1);
      });
      expect(result.current).toBe('SCHEDULED');
      expect(vi.getTimerCount()).toBe(1);
    }
    act(() => {
      vi.advanceTimersByTime(2 ** 31 - 1);
    });
    expect(result.current).toBe('LIVE');
  });
});
