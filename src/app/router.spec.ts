import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { optionalIdText } from '@/shared/lib/list-search';

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

interface RouteLike {
  id: string;
  options: { validateSearch?: unknown };
}

describe('ID 검색 파라미터 정밀도', () => {
  const router = createAppRouter(new QueryClient());

  /** 라우트 검색 스키마에서 optionalIdText를 쓰는 키 전부. */
  const routes = Object.values(router.routesById as unknown as Record<string, RouteLike>);
  const idFilters = routes.flatMap((route) => {
    const schema: unknown = route.options.validateSearch;
    if (!(schema instanceof z.ZodObject)) return [];
    return Object.entries(schema.shape as Record<string, unknown>)
      .filter(([, field]) => field === optionalIdText)
      .map(([key]) => ({ routeId: route.id, key, schema }));
  });

  it('ID 필터 목록이 아래 표와 같다(새 ID 필터가 생기면 표에 들어간다)', () => {
    expect(idFilters.map(({ routeId, key }) => `${routeId} ${key}`).sort()).toEqual(
      [
        '/_authed/_shell/audit-logs actorId',
        '/_authed/_shell/audit-logs storeId',
        '/_authed/_shell/audit-logs targetId',
        '/_authed/_shell/orders/ accountId',
        '/_authed/_shell/orders/ storeId',
        '/_authed/_shell/products/ storeId',
        '/_authed/_shell/review-comments accountId',
        '/_authed/_shell/review-comments reviewId',
        '/_authed/_shell/reviews accountId',
        '/_authed/_shell/reviews storeId',
        '/_authed/_shell/stores/ regionId',
      ].sort(),
    );
  });

  // 기본 JSON 파서는 2^53을 넘는 숫자를 반올림한다(2^53+1 → 다른 ID, 2^64-1 → 상한 초과로 필터 해제)
  const cases: [string, string, string | undefined][] = [
    ['2^53+1', '9007199254740993', '9007199254740993'],
    ['2^64-1(UNSIGNED BIGINT 최대)', '18446744073709551615', '18446744073709551615'],
    ['2^64(상한 초과)', '18446744073709551616', undefined],
    ['앞자리 0', '0018446744073709551615', '0018446744073709551615'],
    ['옛 따옴표 주소', '%2218446744073709551615%22', '18446744073709551615'],
    ['옛 따옴표 주소 2^53+1', '%229007199254740993%22', '9007199254740993'],
  ];

  describe.each(idFilters)('$routeId $key', ({ key, schema }) => {
    it.each(cases)('%s: URL → 라우트 스키마를 지나도 문자열 그대로다', (_, raw, expected) => {
      const search = schema.parse(router.options.parseSearch(`?${key}=${raw}`));
      expect(search[key]).toBe(expected);
    });
  });
});
