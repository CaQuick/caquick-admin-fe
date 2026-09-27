import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};
const review = (id: string, deleted = false) => ({
  id,
  storeId: '17',
  storeName: '루미',
  productId: '99',
  authorAccountId: '10',
  authorNickname: 'seo',
  rating: 4.5,
  content: '맛있어요',
  commentCount: 2,
  likeCount: 5,
  deleted,
  createdAt: '2026-09-01T00:00:00.000Z',
});
const report = (id: string, status = 'PENDING') => ({
  id,
  targetType: 'REVIEW',
  targetId: '7',
  reporterAccountId: '20',
  reason: 'ABUSE',
  detail: '욕설',
  contentSnapshot: '나쁜 말',
  status,
  resolvedByAccountId: null,
  resolvedAt: null,
  resolutionNote: null,
  createdAt: '2026-09-02T00:00:00.000Z',
});

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('리뷰·댓글', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('리뷰 목록: 삭제 포함 스위치, 강제 삭제(사유 필수)', async () => {
    const inputs: Record<string, unknown>[] = [];
    let deleted: unknown;
    server.use(
      graphql.query('AdminReviews', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminReviews: {
              items: [review('7'), review('8', true)],
              totalCount: 2,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
      graphql.mutation('AdminDeleteReview', ({ variables }) => {
        deleted = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminDeleteReview: true } });
      }),
    );
    boot('/reviews?storeId=17');
    expect(await screen.findAllByText('맛있어요')).toHaveLength(2);
    expect(inputs[0]).toMatchObject({ storeId: '17', includeDeleted: false });
    expect(screen.getByText('삭제됨')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '리뷰 8 삭제' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: '삭제 포함' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ includeDeleted: true }));

    await userEvent.click(screen.getByRole('button', { name: '리뷰 7 삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: '삭제' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '광고성');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ reviewId: '7', reason: '광고성' }));
  });

  it('댓글 목록: 리뷰 ID 필터·삭제', async () => {
    let input: Record<string, unknown> | undefined;
    let deleted: unknown;
    server.use(
      graphql.query('AdminReviewComments', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminReviewComments: {
              items: [
                {
                  id: 'c1',
                  reviewId: '7',
                  authorAccountId: '11',
                  authorNickname: null,
                  content: '동의',
                  deleted: false,
                  createdAt: '2026-09-03T00:00:00.000Z',
                },
              ],
              totalCount: 1,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
      graphql.mutation('AdminDeleteReviewComment', ({ variables }) => {
        deleted = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminDeleteReviewComment: true } });
      }),
    );
    boot('/review-comments?reviewId=7');
    expect(await screen.findByText('동의')).toBeInTheDocument();
    expect(input).toMatchObject({ reviewId: '7' });
    await userEvent.click(screen.getByRole('button', { name: '댓글 c1 삭제' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '도배');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ commentId: 'c1', reason: '도배' }));
  });
});

describe('신고', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록 기본은 PENDING, 전체 선택은 null', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminReviewReports', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminReviewReports: {
              items: [report('r1')],
              totalCount: 1,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
    );
    boot('/reports');
    expect(await screen.findByRole('link', { name: '나쁜 말' })).toHaveAttribute(
      'href',
      '/reports/r1',
    );
    expect(inputs[0]).toMatchObject({ status: 'PENDING', targetType: null });
    // "전체"는 URL all=true → status: null (Select 상호작용은 Radix 포인터 API 의존이라 URL로 검증)
    window.history.pushState({}, '', '/reports?all=true&targetType=REVIEW_COMMENT');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ status: null, targetType: 'REVIEW_COMMENT' }),
    );
  });

  it('상세: 대상 삭제(메모 선택) → 상태 갱신, 처리된 신고는 버튼 없음', async () => {
    let status = 'PENDING';
    let resolved: unknown;
    server.use(
      graphql.query('AdminReviewReport', () =>
        HttpResponse.json({
          data: {
            adminReviewReport: {
              report: {
                ...report('r1', status),
                resolvedAt: status === 'PENDING' ? null : '2026-09-03T00:00:00.000Z',
                resolvedByAccountId: status === 'PENDING' ? null : '1',
              },
              target: {
                id: '7',
                reviewId: null,
                authorAccountId: '10',
                authorNickname: 'seo',
                content: '나쁜 말(수정됨)',
                storeId: '17',
                deleted: status !== 'PENDING',
              },
            },
          },
        }),
      ),
      graphql.mutation('AdminResolveReviewReport', ({ variables }) => {
        resolved = (variables as { input: unknown }).input;
        status = 'RESOLVED';
        return HttpResponse.json({ data: { adminResolveReviewReport: { id: 'r1', status } } });
      }),
    );
    boot('/reports/r1');
    expect(await screen.findByText('나쁜 말(수정됨)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '대상 삭제' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() =>
      expect(resolved).toEqual({ reportId: 'r1', action: 'DELETE_TARGET', note: null }),
    );
    await vi.waitFor(() => expect(screen.getAllByText('삭제됨')).toHaveLength(2)); // 신고 상태 + 대상
    expect(screen.queryByRole('button', { name: '대상 삭제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '반려' })).not.toBeInTheDocument();
  });

  it('반려 실패는 토스트', async () => {
    server.use(
      gqlOk('AdminReviewReport', {
        adminReviewReport: {
          report: report('r1'),
          target: {
            id: '7',
            reviewId: null,
            authorAccountId: '10',
            authorNickname: null,
            content: null,
            storeId: '17',
            deleted: false,
          },
        },
      }),
      gqlError('AdminResolveReviewReport', {
        message: '이미 처리된 신고',
        code: 'REPORT_ALREADY_RESOLVED',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/reports/r1');
    await userEvent.click(await screen.findByRole('button', { name: '반려' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '반려' }));
    expect(await screen.findByText('이미 처리된 신고')).toBeInTheDocument();
  });
});
