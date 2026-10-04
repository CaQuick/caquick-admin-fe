import { z } from 'zod';

import { installZodKorean } from '@/shared/lib/zod-locale';

const { createRoot, render } = vi.hoisted(() => {
  const render = vi.fn();
  return { render, createRoot: vi.fn(() => ({ render })) };
});
vi.mock('react-dom/client', () => ({ createRoot }));

const emptyMessage = () => z.string().min(1).safeParse('').error?.issues[0]?.message;

/** 테스트 setup도 한국어 문구를 설치하므로, main.tsx에서 설치가 빠져도 다른 spec은 모른다. */
describe('앱 부팅(main.tsx)', () => {
  afterEach(() => {
    installZodKorean();
    document.getElementById('root')?.remove();
  });

  it('zod 한국어 문구를 설치하고 #root에 앱을 한 번 렌더한다', async () => {
    z.config({ ...z.locales.en(), customError: undefined });
    expect(emptyMessage()).not.toBe('값을 입력해 주세요.');
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);

    await import('./main');

    expect(emptyMessage()).toBe('값을 입력해 주세요.');
    expect(createRoot).toHaveBeenCalledWith(root);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
