import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

import { confirmMessage } from '../meta';

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
const users = [
  { accountId: '10', nickname: '케이크러버', name: null, email: null },
  { accountId: '11', nickname: null, name: '김하나', email: null },
  { accountId: '12', nickname: null, name: null, email: 'c@test.dev' },
];

function boot(path = '/notifications/send') {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
    gqlOk('AdminNotificationActiveUserCount', { adminUsers: { totalCount: 1234 } }),
    graphql.query('AdminNotificationUserOptions', ({ variables }) => {
      const keyword = (variables as { input: { keyword: string | null } }).input.keyword ?? '';
      return HttpResponse.json({
        data: {
          adminUsers: {
            items: users.filter((u) =>
              [u.nickname, u.name, u.email].some((v) => v?.includes(keyword)),
            ),
          },
        },
      });
    }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

async function pickUser(name: string) {
  await userEvent.click(screen.getByRole('combobox', { name: /^받을 구매자 추가/ }));
  await userEvent.click(await screen.findByRole('option', { name: new RegExp(name) }));
}

describe('알림 보내기', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it.each([
    { kind: 'ACCOUNT_IDS' as const, picked: 3, active: 99, want: '고른 구매자 3명에게 보냅니다.' },
    {
      kind: 'ALL_USERS' as const,
      picked: 0,
      active: 1234,
      want: '이용 중인 구매자 전체(약 1,234명)에게 보냅니다.',
    },
    {
      kind: 'ALL_USERS' as const,
      picked: 0,
      active: undefined,
      want: '이용 중인 구매자 전체에게 보냅니다.',
    },
  ])('확인 문구: $kind, 고른 $picked명, 이용 중 $active명', ({ kind, picked, active, want }) => {
    expect(confirmMessage(kind, picked, active)).toBe(`${want} 보낸 뒤에는 취소할 수 없습니다.`);
  });

  it('유형 도움말을 보이고, 전체 발송 확인 창에 이용 중인 구매자 수를 대략으로 알린다', async () => {
    boot();
    expect(
      await screen.findByText(/운영 공지에 씁니다\. 서비스 점검·정책 변경처럼/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '마케팅' }));
    expect(screen.getByText('프로모션·이벤트 안내에 씁니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '발송 이력으로' })).toHaveAttribute(
      'href',
      '/notifications',
    );

    await userEvent.click(screen.getByRole('button', { name: '보내기' }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      '이용 중인 구매자 전체(약 1,234명)에게 보냅니다.',
    );
  });

  it('검증 → 구매자 검색·ID 붙여넣기로 고르기 → 확인 → 실패 시 같은 요청 번호로 재시도 → 결과와 이력 링크', async () => {
    const inputs: Record<string, unknown>[] = [];
    let fail = true;
    server.use(
      graphql.mutation('AdminSendNotification', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        if (fail) {
          fail = false;
          return HttpResponse.json({
            data: null,
            errors: [
              {
                message: '잠시 뒤 다시',
                extensions: {
                  code: 'TOO_MANY_REQUESTS',
                  classification: 'BAD_REQUEST',
                  statusCode: 429,
                },
              },
            ],
          });
        }
        return HttpResponse.json({
          data: {
            adminSendNotification: { sentCount: 2, skippedAccountIds: ['9'], broadcastId: '77' },
          },
        });
      }),
    );
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '보내기' }));
    // 검증 실패 → 다이얼로그 확인 뒤 onConfirm에서 trigger가 막는다
    await userEvent.click(await screen.findByRole('button', { name: '보내기', hidden: false }));
    expect(await screen.findByText('제목을 입력해 주세요.')).toBeInTheDocument();
    expect(inputs).toHaveLength(0);

    await userEvent.type(screen.getByLabelText('제목'), '점검 안내');
    await userEvent.type(screen.getByLabelText('본문'), '오늘 밤 점검');
    await userEvent.click(screen.getByRole('radio', { name: '구매자 지정' }));
    await pickUser('케이크러버');
    await pickUser('김하나');
    // 이미 고른 사람을 다시 골라도 한 번만 담긴다
    await pickUser('케이크러버');

    await userEvent.click(screen.getByText('계정 ID로 한꺼번에 추가하기'));
    const bulk = screen.getByLabelText('계정 ID(쉼표나 줄바꿈으로 구분)');
    await userEvent.type(bulk, '9, abc');
    await userEvent.click(screen.getByRole('button', { name: '목록에 추가' }));
    expect(screen.getByText(/확인이 필요한 값: abc/)).toBeInTheDocument();
    await userEvent.clear(bulk);
    await userEvent.type(bulk, '9, 10');
    await userEvent.click(screen.getByRole('button', { name: '목록에 추가' }));

    const picked = screen.getByRole('list', { name: '고른 구매자' });
    expect(
      within(picked)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['케이크러버', '김하나', '#9']);
    expect(screen.getByText(/3명을 골랐습니다/)).toBeInTheDocument();
    await userEvent.click(within(picked).getByRole('button', { name: '김하나 빼기' }));
    await pickUser('c@test.dev');

    await userEvent.click(screen.getByRole('button', { name: '보내기' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('고른 구매자 3명에게 보냅니다.');
    await userEvent.click(within(dialog).getByRole('button', { name: '보내기' }));
    // 다이얼로그가 열린 동안 폼 상단 문구는 가려지므로 토스트로도 알린다
    await vi.waitFor(() =>
      expect(document.querySelector('[data-sonner-toast][data-type="error"]')).toHaveTextContent(
        '잠시 뒤 다시',
      ),
    );
    expect(screen.getByText('잠시 뒤 다시', { selector: 'p[role="alert"]' })).toBeInTheDocument();
    await vi.waitFor(() => expect(inputs).toHaveLength(1));

    await userEvent.click(within(dialog).getByRole('button', { name: '보내기' }));
    await vi.waitFor(() => expect(inputs).toHaveLength(2));
    expect(inputs[1]).toEqual(inputs[0]); // 같은 요청 번호·같은 내용
    expect(inputs[1]).toMatchObject({
      type: 'SYSTEM',
      title: '점검 안내',
      targetKind: 'ACCOUNT_IDS',
      accountIds: ['10', '9', '12'],
    });
    expect(await screen.findByText('2명')).toBeInTheDocument();
    expect(screen.getByText('1개(탈퇴·정지 등): 9')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '발송 이력에서 보기' })).toHaveAttribute(
      'href',
      '/notifications?broadcastId=77',
    );
    expect(screen.getByLabelText('제목')).toHaveValue('');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  }, 15_000); // 앱 부팅부터 여러 단계를 한 번에 도는 흐름이라 기본 5초가 빠듯하다
});
