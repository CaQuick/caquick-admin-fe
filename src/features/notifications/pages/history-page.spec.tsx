import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { BROADCAST_POLL_MS, type Broadcast, broadcastPollInterval } from '../api/queries';

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

const broadcast = (over: Partial<Broadcast>): Broadcast => ({
  id: '77',
  type: 'SYSTEM',
  title: '점검 안내',
  body: '오늘 밤 12시부터\n1시간 점검합니다.',
  targetKind: 'ACCOUNT_IDS',
  targetCount: 2,
  skippedCount: 1,
  deliveredCount: 2,
  status: 'COMPLETED',
  actorAccountId: '3',
  actorLabel: '이찬우(chanwoo7)',
  requestedAt: '2026-09-30T15:00:00.000Z',
  completedAt: '2026-09-30T15:00:05.000Z',
  targetAccountIds: ['10', '11'],
  skippedAccountIds: ['9'],
  ...over,
});
const ROWS = [
  broadcast({}),
  broadcast({
    id: '76',
    type: 'MARKETING',
    title: '가을 이벤트',
    targetKind: 'ALL_USERS',
    targetCount: 1234,
    skippedCount: 0,
    deliveredCount: 600,
    status: 'DELAYED',
    actorLabel: null,
    completedAt: null,
    targetAccountIds: [],
    skippedAccountIds: [],
  }),
];

function boot(path: string, onInput?: (input: Record<string, unknown>) => void) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    graphql.query('AdminNotificationBroadcasts', ({ variables }) => {
      onInput?.((variables as { input: Record<string, unknown> }).input);
      return HttpResponse.json({
        data: {
          adminNotificationBroadcasts: {
            items: ROWS,
            totalCount: 42,
            hasMore: true,
            nextCursor: '76',
          },
        },
      });
    }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('알림 발송 이력', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('알림 메뉴는 이력 목록이 기본이고, 행마다 대상·저장 수·상태·보낸 사람을 보인다', async () => {
    const inputs: Record<string, unknown>[] = [];
    boot('/notifications', (i) => inputs.push(i));
    const nav = await screen.findByRole('navigation', { name: '주 메뉴' });
    expect(within(nav).getByRole('link', { name: '알림' })).toHaveAttribute(
      'data-status',
      'active',
    );
    expect(screen.getByRole('heading', { level: 1, name: '알림' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '새 알림 보내기' })).toHaveAttribute(
      'href',
      '/notifications/send',
    );

    const first = (await screen.findByRole('button', { name: '점검 안내' })).closest('tr')!;
    expect(
      within(first)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      '2026-10-01 00:00',
      '시스템',
      '점검 안내',
      '지정 2명',
      '2 / 2명',
      '완료',
      '이찬우(chanwoo7)',
    ]);
    const second = screen.getByRole('button', { name: '가을 이벤트' }).closest('tr')!;
    expect(
      within(second)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      '2026-10-01 00:00',
      '마케팅',
      '가을 이벤트',
      '전체 구매자',
      '600 / 1,234명',
      '지연',
      '#3',
    ]);
    expect(screen.getByText('전체 42건')).toBeInTheDocument();
    expect(inputs[0]).toEqual({ limit: 20, cursor: null, type: null, targetKind: null });

    // 유형 필터를 바꾸면 커서를 버리고 다시 읽는다
    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await vi.waitFor(() => expect(inputs.at(-1)).toMatchObject({ cursor: '76' }));
    await userEvent.click(screen.getByRole('combobox', { name: '유형' }));
    await userEvent.click(await screen.findByRole('option', { name: '마케팅' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({
        limit: 20,
        cursor: null,
        type: 'MARKETING',
        targetKind: null,
      }),
    );
  });

  it('제목을 누르면 상세 시트에 본문·대상과 받지 못한 계정 ID를 보이고, 닫으면 주소에서 뺀다', async () => {
    boot('/notifications');
    await userEvent.click(await screen.findByRole('button', { name: '점검 안내' }));
    const sheet = await screen.findByRole('dialog', { name: '점검 안내' });
    expect(window.location.search).toBe('?broadcastId=77');
    expect(within(sheet).getByText(/오늘 밤 12시부터/)).toHaveTextContent(
      '오늘 밤 12시부터 1시간 점검합니다.',
    );
    expect(within(sheet).getByText('이찬우(chanwoo7)')).toBeInTheDocument();
    expect(within(sheet).getByText('1개(탈퇴·정지 등)')).toBeInTheDocument();
    expect(within(sheet).getByText('대상 계정 ID 2개')).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: '10' })).toHaveAttribute('href', '/users/10');
    expect(within(sheet).getByText('받지 못한 계정 ID 1개')).toBeInTheDocument();
    expect(within(sheet).queryByRole('link', { name: '9' })).toBeNull();

    await userEvent.click(within(sheet).getByRole('button', { name: '닫기' }));
    await vi.waitFor(() => expect(window.location.search).toBe(''));
  });

  it('지연된 전체 발송은 확인 요청 문구를 보이고, 대상 계정 목록은 두지 않는다', async () => {
    boot('/notifications?broadcastId=76');
    const sheet = await screen.findByRole('dialog', { name: '가을 이벤트' });
    expect(within(sheet).getByText(/시스템 담당자에게 확인을 요청해 주세요/)).toBeInTheDocument();
    expect(within(sheet).getByText('아직 끝나지 않았습니다.')).toBeInTheDocument();
    expect(within(sheet).getByText('#3')).toBeInTheDocument();
    expect(within(sheet).queryByText(/대상 계정 ID/)).toBeNull();
    expect(within(sheet).queryByText(/받지 못한 계정 ID/)).toBeNull();
  });

  it('주소의 이력이 현재 목록에 없으면 찾지 못했다고 알린다', async () => {
    boot('/notifications?broadcastId=5');
    const sheet = await screen.findByRole('dialog', { name: '발송 이력' });
    expect(
      await within(sheet).findByText(/이 목록에서 해당 발송 이력을 찾지 못했습니다/),
    ).toBeInTheDocument();
  });

  it.each([
    { statuses: ['IN_PROGRESS', 'COMPLETED'] as const, want: BROADCAST_POLL_MS },
    { statuses: ['COMPLETED', 'DELAYED'] as const, want: false },
    { statuses: [] as const, want: false },
    { statuses: undefined, want: false },
  ])('보내는 중인 이력이 있을 때만 다시 읽는다: $statuses', ({ statuses, want }) => {
    expect(broadcastPollInterval(statuses?.map((status) => ({ status })))).toBe(want);
  });
});
