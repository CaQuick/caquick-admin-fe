import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { forgetSearches } from '@/shared/lib/list-return';
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
const S3 = 'https://cq.s3.ap-northeast-2.amazonaws.com/review-media';
const photo = (n: number, sortOrder: number) => ({
  mediaType: 'IMAGE',
  mediaUrl: `${S3}/images/${n}.jpg`,
  thumbnailUrl: null,
  sortOrder,
});
const video = {
  mediaType: 'VIDEO',
  mediaUrl: `${S3}/videos/1.mp4`,
  thumbnailUrl: `${S3}/videos/1.jpg`,
  sortOrder: 2,
};
const review = (id: string, deleted = false, media: unknown[] = []) => ({
  id,
  storeId: '17',
  storeName: '루미',
  productId: '99',
  productName: '딸기 생크림 케이크',
  authorAccountId: '10',
  authorNickname: 'seo',
  rating: 4.5,
  content: '맛있어요',
  commentCount: 2,
  likeCount: 5,
  deleted,
  media,
  createdAt: '2026-09-01T00:00:00.000Z',
});
const comment = (id: string, reviewId: string) => ({
  id,
  reviewId,
  authorAccountId: '11',
  authorNickname: null,
  content: `동의 ${id}\n둘째 줄`,
  deleted: false,
  createdAt: '2026-09-03T00:00:00.000Z',
});
const report = (id: string, status = 'PENDING', extra: Record<string, unknown> = {}) => ({
  id,
  targetType: 'REVIEW',
  targetId: '7',
  reporterAccountId: '20',
  reporterNickname: '신고왕',
  reporterWithdrawn: false,
  reason: 'ABUSE',
  detail: '욕설',
  contentSnapshot: '나쁜 말',
  status,
  resolvedByAccountId: null,
  resolvedByLabel: null,
  resolvedAt: null,
  resolutionNote: null,
  createdAt: '2026-09-02T00:00:00.000Z',
  ...extra,
});
const target = (extra: Record<string, unknown> = {}) => ({
  id: '7',
  reviewId: null,
  authorAccountId: '10',
  authorNickname: 'seo',
  content: '나쁜 말(수정됨)',
  storeId: '17',
  storeName: '루미 케이크',
  deleted: false,
  media: [],
  ...extra,
});
const page = <T,>(items: T[]) => ({
  items,
  totalCount: items.length,
  hasMore: false,
  nextCursor: null,
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

const beforeEachBoot = () => {
  // '목록으로'는 마지막에 본 목록 필터로 돌아간다 — 앞 테스트의 기록을 비운다
  forgetSearches();
  useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
};

describe('리뷰·댓글', () => {
  beforeEach(beforeEachBoot);

  it('리뷰 목록: 상품명·첨부 요약, 삭제 포함 스위치, 강제 삭제(사유 필수)', async () => {
    const inputs: Record<string, unknown>[] = [];
    let deleted: unknown;
    server.use(
      graphql.query('AdminReviews', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminReviews: page([review('7', false, [photo(1, 0), video]), review('8', true)]),
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
    expect(inputs[0]).toMatchObject({ storeId: '17', reviewId: null, includeDeleted: false });
    expect(screen.getAllByRole('link', { name: '딸기 생크림 케이크' })[0]).toHaveAttribute(
      'href',
      '/products/99',
    );
    expect(screen.getByText('사진 1 · 동영상 1')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '작성일' })).toBeInTheDocument();
    // 주소로 들어온 매장 필터는 목록 행의 매장명으로 보인다
    expect(screen.getByRole('combobox', { name: /^매장/ })).toHaveTextContent('루미');
    expect(screen.getByText('삭제됨')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '리뷰 8 삭제' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: '삭제 포함' }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ includeDeleted: true }));

    await userEvent.click(screen.getByRole('button', { name: '리뷰 7 삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('리뷰를 삭제할까요?');
    expect(dialog).toHaveTextContent('처리 완료(대상 삭제)로 닫힙니다.');
    expect(within(dialog).getByRole('button', { name: '삭제' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '광고성');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ reviewId: '7', reason: '광고성' }));
    expect(await screen.findByText('리뷰를 삭제했습니다.')).toBeInTheDocument();
    // 삭제 다이얼로그 안의 클릭이 행까지 올라가 전문 시트를 열지 않는다
    expect(screen.queryByRole('dialog', { name: /리뷰 #7/ })).not.toBeInTheDocument();
  });

  it('리뷰 행을 누르면 전문 시트에 본문·사진(새 탭)·동영상 링크·매장·상품을 보인다', async () => {
    server.use(
      gqlOk('AdminReviews', {
        adminReviews: page([
          { ...review('7', false, [video, photo(2, 1), photo(1, 0)]), content: '첫 줄\n둘째 줄' },
        ]),
      }),
    );
    boot('/reviews');
    const row = (await screen.findByRole('button', { name: '리뷰 7 전문 보기' })).closest('tr')!;
    await userEvent.click(within(row).getByRole('cell', { name: /댓글 · 좋아요|2 · 5/ }));
    const sheet = await screen.findByRole('dialog', { name: /리뷰 #7/ });
    expect(sheet).toHaveTextContent('첫 줄 둘째 줄');
    const links = within(sheet).getAllByRole('link', { name: /원본 보기|동영상 열기/ });
    // sortOrder 순서: 사진 1(0) → 사진 2(1) → 동영상(2)
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual([
      '사진 1 원본 보기(새 탭)',
      '사진 2 원본 보기(새 탭)',
      '동영상 열기(새 탭)',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      `${S3}/images/1.jpg`,
      `${S3}/images/2.jpg`,
      `${S3}/videos/1.mp4`,
    ]);
    for (const a of links) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    }
    // 동영상은 인라인 재생하지 않는다(CSP media-src 없음)
    expect(sheet.querySelector('video')).toBeNull();
    expect(within(sheet).getByRole('link', { name: '딸기 생크림 케이크' })).toHaveAttribute(
      'href',
      '/products/99',
    );
    expect(within(sheet).getByRole('link', { name: '루미' })).toHaveAttribute('href', '/stores/17');
    expect(within(sheet).getByRole('link', { name: '2개 보기' })).toHaveAttribute(
      'href',
      '/review-comments?reviewId=7',
    );
    expect(within(sheet).getByRole('button', { name: '리뷰 7 삭제' })).toBeInTheDocument();
  });

  it('첨부가 없거나 삭제된 리뷰의 시트는 첨부 없음 문구를 보이고 삭제 버튼을 두지 않는다', async () => {
    server.use(gqlOk('AdminReviews', { adminReviews: page([review('8', true)]) }));
    boot('/reviews?deleted=true');
    await userEvent.click(await screen.findByRole('button', { name: '리뷰 8 전문 보기' }));
    const sheet = await screen.findByRole('dialog', { name: /리뷰 #8/ });
    expect(sheet).toHaveTextContent('첨부한 사진·동영상이 없습니다.');
    expect(within(sheet).getByText('삭제됨')).toBeInTheDocument();
    expect(within(sheet).queryByRole('button', { name: /삭제$/ })).not.toBeInTheDocument();
  });

  it('행 안의 링크를 누르면 시트를 열지 않고 이동한다', async () => {
    server.use(
      gqlOk('AdminReviews', { adminReviews: page([review('7')]) }),
      gqlOk('AdminReviewComments', { adminReviewComments: page([comment('c1', '7')]) }),
    );
    boot('/reviews');
    await screen.findByRole('button', { name: '리뷰 7 전문 보기' });
    await userEvent.click(screen.getByRole('link', { name: '댓글' }));
    expect(await screen.findByRole('button', { name: '댓글 c1 전문 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('리뷰 번호 필터는 주소의 reviewId를 요청에 싣는다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminReviews', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminReviews: page([review('7')]) } });
      }),
    );
    boot('/reviews?reviewId=7&deleted=true');
    await screen.findByRole('button', { name: '리뷰 7 전문 보기' });
    expect(inputs[0]).toMatchObject({ reviewId: '7', includeDeleted: true });
    expect(screen.getByRole('textbox', { name: '리뷰 번호' })).toHaveValue('7');
  });

  it('작성자 선택기에서 구매자를 고르면 accountId로 거른다', async () => {
    const inputs: Record<string, unknown>[] = [];
    let userInput: unknown;
    server.use(
      graphql.query('AdminReviews', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminReviews: page([review('7')]) } });
      }),
      graphql.query('AdminReviewAuthorPicker', ({ variables }) => {
        userInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: {
            adminUsers: {
              items: [
                { accountId: '10', nickname: 'seo', name: null, email: null },
                { accountId: '12', nickname: null, name: null, email: 'a@b.c' },
              ],
            },
          },
        });
      }),
    );
    boot('/reviews');
    await screen.findByRole('button', { name: '리뷰 7 전문 보기' });
    await userEvent.click(screen.getByRole('combobox', { name: /^작성자/ }));
    expect(await screen.findByRole('option', { name: /a@b\.c/ })).toBeInTheDocument();
    expect(userInput).toEqual({ keyword: null, limit: 20 });
    await userEvent.click(screen.getByRole('option', { name: /seo/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ accountId: '10' }));
  });

  it('매장 선택기는 숨긴 매장도 보이고 고르면 storeId로 거른다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminReviews', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminReviews: page([review('7')]) } });
      }),
      gqlOk('AdminReviewStorePicker', {
        adminStores: {
          items: [
            { id: '17', storeName: '루미', isActive: true },
            { id: '18', storeName: '달빛', isActive: false },
          ],
        },
      }),
    );
    boot('/reviews');
    await screen.findByRole('button', { name: '리뷰 7 전문 보기' });
    await userEvent.click(screen.getByRole('combobox', { name: /^매장/ }));
    expect(await screen.findByRole('option', { name: /달빛.*#18 · 숨김/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: /달빛/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ storeId: '18' }));
  });

  it('댓글 목록: 리뷰 링크는 그 리뷰 1건(삭제 포함)으로, 행을 누르면 전문 시트, 삭제', async () => {
    let input: Record<string, unknown> | undefined;
    let deleted: unknown;
    server.use(
      graphql.query('AdminReviewComments', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({ data: { adminReviewComments: page([comment('c1', '7')]) } });
      }),
      graphql.mutation('AdminDeleteReviewComment', ({ variables }) => {
        deleted = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminDeleteReviewComment: true } });
      }),
    );
    boot('/review-comments?reviewId=7');
    const open = await screen.findByRole('button', { name: '댓글 c1 전문 보기' });
    expect(input).toMatchObject({ reviewId: '7' });
    expect(screen.getByRole('link', { name: '리뷰 #7' })).toHaveAttribute(
      'href',
      '/reviews?reviewId=7&deleted=true',
    );
    await userEvent.click(open);
    const sheet = await screen.findByRole('dialog', { name: /댓글 #c1/ });
    expect(sheet).toHaveTextContent('동의 c1 둘째 줄');
    expect(within(sheet).getByRole('link', { name: '#11' })).toHaveAttribute('href', '/users/11');
    expect(within(sheet).getByRole('link', { name: '리뷰 #7' })).toHaveAttribute(
      'href',
      '/reviews?reviewId=7&deleted=true',
    );
    await userEvent.click(within(sheet).getByRole('button', { name: '댓글 c1 삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '댓글을 삭제할까요?' });
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '도배');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ commentId: 'c1', reason: '도배' }));
  });
});

