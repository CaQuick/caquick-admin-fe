import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
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

function boot() {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', '/notifications/send');
  render(<App />);
}

describe('알림 발송', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('검증 → 확인 → 발송 → 결과 표시, 실패 시 같은 멱등 키로 재시도', async () => {
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
                  code: 'INTERNAL',
                  classification: 'INTERNAL_SERVER_ERROR',
                  statusCode: 500,
                },
              },
            ],
          });
        }
        return HttpResponse.json({
          data: { adminSendNotification: { sentCount: 2, skippedAccountIds: ['9'] } },
        });
      }),
    );
    boot();
    await userEvent.click(await screen.findByRole('button', { name: '발송' }));
    // 검증 실패 → 다이얼로그 확인 뒤 onConfirm에서 trigger가 막는다
    await userEvent.click(await screen.findByRole('button', { name: '발송', hidden: false }));
    expect(await screen.findByText('제목은 필수입니다.')).toBeInTheDocument();
    expect(inputs).toHaveLength(0);

    await userEvent.type(screen.getByLabelText('제목'), '점검 안내');
    await userEvent.type(screen.getByLabelText('본문'), '오늘 밤 점검');
    await userEvent.click(screen.getByRole('radio', { name: '계정 ID 목록' }));
    await userEvent.type(screen.getByLabelText(/^계정 ID/), '10, 11, 9');
    expect(screen.getByText('3개 (중복 제거)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '발송' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('계정 3개에 갑니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '발송' }));
    // 다이얼로그가 열린 동안 바깥은 aria-hidden — 텍스트로 확인
    expect(await screen.findByText('잠시 뒤 다시')).toBeInTheDocument();
    await vi.waitFor(() => expect(inputs).toHaveLength(1));

    await userEvent.click(within(dialog).getByRole('button', { name: '발송' }));
    await vi.waitFor(() => expect(inputs).toHaveLength(2));
    expect(inputs[1]).toEqual(inputs[0]); // 같은 멱등 키·같은 내용
    expect(inputs[1]).toMatchObject({
      type: 'SYSTEM',
      title: '점검 안내',
      targetKind: 'ACCOUNT_IDS',
      accountIds: ['10', '11', '9'],
    });
    expect(await screen.findByText('2명')).toBeInTheDocument();
    expect(screen.getByText(/제외됨/)).toBeInTheDocument();
    expect(screen.getByText('1개 — 9')).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toHaveValue('');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
