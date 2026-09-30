import {
  REPORT_STATUS,
  commentsSearchSchema,
  mediaSummary,
  reportsSearchSchema,
  reviewsSearchSchema,
  toCommentListInput,
  toReportListInput,
  toReviewListInput,
} from './meta';

describe('reviews search', () => {
  it('리뷰·댓글 목록 입력', () => {
    expect(toReviewListInput(reviewsSearchSchema.parse({}))).toEqual({
      limit: 20,
      cursor: null,
      keyword: null,
      reviewId: null,
      storeId: null,
      accountId: null,
      includeDeleted: false,
    });
    expect(
      toReviewListInput(reviewsSearchSchema.parse({ q: '맛', storeId: 17, deleted: true })),
    ).toMatchObject({ keyword: '맛', storeId: '17', includeDeleted: true });
    expect(toReviewListInput(reviewsSearchSchema.parse({ reviewId: 0 })).reviewId).toBe('0');
    expect(toReviewListInput(reviewsSearchSchema.parse({ reviewId: 'x' })).reviewId).toBeNull();
    expect(toCommentListInput(commentsSearchSchema.parse({ reviewId: 3 }))).toMatchObject({
      reviewId: '3',
      accountId: null,
      includeDeleted: false,
    });
  });

  it('신고: 기본 PENDING, 전체는 null, 상태 지정', () => {
    expect(toReportListInput(reportsSearchSchema.parse({})).status).toBe('PENDING');
    expect(toReportListInput(reportsSearchSchema.parse({ all: true })).status).toBeNull();
    expect(
      toReportListInput(reportsSearchSchema.parse({ status: 'REJECTED', targetType: 'REVIEW' })),
    ).toMatchObject({ status: 'REJECTED', targetType: 'REVIEW' });
    expect(reportsSearchSchema.parse({ status: 'NOPE' }).status).toBeUndefined();
  });
});

describe('표시 문구', () => {
  it('처리된 신고 상태는 콘텐츠 삭제 배지와 다른 말로 보인다', () => {
    expect(REPORT_STATUS.RESOLVED?.label).toBe('처리 완료(대상 삭제)');
  });

  it.each([
    [[], null],
    [['IMAGE'], '사진 1'],
    [['IMAGE', 'IMAGE', 'IMAGE'], '사진 3'],
    [['VIDEO'], '동영상 1'],
    [['IMAGE', 'VIDEO', 'IMAGE'], '사진 2 · 동영상 1'],
  ] as const)('첨부 %j → %s', (types, expected) => {
    expect(mediaSummary(types.map((mediaType) => ({ mediaType })))).toBe(expected);
  });
});
