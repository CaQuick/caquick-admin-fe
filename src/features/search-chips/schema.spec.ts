import { ApiError } from '@/shared/api';

import {
  CHIP_MESSAGES,
  type ChipFormValues,
  EMPTY_CHIP,
  applyOrder,
  chipFormSchema,
  chipSaveError,
  formatWindow,
  isReorderConflict,
  moveItem,
  normalizeKeyword,
  sameOrder,
  toChipFormValues,
  toCreateChipInput,
  toUpdateChipInput,
} from './schema';

const apiError = (
  code: string,
  classification: 'BAD_USER_INPUT' | 'NOT_FOUND' = 'BAD_USER_INPUT',
) => new ApiError('서버 원문', classification, code, classification === 'NOT_FOUND' ? 404 : 400);

describe('검색 칩 입력 검증', () => {
  const issues = (patch: Partial<ChipFormValues>) => {
    const r = chipFormSchema.safeParse({ ...EMPTY_CHIP, keyword: '생일', ...patch });
    return r.success ? [] : r.error.issues.map((i) => [i.path.join('.'), i.message]);
  };

  it.each([
    { name: '키워드만 있으면 통과', patch: {}, want: [] },
    { name: '빈 키워드', patch: { keyword: '' }, want: [['keyword', CHIP_MESSAGES.keywordEmpty]] },
    {
      name: '공백뿐인 키워드는 정규화하면 비어 거절',
      patch: { keyword: ' \t ' },
      want: [['keyword', CHIP_MESSAGES.keywordEmpty]],
    },
    { name: '200자는 통과', patch: { keyword: '가'.repeat(200) }, want: [] },
    {
      name: '201자는 거절',
      patch: { keyword: '가'.repeat(201) },
      want: [['keyword', CHIP_MESSAGES.keywordTooLong]],
    },
    {
      name: '앞뒤 공백은 세지 않는다',
      patch: { keyword: `  ${'가'.repeat(200)}  ` },
      want: [],
    },
    {
      name: '이모지 200개는 코드 포인트로 세어 통과',
      patch: { keyword: '🎂'.repeat(200) },
      want: [],
    },
    {
      name: '종료가 시작과 같으면 거절',
      patch: { startsAt: '2026-12-01T00:00', endsAt: '2026-12-01T00:00' },
      want: [['endsAt', CHIP_MESSAGES.window]],
    },
    {
      name: '종료가 시작보다 앞이면 거절',
      patch: { startsAt: '2026-12-26T00:00', endsAt: '2026-12-01T00:00' },
      want: [['endsAt', CHIP_MESSAGES.window]],
    },
    {
      name: '종료가 시작보다 뒤면 통과',
      patch: { startsAt: '2026-12-01T00:00', endsAt: '2026-12-26T00:00' },
      want: [],
    },
    { name: '시작만 있으면 통과', patch: { startsAt: '2026-12-01T00:00' }, want: [] },
    { name: '종료만 있으면 통과', patch: { endsAt: '2026-12-01T00:00' }, want: [] },
  ])('$name', ({ patch, want }) => {
    expect(issues(patch)).toEqual(want);
  });

  it.each([
    ['  레터링   케이크 ', '레터링 케이크'],
    ['당일\t\n픽업', '당일 픽업'],
    ['생일', '생일'],
  ])('키워드 정규화: %j → %j', (raw, want) => {
    expect(normalizeKeyword(raw)).toBe(want);
  });
});

describe('검색 칩 요청 변환', () => {
  const chip = {
    id: '7',
    keyword: '크리스마스',
    sortOrder: 2,
    isActive: true,
    startsAt: '2026-11-30T15:00:00.000Z',
    endsAt: '2026-12-25T15:00:00.000Z',
    createdAt: 'x',
    updatedAt: 'y',
  };
  const before = toChipFormValues(chip);

  it('저장된 기간을 한국 시간 입력값으로 펼친다', () => {
    expect(before).toEqual({
      keyword: '크리스마스',
      isActive: true,
      startsAt: '2026-12-01T00:00',
      endsAt: '2026-12-26T00:00',
    });
    expect(toChipFormValues({ ...chip, startsAt: null, endsAt: null })).toMatchObject({
      startsAt: '',
      endsAt: '',
    });
  });

  it('추가는 정규화한 키워드와 UTC 기간을 보내고, 비운 기간은 null', () => {
    expect(
      toCreateChipInput({ ...EMPTY_CHIP, keyword: ' 신년  선물 ', startsAt: '2026-12-27T00:00' }),
    ).toEqual({
      keyword: '신년 선물',
      isActive: true,
      startsAt: '2026-12-26T15:00:00.000Z',
      endsAt: null,
    });
  });

  it.each([
    { name: '바꾼 것이 없으면 요청하지 않는다', patch: {}, want: null },
    {
      name: '공백만 다른 키워드는 바뀐 것이 아니다',
      patch: { keyword: '  크리스마스 ' },
      want: null,
    },
    {
      name: '키워드는 정규화해서 보낸다',
      patch: { keyword: '크리스마스  케이크' },
      want: { chipId: '7', keyword: '크리스마스 케이크' },
    },
    { name: '노출 끄기만', patch: { isActive: false }, want: { chipId: '7', isActive: false } },
    {
      name: '비운 시작은 null로 보내 경계를 없앤다',
      patch: { startsAt: '' },
      want: { chipId: '7', startsAt: null },
    },
    {
      name: '바꾼 종료만 보낸다',
      patch: { endsAt: '2026-12-31T00:00' },
      want: { chipId: '7', endsAt: '2026-12-30T15:00:00.000Z' },
    },
  ])('수정: $name', ({ patch, want }) => {
    expect(toUpdateChipInput('7', before, { ...before, ...patch })).toEqual(want);
  });
});

