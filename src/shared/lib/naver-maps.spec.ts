import {
  NAVER_MAP_SCRIPT_ORIGIN,
  NAVER_MAP_TIMEOUT_MS,
  type NaverMapsApi,
  loadNaverMaps,
  naverMapKeyId,
  naverMapScriptUrl,
  onNaverMapAuthFailure,
  resetNaverMapsForTest,
} from './naver-maps';

const scripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script')].filter((s) =>
    s.src.startsWith(NAVER_MAP_SCRIPT_ORIGIN),
  );
const fake = {} as NaverMapsApi;

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.naver;
  scripts().forEach((s) => s.remove());
  resetNaverMapsForTest();
});

describe('naverMapKeyId', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    ['   ', undefined],
    [' abc123 ', 'abc123'],
  ])('VITE_NAVER_MAP_CLIENT_ID=%j → %j', (raw, expected) => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', raw);
    expect(naverMapKeyId()).toBe(expected);
  });
});

describe('naverMapScriptUrl', () => {
  it.each([
    ['abc123', 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc123'],
    ['a&b=c d', 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=a%26b%3Dc%20d'],
  ])('%j → %s(신규 파라미터 ncpKeyId, 값은 인코딩)', (key, url) => {
    expect(naverMapScriptUrl(key)).toBe(url);
  });
});

describe('loadNaverMaps', () => {
  it('스크립트를 한 번만 넣고, 불러오면 naver.maps를 넘긴다', async () => {
    const first = loadNaverMaps('k1');
    const second = loadNaverMaps('k1');
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]!.src).toBe(naverMapScriptUrl('k1'));
    expect(scripts()[0]!.async).toBe(true);
    window.naver = { maps: fake };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(first).resolves.toBe(fake);
    await expect(second).resolves.toBe(fake);
    await expect(loadNaverMaps('k1')).resolves.toBe(fake);
    expect(scripts()).toHaveLength(1);
  });

  it('불러오지 못하면 실패를 넘기고, 다음 호출에서 다시 받는다', async () => {
    const failed = loadNaverMaps('k1');
    scripts()[0]!.dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('지도 스크립트를 불러오지 못했습니다.');
    expect(scripts()).toHaveLength(0);

    const retry = loadNaverMaps('k1');
    expect(scripts()).toHaveLength(1);
    window.naver = { maps: fake };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(fake);
  });

  it('스크립트가 naver.maps를 내놓지 않으면 실패로 본다', async () => {
    const p = loadNaverMaps('k1');
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(p).rejects.toThrow('지도 스크립트에 naver.maps가 없습니다.');
    expect(scripts()).toHaveLength(0);
  });

  it('응답 없이 멈추면 시간 초과로 실패하고, 늦게 온 load는 다음 시도에 끼어들지 않는다', async () => {
    vi.useFakeTimers();
    try {
      const stalled = loadNaverMaps('k1');
      const late = scripts()[0]!;
      vi.advanceTimersByTime(NAVER_MAP_TIMEOUT_MS - 1);
      expect(scripts()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      await expect(stalled).rejects.toThrow('지도 스크립트가 응답하지 않습니다.');

      const retry = loadNaverMaps('k1');
      late.dispatchEvent(new Event('load'));
      expect(loadNaverMaps('k1')).toBe(retry);
      window.naver = { maps: fake };
      scripts()[0]!.dispatchEvent(new Event('load'));
      await expect(retry).resolves.toBe(fake);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('onNaverMapAuthFailure', () => {
  it('전역 훅 하나로 모든 구독자에게 알리고, 해제한 구독자는 빼고, 늦게 온 구독자도 바로 알린다', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = onNaverMapAuthFailure(a);
    const hook = window.navermap_authFailure;
    onNaverMapAuthFailure(b);
    expect(window.navermap_authFailure).toBe(hook);

    offA();
    window.navermap_authFailure!();
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);

    const late = vi.fn();
    onNaverMapAuthFailure(late);
    expect(late).toHaveBeenCalledTimes(1);
  });
});
