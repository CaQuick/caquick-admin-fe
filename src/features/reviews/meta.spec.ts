import {
  commentsSearchSchema,
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
      storeId: null,
      accountId: null,
      includeDeleted: false,
    });
    expect(
      toReviewListInput(reviewsSearchSchema.parse({ q: '맛', storeId: 17, deleted: true })),
    ).toMatchObject({ keyword: '맛', storeId: '17', includeDeleted: true });
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
