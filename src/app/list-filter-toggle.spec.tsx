import { render, screen } from '@testing-library/react';

import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { App } from './app';

const emptyPage = { items: [], totalCount: 0, hasMore: false, nextCursor: null };

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', {
      adminMe: {
        accountId: '1',
        username: 'ops.admin',
        email: null,
        name: null,
        status: 'ACTIVE',
        mustChangePassword: false,
        lastLoginAt: null,
        createdAt: '2026-09-27T00:00:00.000Z',
      },
    }),
    gqlOk('AdminRegions', { adminRegions: [] }),
    gqlOk('AdminCategories', { adminCategories: [] }),
    gqlOk('AdminReviews', { adminReviews: emptyPage }),
    gqlOk('AdminReviewComments', { adminReviewComments: emptyPage }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

/** 필터 줄 안에서 조작할 수 있는 것들(문서 순서 = flex 줄의 왼쪽→오른쪽) */
const controlsIn = (bar: Element) =>
  Array.from(bar.querySelectorAll('input, button, select, textarea, [role="combobox"]'));

describe('목록 보기 범위 토글 위치', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  // 토글을 켠 채로 연다 — 초기화 버튼이 보이는 상태에서도 토글이 끝에 있어야 한다
  it.each([
    ['지역', '/regions?inactive=true', '숨긴 지역 포함'],
    ['카테고리', '/categories?inactive=true', '숨김 포함'],
    ['리뷰', '/reviews?deleted=true', '삭제 포함'],
    ['리뷰 댓글', '/review-comments?deleted=true', '삭제 포함'],
  ])(
    '%s 목록의 토글은 필터 줄의 마지막 컨트롤이고 오른쪽 끝 슬롯에 있다',
    async (_screen, path, name) => {
      boot(path);
      const toggle = await screen.findByRole('switch', { name });
      expect(toggle).toBeChecked();
      const bar = toggle.closest('[data-slot="filter-bar"]');
      expect(bar).not.toBeNull();
      expect(controlsIn(bar!).at(-1)).toBe(toggle);
      expect(bar!.lastElementChild).toHaveAttribute('data-slot', 'filter-bar-trailing');
      expect(bar!.lastElementChild).toContainElement(toggle);
    },
  );
});
