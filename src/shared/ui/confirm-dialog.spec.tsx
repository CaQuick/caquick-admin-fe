import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('확인하면 onConfirm을 기다렸다 닫는다', async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    render(
      <ConfirmDialog
        trigger={<Button>삭제</Button>}
        title="정말 삭제할까요?"
        confirmLabel="삭제"
        destructive
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제', hidden: false }));
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('onConfirm이 실패하면 열린 채 남는다', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('no')));
    render(
      <ConfirmDialog trigger={<Button>취소</Button>} title="취소할까요?" onConfirm={onConfirm} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(screen.getByRole('button', { name: '확인' })).catch(() => undefined);
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(dialog).toBeInTheDocument();
  });
});
