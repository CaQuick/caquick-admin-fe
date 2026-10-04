import { toast } from 'sonner';

/** 테스트 설정(setup.ts)이 sonner의 주입 스타일시트를 걷어내는지 고정한다 — 남으면 조작 직후 역할 조회가 약 3배 느려진다 */
describe('테스트 환경의 sonner 스타일시트', () => {
  it('sonner를 불러와도 테스트 시작 시점의 문서에는 토스트 스타일시트가 없다', () => {
    expect(typeof toast).toBe('function');
    const injected = [...document.querySelectorAll('style')].filter((el) =>
      el.textContent?.includes('data-sonner-toaster'),
    );
    expect(injected).toHaveLength(0);
  });
});
