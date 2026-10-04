import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';
import { toast } from 'sonner';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { type AdminSearchKeywordChipsQuery } from '@/graphql/generated/graphql';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

type Chip = AdminSearchKeywordChipsQuery['adminSearchKeywordChips'][number];

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
const chip = (id: string, keyword: string, over: Partial<Chip> = {}): Chip => ({
  id,
  keyword,
  sortOrder: Number(id),
  isActive: true,
  startsAt: null,
  endsAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-10-02T03:00:00.000Z',
  ...over,
});
// 노출 중 · 예약 · 노출 중(종료 예정) · 종료 · 숨김
const CHIPS = [
  chip('1', '생일'),
  chip('2', '크리스마스', {
    startsAt: '2099-11-30T15:00:00.000Z',
    endsAt: '2099-12-25T15:00:00.000Z',
  }),
  chip('3', '당일 픽업', { endsAt: '2099-10-31T14:59:00.000Z' }),
  chip('4', '추석', { startsAt: '2000-09-19T15:00:00.000Z', endsAt: '2000-10-03T15:00:00.000Z' }),
  chip('5', '도시락 케이크', { isActive: false }),
];

function boot(chips: Chip[] = CHIPS) {
  let listCalls = 0;
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    graphql.query('AdminSearchKeywordChips', () => {
      listCalls++;
      return HttpResponse.json({ data: { adminSearchKeywordChips: chips } });
    }),
  );
  window.history.pushState({}, '', '/search-chips');
  render(<App />);
  return { listCalls: () => listCalls };
}

const CHIP_GONE = '그사이 삭제된 칩입니다. 목록을 새로 불러왔으니 확인해 주세요.';
/** NOT_FOUND는 칩이 지워졌을 때만 나므로, 이후 목록 조회는 그 칩을 뺀 목록을 준다 */
function listWithoutChip(id: string) {
  let calls = 0;
  server.use(
    graphql.query('AdminSearchKeywordChips', () => {
      calls++;
      return HttpResponse.json({
        data: { adminSearchKeywordChips: CHIPS.filter((c) => c.id !== id) },
      });
    }),
  );
  return () => calls;
}

const keywordsInTable = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1]!.textContent);
const rowOf = (keyword: string) => screen.getByRole('cell', { name: keyword }).closest('tr')!;
const handleOf = (keyword: string) =>
  screen.getByRole('button', { name: `${keyword} 순서 바꾸기` });
const dataTransfer = () => ({
  effectAllowed: 'none',
  dropEffect: 'none',
  setData: vi.fn(),
  getData: vi.fn(),
  setDragImage: vi.fn(),
});

