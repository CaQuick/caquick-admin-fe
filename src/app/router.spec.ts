import { QueryClient } from '@tanstack/react-query';

import { createAppRouter } from './router';

describe('createAppRouter', () => {
  it('검색 파라미터를 따옴표 없이 직렬화한다', () => {
    const router = createAppRouter(new QueryClient());
    expect(router.options.stringifySearch({ deleted: 'true', storeId: '17' })).toBe(
      '?deleted=true&storeId=17',
    );
  });

  it('기본 직렬화로 만든 옛 주소도 같은 값으로 읽는다', () => {
    const router = createAppRouter(new QueryClient());
    expect(router.options.parseSearch('?deleted=%22true%22&storeId=17')).toEqual({
      deleted: 'true',
      storeId: '17',
    });
  });
});
