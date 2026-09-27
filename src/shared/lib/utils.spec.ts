import { cn } from './utils';

describe('cn', () => {
  it('충돌하는 Tailwind 클래스는 뒤의 것이 이긴다', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('falsy 값은 버린다', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});