describe('검색 칩 목록', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('메뉴는 카탈로그의 배너 다음에 있고, 표는 저장된 순서대로 상태·기간·수정일을 보인다', async () => {
    boot();
    expect(await screen.findByRole('cell', { name: '생일' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation');
    const labels = within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent);
    expect(labels.slice(labels.indexOf('배너'), labels.indexOf('배너') + 2)).toEqual([
      '배너',
      '검색 칩',
    ]);
    expect(screen.getByRole('heading', { name: '검색 칩', level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/'급상승' 칩은 앱이 늘 맨 앞에 보여 주므로/)).toBeInTheDocument();
    expect(keywordsInTable()).toEqual(['생일', '크리스마스', '당일 픽업', '추석', '도시락 케이크']);
    expect(screen.getByText('전체 5개 ·', { exact: false })).toBeInTheDocument();
  });

  it.each([
    { keyword: '생일', status: '노출 중', period: '제한 없음' },
    { keyword: '크리스마스', status: '예약', period: '2099-12-01 00:00 ~ 2099-12-26 00:00' },
    { keyword: '당일 픽업', status: '노출 중', period: '~ 2099-10-31 23:59' },
    { keyword: '추석', status: '종료', period: '2000-09-20 00:00 ~ 2000-10-04 00:00' },
    { keyword: '도시락 케이크', status: '숨김', period: '제한 없음' },
  ])('$keyword: $status · $period', async ({ keyword, status, period }) => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    const cells = within(rowOf(keyword)).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent(String(CHIPS.findIndex((c) => c.keyword === keyword) + 1));
    expect(cells[2]).toHaveTextContent(status);
    expect(cells[3]).toHaveTextContent(period);
    expect(cells[4]).toHaveTextContent('2026-10-02 12:00');
  });

  it('미리보기는 급상승 고정 칩 뒤에 노출 중인 칩만 저장된 순서대로 보인다', async () => {
    boot();
    const preview = await screen.findByRole('region', { name: '구매자 앱 미리보기' });
    await vi.waitFor(() =>
      expect(
        within(preview)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['급상승 · 고정', '생일', '당일 픽업']),
    );
  });

  it('화면을 켜 둔 채 시작 시각이 되면 예약이 노출 중으로 바뀌고 미리보기에 들어가며, 종료 시각이 되면 빠진다', async () => {
    // 실제 시간도 흐르게 둬 부팅·요청은 그대로 진행되고, 경계 시각만 앞당겨 넘긴다
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const startsAt = new Date(Date.now() + 10 * 60_000).toISOString();
      const endsAt = new Date(Date.now() + 20 * 60_000).toISOString();
      boot([chip('1', '생일'), chip('2', '크리스마스', { startsAt, endsAt })]);
      const status = async () =>
        within(
          (await screen.findByRole('cell', { name: '크리스마스' })).closest('tr')!,
        ).getAllByRole('cell')[2]!.textContent;
      const preview = () =>
        within(screen.getByRole('region', { name: '구매자 앱 미리보기' }))
          .getAllByRole('listitem')
          .map((li) => li.textContent);
      await vi.waitFor(async () => expect(await status()).toBe('예약'));
      expect(preview()).toEqual(['급상승 · 고정', '생일']);
      act(() => {
        vi.advanceTimersByTime(10 * 60_000);
      });
      await vi.waitFor(async () => expect(await status()).toBe('노출 중'));
      expect(preview()).toEqual(['급상승 · 고정', '생일', '크리스마스']);
      act(() => {
        vi.advanceTimersByTime(10 * 60_000);
      });
      await vi.waitFor(async () => expect(await status()).toBe('종료'));
      expect(preview()).toEqual(['급상승 · 고정', '생일']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('노출 중인 칩이 없으면 미리보기에 그렇게 알린다', async () => {
    boot([chip('5', '도시락 케이크', { isActive: false })]);
    const preview = await screen.findByRole('region', { name: '구매자 앱 미리보기' });
    expect(await within(preview).findByText('지금 노출 중인 칩이 없습니다.')).toBeInTheDocument();
  });

  it('칩이 없으면 추가를 안내한다', async () => {
    boot([]);
    expect(
      await screen.findByText("칩이 없습니다. '칩 추가'로 첫 칩을 만들어 주세요."),
    ).toBeInTheDocument();
  });

  it('목록을 불러오지 못하면 오류를 보인다', async () => {
    boot();
    server.use(
      gqlError('AdminSearchKeywordChips', {
        message: '관리자만 볼 수 있습니다.',
        code: 'FORBIDDEN',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('관리자만 볼 수 있습니다.');
  });
});

describe('검색 칩 순서 변경', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('손잡이에서 ↓↑로 옮기면 포커스가 따라가고 스크린 리더에 알리며, 저장하면 전체 ID를 새 순서로 보낸다', async () => {
    let sent: unknown;
    boot();
    server.use(
      graphql.mutation('AdminReorderSearchKeywordChips', ({ variables }) => {
        sent = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminReorderSearchKeywordChips: [] } });
      }),
    );
    await screen.findByRole('cell', { name: '생일' });
    const handle = handleOf('생일');
    expect(handle).toHaveAccessibleDescription(
      '손잡이를 끌거나, 손잡이에서 ↑↓ 키로 순서를 바꿉니다.',
    );

    handle.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('status')).toHaveTextContent('이미 맨 앞입니다.');
    expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(keywordsInTable()).toEqual(['크리스마스', '당일 픽업', '생일', '추석', '도시락 케이크']);
    expect(handleOf('생일')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      '생일을 전체 5개 가운데 3번째로 옮겼습니다.',
    );
    expect(within(rowOf('생일')).getAllByRole('cell')[0]).toHaveTextContent('3');
    expect(screen.getByText('순서를 바꿨습니다.')).toBeInTheDocument();
    expect(screen.getByText('저장해야 구매자 앱에 반영됩니다.')).toBeInTheDocument();

    // 미리보기는 저장된 순서 그대로
    const preview = screen.getByRole('region', { name: '구매자 앱 미리보기' });
    expect(
      within(preview)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['급상승 · 고정', '생일', '당일 픽업']);

    await userEvent.click(screen.getByRole('button', { name: '순서 저장' }));
    await vi.waitFor(() => expect(sent).toEqual({ chipIds: ['2', '3', '1', '4', '5'] }));
    expect(
      await screen.findByText('순서를 저장했습니다. 구매자 앱에 바로 반영됩니다.'),
    ).toBeInTheDocument();
  });

  it('맨 뒤 칩에서 ↓를 누르면 맨 뒤라고 알리고 순서는 그대로다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    handleOf('도시락 케이크').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('status')).toHaveTextContent('이미 맨 뒤입니다.');
    expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();
  });

  it('손잡이를 끌어 다른 칩 위에 놓으면 그 자리로 옮기고, 되돌리기로 서버 순서로 돌아간다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    const dt = dataTransfer();
    // 손잡이를 누르기 전에는 행을 끌 수 없다
    expect(rowOf('추석')).toHaveAttribute('draggable', 'false');
    fireEvent.pointerDown(handleOf('추석'));
    expect(rowOf('추석')).toHaveAttribute('draggable', 'true');
    expect(rowOf('생일')).toHaveAttribute('draggable', 'false');
    fireEvent.dragStart(rowOf('추석'), { dataTransfer: dt });
    expect(dt.setData).toHaveBeenCalledWith('text/plain', '4');
    fireEvent.dragOver(rowOf('크리스마스'), { dataTransfer: dt });
    expect(rowOf('크리스마스').className).toContain('border-t-primary');
    fireEvent.drop(rowOf('크리스마스'), { dataTransfer: dt });
    fireEvent.dragEnd(rowOf('추석'), { dataTransfer: dt });
    expect(rowOf('추석')).toHaveAttribute('draggable', 'false');
    expect(keywordsInTable()).toEqual(['생일', '추석', '크리스마스', '당일 픽업', '도시락 케이크']);
    expect(screen.getByRole('status')).toHaveTextContent(
      '추석을 전체 5개 가운데 2번째로 옮겼습니다.',
    );

    // 아래로 끌어 놓기
    fireEvent.pointerDown(handleOf('생일'));
    fireEvent.dragStart(rowOf('생일'), { dataTransfer: dt });
    fireEvent.dragOver(rowOf('당일 픽업'), { dataTransfer: dt });
    expect(rowOf('당일 픽업').className).toContain('border-b-primary');
    fireEvent.drop(rowOf('당일 픽업'), { dataTransfer: dt });
    expect(keywordsInTable()).toEqual(['추석', '크리스마스', '당일 픽업', '생일', '도시락 케이크']);

    await userEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(keywordsInTable()).toEqual(['생일', '크리스마스', '당일 픽업', '추석', '도시락 케이크']);
    expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();
  });

  it('손잡이를 눌렀다 끌지 않고 떼면 행은 다시 끌 수 없다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    fireEvent.pointerDown(handleOf('생일'));
    expect(rowOf('생일')).toHaveAttribute('draggable', 'true');
    fireEvent.pointerUp(handleOf('생일'));
    expect(rowOf('생일')).toHaveAttribute('draggable', 'false');
  });

  it('끌지 않은 채 들어온 드래그(파일 등)는 무시한다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    fireEvent.drop(rowOf('생일'), { dataTransfer: dataTransfer() });
    expect(keywordsInTable()[0]).toBe('생일');
    expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();
  });

  it('원래 자리로 되돌려 놓으면 바뀐 것이 없어 저장 줄이 사라진다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    handleOf('생일').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('순서를 바꿨습니다.')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();
  });

  it('저장 전에는 추가·수정·삭제를 막고 이유를 알린다', async () => {
    boot();
    await screen.findByRole('cell', { name: '생일' });
    handleOf('생일').focus();
    await userEvent.keyboard('{ArrowDown}');
    const reason = '바꾼 순서를 저장하거나 되돌린 뒤에 할 수 있습니다.';
    for (const name of ['칩 추가', '생일 수정', '생일 삭제']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription(reason);
      await userEvent.click(button);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    }
    await userEvent.hover(screen.getByRole('button', { name: '칩 추가' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(reason);
  });

  it.each(['IDS_LENGTH_MISMATCH', 'INVALID_IDS'])(
    '그사이 칩이 추가·삭제돼 %s로 거절되면 안내하고, 목록을 새로 불러오면 바꾼 순서를 버린다',
    async (code) => {
      const { listCalls } = boot();
      server.use(
        gqlError('AdminReorderSearchKeywordChips', {
          message: 'chipIds 개수가 일치하지 않습니다.',
          code,
          classification: 'BAD_USER_INPUT',
          statusCode: 400,
        }),
      );
      await screen.findByRole('cell', { name: '생일' });
      handleOf('생일').focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.click(screen.getByRole('button', { name: '순서 저장' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '다른 관리자가 그사이 칩을 추가하거나 삭제해 순서를 저장하지 못했습니다. 목록을 새로 불러온 뒤 다시 정렬해 주세요.',
      );
      const before = listCalls();
      await userEvent.click(screen.getByRole('button', { name: '목록 새로 불러오기' }));
      await vi.waitFor(() => expect(listCalls()).toBe(before + 1));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(keywordsInTable()[0]).toBe('생일');
      expect(screen.queryByText('순서를 바꿨습니다.')).not.toBeInTheDocument();
    },
  );

  it('그 밖의 저장 실패는 토스트로 알리고 바꾼 순서를 유지한다', async () => {
    boot();
    server.use(
      gqlError('AdminReorderSearchKeywordChips', {
        message: '같은 칩이 두 번 들어 있습니다.',
        code: 'DUPLICATE_IDS',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    await screen.findByRole('cell', { name: '생일' });
    handleOf('생일').focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(screen.getByRole('button', { name: '순서 저장' }));
    expect(await screen.findByText('같은 칩이 두 번 들어 있습니다.')).toBeInTheDocument();
    expect(screen.getByText('순서를 바꿨습니다.')).toBeInTheDocument();
    expect(keywordsInTable()[1]).toBe('생일');
  });
});

describe('검색 칩 추가·수정·삭제', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false });
    // sonner는 살아 있는 토스트를 새 Toaster에 다시 보여 주므로 앞 케이스의 토스트를 걷어 낸다
    toast.dismiss();
  });

  it('추가: 빈 키워드·거꾸로 된 기간을 막고, 정규화한 키워드와 UTC 기간을 보낸다', async () => {
    let created: unknown;
    boot();
    server.use(
      graphql.mutation('AdminCreateSearchKeywordChip', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminCreateSearchKeywordChip: { id: '9', keyword: '신년 선물' } },
        });
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '칩 추가' }));
    const dialog = await screen.findByRole('dialog', { name: '칩 추가' });
    expect(dialog).toHaveTextContent('새 칩은 목록 맨 뒤에 추가됩니다.');
    expect(dialog).toHaveTextContent(
      '1~200자입니다. 앞뒤 공백은 지우고, 연속된 공백은 한 칸으로 저장합니다.',
    );
    expect(within(dialog).getByRole('switch', { name: '구매자 화면에 노출' })).toBeChecked();
    expect(
      within(dialog).getByRole('switch', { name: '구매자 화면에 노출' }),
    ).toHaveAccessibleDescription('끄면 기간과 관계없이 숨깁니다.');

    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByText('키워드를 입력해 주세요.')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByRole('textbox', { name: '키워드' }), '  신년   선물 ');
    fireEvent.change(within(dialog).getByLabelText('시작'), {
      target: { value: '2026-12-27T00:00' },
    });
    fireEvent.change(within(dialog).getByLabelText('종료'), {
      target: { value: '2026-12-01T00:00' },
    });
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(
      await within(dialog).findByText('종료 시각은 시작 시각보다 뒤로 정해 주세요.'),
    ).toBeInTheDocument();
    expect(created).toBeUndefined();

    fireEvent.change(within(dialog).getByLabelText('종료'), {
      target: { value: '2027-01-06T00:00' },
    });
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() =>
      expect(created).toEqual({
        keyword: '신년 선물',
        isActive: true,
        startsAt: '2026-12-26T15:00:00.000Z',
        endsAt: '2027-01-05T15:00:00.000Z',
      }),
    );
    expect(
      await screen.findByText('"신년 선물" 칩을 목록 맨 뒤에 추가했습니다.'),
    ).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it.each([
    {
      code: 'SEARCH_KEYWORD_CHIP_TAKEN',
      label: '키워드',
      message: '이미 같은 키워드의 칩이 있습니다. 숨긴 칩도 포함되니 기존 칩을 수정해 주세요.',
    },
    { code: 'KEYWORD_TOO_LONG', label: '키워드', message: '키워드는 200자 이하로 입력해 주세요.' },
    { code: 'KEYWORD_EMPTY', label: '키워드', message: '키워드를 입력해 주세요.' },
    {
      code: 'INVALID_EXPOSURE_WINDOW',
      label: '종료',
      message: '종료 시각은 시작 시각보다 뒤로 정해 주세요.',
    },
  ])('추가 거절 $code는 $label 칸 아래에 보인다', async ({ code, label, message }) => {
    boot();
    server.use(
      gqlError('AdminCreateSearchKeywordChip', {
        message: '서버 원문',
        code,
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '칩 추가' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: '키워드' }), '생일');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    const field =
      label === '키워드'
        ? within(dialog).getByRole('textbox', { name: '키워드' })
        : within(dialog).getByLabelText('종료');
    await vi.waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(within(dialog).getByText(message)).toBeInTheDocument();
    expect(within(dialog).queryByText('서버 원문')).not.toBeInTheDocument();
  });

  it('수정: 바꾼 필드만 보내고, 비운 기간은 null로 보낸다', async () => {
    let updated: unknown;
    boot();
    server.use(
      graphql.mutation('AdminUpdateSearchKeywordChip', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminUpdateSearchKeywordChip: { id: '2', keyword: '크리스마스' } },
        });
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '크리스마스 수정' }));
    const dialog = await screen.findByRole('dialog', { name: '칩 수정' });
    expect(within(dialog).getByRole('textbox', { name: '키워드' })).toHaveValue('크리스마스');
    expect(within(dialog).getByLabelText('시작')).toHaveValue('2099-12-01T00:00');
    expect(within(dialog).getByLabelText('종료')).toHaveValue('2099-12-26T00:00');

    fireEvent.change(within(dialog).getByLabelText('시작'), { target: { value: '' } });
    await userEvent.click(within(dialog).getByRole('switch', { name: '구매자 화면에 노출' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updated).toEqual({ chipId: '2', isActive: false, startsAt: null }),
    );
    expect(await screen.findByText('"크리스마스" 칩을 수정했습니다.')).toBeInTheDocument();
  });

  it('수정: 바꾼 것이 없으면 요청 없이 닫는다', async () => {
    let calls = 0;
    boot();
    server.use(
      graphql.mutation('AdminUpdateSearchKeywordChip', () => {
        calls++;
        return HttpResponse.json({ data: null });
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '생일 수정' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls).toBe(0);
  });

  it('수정: 그사이 삭제된 칩이면 토스트로 알리고 닫은 뒤, 그 칩이 빠진 목록을 새로 불러온다', async () => {
    boot();
    server.use(
      gqlError('AdminUpdateSearchKeywordChip', {
        message: '검색 키워드 칩을 찾을 수 없습니다.',
        code: 'SEARCH_KEYWORD_CHIP_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '생일 수정' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: '키워드' }), ' 케이크');
    const refetched = listWithoutChip('1');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(refetched()).toBe(1));
    await vi.waitFor(() => expect(screen.queryByRole('cell', { name: '생일' })).toBeNull());
    expect(screen.getByText(CHIP_GONE)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('삭제: 키워드를 담아 확인하고, 지우면 토스트로 알린다', async () => {
    let deleted: unknown;
    boot();
    server.use(
      graphql.mutation('AdminDeleteSearchKeywordChip', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteSearchKeywordChip: true } });
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '생일 삭제' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('"생일" 칩을 삭제할까요?');
    expect(confirm).toHaveTextContent('삭제한 키워드로 다시 만들 수 있습니다.');
    await userEvent.click(within(confirm).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ chipId: '1' }));
    expect(await screen.findByText('"생일" 칩을 삭제했습니다.')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('삭제: 이미 없는 칩이면 알리고, 그 칩이 빠진 목록을 새로 불러온 뒤 확인 창을 닫는다', async () => {
    boot();
    server.use(
      gqlError('AdminDeleteSearchKeywordChip', {
        message: '검색 키워드 칩을 찾을 수 없습니다.',
        code: 'SEARCH_KEYWORD_CHIP_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '생일 삭제' }));
    const confirm = await screen.findByRole('alertdialog');
    const refetched = listWithoutChip('1');
    await userEvent.click(within(confirm).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(refetched()).toBe(1));
    await vi.waitFor(() => expect(screen.queryByRole('cell', { name: '생일' })).toBeNull());
    expect(screen.getByText(CHIP_GONE)).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('삭제: 그 밖의 실패는 알리고 확인 창을 유지한다', async () => {
    boot();
    server.use(
      gqlError('AdminDeleteSearchKeywordChip', {
        message: '관리자만 할 수 있습니다.',
        code: 'FORBIDDEN',
        classification: 'FORBIDDEN',
        statusCode: 403,
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '생일 삭제' }));
    const confirm = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirm).getByRole('button', { name: '삭제' }));
    expect(await screen.findByText('관리자만 할 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
