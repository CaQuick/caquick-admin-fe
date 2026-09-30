import {
  POSTCODE_SCRIPT_URL,
  POSTCODE_TIMEOUT_MS,
  type PostcodeConstructor,
  type RawPostcodeData,
  loadPostcode,
  toPostcodeResult,
} from './kakao-postcode';

const raw = (over: Partial<RawPostcodeData> = {}): RawPostcodeData => ({
  roadAddress: '서울 강남구 테헤란로 152',
  jibunAddress: '서울 강남구 역삼동 737',
  sido: '서울',
  sigungu: '강남구',
  bname: '역삼동',
  sigunguCode: '11680',
  zonecode: '06236',
  ...over,
});

const scripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script')].filter(
    (s) => s.src === POSTCODE_SCRIPT_URL,
  );

class FakePostcode {
  embed = vi.fn();
}
const Fake = FakePostcode as unknown as PostcodeConstructor;

describe('toPostcodeResult', () => {
  it.each([
    [raw(), '서울 강남구 테헤란로 152', '서울 강남구 역삼동 737'],
    // 지번을 고르면 roadAddress가 비고 대응 도로명은 auto*에 온다
    [
      raw({ roadAddress: '', autoRoadAddress: '서울 강남구 테헤란로 152' }),
      '서울 강남구 테헤란로 152',
      '서울 강남구 역삼동 737',
    ],
    [
      raw({ jibunAddress: '', autoJibunAddress: '서울 강남구 역삼동 737' }),
      '서울 강남구 테헤란로 152',
      '서울 강남구 역삼동 737',
    ],
    [raw({ roadAddress: '', autoRoadAddress: '' }), '', '서울 강남구 역삼동 737'],
  ])('%j → 도로명 %s · 지번 %s', (data, road, jibun) => {
    expect(toPostcodeResult(data)).toEqual({
      roadAddress: road,
      jibunAddress: jibun,
      sido: '서울',
      sigungu: '강남구',
      bname: '역삼동',
      sigunguCode: '11680',
      zonecode: '06236',
    });
  });
});

describe('loadPostcode', () => {
  afterEach(() => {
    delete window.kakao;
    scripts().forEach((s) => s.remove());
  });

  it('스크립트를 한 번만 넣고, 불러오면 Postcode를 넘긴다', async () => {
    const first = loadPostcode();
    const second = loadPostcode();
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]!.async).toBe(true);
    window.kakao = { Postcode: Fake };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(first).resolves.toBe(Fake);
    await expect(second).resolves.toBe(Fake);
    // 이미 있으면 스크립트를 더 넣지 않는다
    await expect(loadPostcode()).resolves.toBe(Fake);
    expect(scripts()).toHaveLength(1);
  });

  it('불러오지 못하면 실패를 넘기고, 다음 호출에서 다시 받는다', async () => {
    const failed = loadPostcode();
    scripts()[0]!.dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('우편번호 스크립트를 불러오지 못했습니다.');
    expect(scripts()).toHaveLength(0);

    const retry = loadPostcode();
    expect(scripts()).toHaveLength(1);
    window.kakao = { Postcode: Fake };
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(Fake);
  });

  it('응답 없이 멈추면 시간 초과로 실패하고, 늦게 온 load는 다음 시도에 끼어들지 않는다', async () => {
    vi.useFakeTimers();
    try {
      const stalled = loadPostcode();
      const late = scripts()[0]!;
      vi.advanceTimersByTime(POSTCODE_TIMEOUT_MS - 1);
      expect(scripts()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      await expect(stalled).rejects.toThrow('우편번호 스크립트가 응답하지 않습니다.');
      expect(scripts()).toHaveLength(0);

      const retry = loadPostcode();
      late.dispatchEvent(new Event('load'));
      expect(scripts()).toHaveLength(1);
      expect(loadPostcode()).toBe(retry);
      window.kakao = { Postcode: Fake };
      scripts()[0]!.dispatchEvent(new Event('load'));
      await expect(retry).resolves.toBe(Fake);
    } finally {
      vi.useRealTimers();
    }
  });

  it('불러오면 시간 초과 타이머를 끈다', async () => {
    vi.useFakeTimers();
    try {
      const p = loadPostcode();
      window.kakao = { Postcode: Fake };
      scripts()[0]!.dispatchEvent(new Event('load'));
      await expect(p).resolves.toBe(Fake);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('스크립트가 Postcode를 내놓지 않으면 실패로 본다', async () => {
    const p = loadPostcode();
    scripts()[0]!.dispatchEvent(new Event('load'));
    await expect(p).rejects.toThrow('우편번호 스크립트에 Postcode가 없습니다.');
    expect(scripts()).toHaveLength(0);
  });
});