describe('검색 칩 표시', () => {
  it.each([
    [null, null, '제한 없음'],
    ['2026-11-30T15:00:00.000Z', null, '2026-12-01 00:00 ~'],
    [null, '2026-10-31T14:59:00.000Z', '~ 2026-10-31 23:59'],
    ['2026-12-26T15:00:00.000Z', '2027-01-05T15:00:00.000Z', '2026-12-27 00:00 ~ 2027-01-06 00:00'],
  ])('노출 기간 %s ~ %s → %s', (s, e, want) => {
    expect(formatWindow(s, e)).toBe(want);
  });
});

describe('검색 칩 저장 오류', () => {
  it.each([
    ['KEYWORD_EMPTY', 'keyword', CHIP_MESSAGES.keywordEmpty, false],
    ['KEYWORD_TOO_LONG', 'keyword', CHIP_MESSAGES.keywordTooLong, false],
    ['SEARCH_KEYWORD_CHIP_TAKEN', 'keyword', CHIP_MESSAGES.keywordTaken, false],
    ['INVALID_EXPOSURE_WINDOW', 'endsAt', CHIP_MESSAGES.window, false],
    ['SEARCH_KEYWORD_CHIP_NOT_FOUND', null, CHIP_MESSAGES.notFound, true],
    ['FORBIDDEN', null, '서버 원문', false],
  ] as const)('%s → 칸 %s', (code, field, message, notFound) => {
    expect(chipSaveError(apiError(code))).toEqual({ field, message, notFound });
  });

  it('ApiError가 아니면 알 수 없는 오류', () => {
    expect(chipSaveError(new Error('x'))).toMatchObject({ field: null, notFound: false });
  });

  it.each([
    ['IDS_LENGTH_MISMATCH', true],
    ['INVALID_IDS', true],
    ['DUPLICATE_IDS', false],
    ['SEARCH_KEYWORD_CHIP_NOT_FOUND', false],
  ])('순서 저장 충돌 판정: %s → %s', (code, want) => {
    expect(isReorderConflict(apiError(code))).toBe(want);
  });

  it('ApiError가 아니면 순서 충돌이 아니다', () => {
    expect(isReorderConflict(new Error('IDS_LENGTH_MISMATCH'))).toBe(false);
  });
});

describe('검색 칩 순서', () => {
  it.each([
    { from: 0, to: 1, want: ['b', 'a', 'c', 'd'] },
    { from: 3, to: 0, want: ['d', 'a', 'b', 'c'] },
    { from: 1, to: 3, want: ['a', 'c', 'd', 'b'] },
    { from: 2, to: 2, want: ['a', 'b', 'c', 'd'] },
    { from: 9, to: 0, want: ['a', 'b', 'c', 'd'] },
  ])('$from번 자리를 $to번 자리로', ({ from, to, want }) => {
    expect(moveItem(['a', 'b', 'c', 'd'], from, to)).toEqual(want);
  });

  const rows = [{ id: '1' }, { id: '2' }, { id: '3' }];
  it.each([
    { name: '순서가 없으면 서버 순서', order: null, want: ['1', '2', '3'] },
    { name: '저장 전 순서를 입힌다', order: ['3', '1', '2'], want: ['3', '1', '2'] },
    { name: '순서에 없는 새 칩은 뒤에 붙는다', order: ['2', '1'], want: ['2', '1', '3'] },
    { name: '사라진 칩은 뺀다', order: ['9', '3', '2', '1'], want: ['3', '2', '1'] },
  ])('$name', ({ order, want }) => {
    expect(applyOrder(rows, order).map((r) => r.id)).toEqual(want);
  });

  it.each([
    [['1', '2'], ['1', '2'], true],
    [['1', '2'], ['2', '1'], false],
    [['1'], ['1', '2'], false],
    [[], [], true],
  ])('같은 순서 %j · %j → %s', (a, b, want) => {
    expect(sameOrder(a, b)).toBe(want);
  });
});