describe('신고', () => {
  beforeEach(beforeEachBoot);

  it('목록 기본은 PENDING, 전체 선택은 null', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminReviewReports', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminReviewReports: page([report('r1')]) } });
      }),
    );
    boot('/reports');
    expect(await screen.findByRole('link', { name: '나쁜 말' })).toHaveAttribute(
      'href',
      '/reports/r1',
    );
    expect(inputs[0]).toMatchObject({ status: 'PENDING', targetType: null });
    expect(screen.getByRole('columnheader', { name: '접수일' })).toBeInTheDocument();
    // "전체"는 URL all=true → status: null (Select 상호작용은 Radix 포인터 API 의존이라 URL로 검증)
    window.history.pushState({}, '', '/reports?all=true&targetType=REVIEW_COMMENT');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toMatchObject({ status: null, targetType: 'REVIEW_COMMENT' }),
    );
  });

  it('목록 신고자: 닉네임·탈퇴 여부 조합별 표시', async () => {
    const cases = [
      { id: 'a', nickname: '신고왕', withdrawn: false, link: '신고왕', badge: false },
      { id: 'b', nickname: '떠난이', withdrawn: true, link: '떠난이', badge: true },
      { id: 'c', nickname: null, withdrawn: true, link: null, badge: true },
      { id: 'd', nickname: null, withdrawn: false, link: '#20', badge: false },
    ];
    server.use(
      gqlOk('AdminReviewReports', {
        adminReviewReports: page(
          cases.map((c) =>
            report(c.id, 'RESOLVED', {
              reporterNickname: c.nickname,
              reporterWithdrawn: c.withdrawn,
              contentSnapshot: c.id === 'd' ? null : `본문 ${c.id}`,
            }),
          ),
        ),
      }),
    );
    boot('/reports?all=true');
    await screen.findByRole('link', { name: '본문 a' });
    const rows = screen.getAllByRole('row').slice(1);
    for (const [i, c] of cases.entries()) {
      const row = rows[i]!;
      const reporter = within(row).getAllByRole('cell')[3]!;
      const link = within(reporter).queryByRole('link');
      if (c.link === null) {
        expect(link).toBeNull();
      } else {
        expect(link).toHaveTextContent(c.link);
        expect(link).toHaveAttribute('href', '/users/20');
      }
      expect(within(reporter).queryByText('탈퇴 회원') !== null).toBe(c.badge);
      expect(within(row).getByText('처리 완료(대상 삭제)')).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: '(신고 당시 내용 없음)' })).toBeInTheDocument();
  });

  it('상세: 리뷰 대상은 사진·매장명·리뷰 링크를 보이고, 대상 삭제(메모 선택) 뒤 처리자 라벨을 보인다', async () => {
    let status = 'PENDING';
    let resolved: unknown;
    server.use(
      graphql.query('AdminReviewReport', () =>
        HttpResponse.json({
          data: {
            adminReviewReport: {
              report: report('r1', status, {
                resolvedAt: status === 'PENDING' ? null : '2026-09-03T00:00:00.000Z',
                resolvedByAccountId: status === 'PENDING' ? null : '1',
                resolvedByLabel: status === 'PENDING' ? null : '운영자(ops.admin)',
              }),
              target: target({ deleted: status !== 'PENDING', media: [photo(1, 0), video] }),
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
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/reports');
    expect(
      decodeURIComponent(screen.getByRole('link', { name: '감사 이력' }).getAttribute('href')!),
    ).toBe('/audit-logs?targetType=REVIEW_REPORT&targetId=r1');
    expect(screen.getByRole('link', { name: '신고왕' })).toHaveAttribute('href', '/users/20');
    expect(screen.getByRole('link', { name: '루미 케이크' })).toHaveAttribute('href', '/stores/17');
    expect(screen.getByRole('link', { name: '리뷰 #7' })).toHaveAttribute(
      'href',
      '/reviews?reviewId=7&deleted=true',
    );
    expect(screen.getByRole('link', { name: '사진 1 원본 보기(새 탭)' })).toHaveAttribute(
      'href',
      `${S3}/images/1.jpg`,
    );
    expect(screen.getByRole('link', { name: '동영상 열기(새 탭)' })).toHaveAttribute(
      'target',
      '_blank',
    );

    await userEvent.click(screen.getByRole('button', { name: '대상 삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '리뷰를 삭제할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() =>
      expect(resolved).toEqual({ reportId: 'r1', action: 'DELETE_TARGET', note: null }),
    );
    expect(await screen.findByText('처리 완료(대상 삭제)')).toBeInTheDocument();
    expect(screen.getByText('삭제됨')).toBeInTheDocument(); // 대상 배지
    expect(screen.getByText(/처리자 운영자\(ops\.admin\)/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '대상 삭제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '반려' })).not.toBeInTheDocument();
  });

  it.each([
    { label: '운영자(ops.admin)', id: '1', shown: '처리자 운영자(ops.admin)' },
    { label: null, id: '1', shown: '처리자 #1' },
    { label: null, id: null, shown: '처리자 없음(자동으로 닫힘)' },
  ])('상세 처리자: 라벨 $label · ID $id → "$shown"', async ({ label, id, shown }) => {
    server.use(
      gqlOk('AdminReviewReport', {
        adminReviewReport: {
          report: report('r1', 'RESOLVED', {
            resolvedAt: '2026-09-03T00:00:00.000Z',
            resolvedByAccountId: id,
            resolvedByLabel: label,
          }),
          target: target({ deleted: true }),
        },
      }),
    );
    boot('/reports/r1');
    expect(await screen.findByText(new RegExp(shown.replace(/[()]/g, '\\$&')))).toBeInTheDocument();
  });

  it('상세: 댓글 대상은 사진 줄 없이 상위 리뷰 링크, 탈퇴 신고자는 배지만, 삭제 확인은 "댓글을"', async () => {
    server.use(
      gqlOk('AdminReviewReport', {
        adminReviewReport: {
          report: report('r2', 'PENDING', {
            targetType: 'REVIEW_COMMENT',
            targetId: 'c1',
            reporterNickname: null,
            reporterWithdrawn: true,
          }),
          target: target({ id: 'c1', reviewId: '7', content: '댓글 본문' }),
        },
      }),
    );
    boot('/reports/r2');
    expect(await screen.findByText('댓글 본문')).toBeInTheDocument();
    expect(screen.queryByText('사진·동영상')).not.toBeInTheDocument();
    expect(screen.getByText('상위 리뷰')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '리뷰 #7' })).toHaveAttribute(
      'href',
      '/reviews?reviewId=7&deleted=true',
    );
    expect(screen.getByText('탈퇴 회원')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '#20' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '대상 삭제' }));
    expect(await screen.findByRole('dialog', { name: '댓글을 삭제할까요?' })).toBeInTheDocument();
  });

  it('반려 실패는 토스트', async () => {
    server.use(
      gqlOk('AdminReviewReport', {
        adminReviewReport: {
          report: report('r1'),
          target: target({ authorNickname: null, content: null }),
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

  it('상세 조회 실패면 오류와 목록으로 링크', async () => {
    server.use(
      gqlError('AdminReviewReport', {
        message: '신고를 찾을 수 없습니다.',
        code: 'REPORT_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/reports/404');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/reports');
  });
});
