import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { toast } from 'sonner';

import { InitialPasswordActions } from './initial-password-actions';

function Harness({ username }: { username?: string }) {
  const [value, setValue] = useState('');
  return (
    <>
      <input aria-label="비밀번호" value={value} onChange={(e) => setValue(e.target.value)} />
      <InitialPasswordActions value={value} onChange={setValue} username={username} />
    </>
  );
}

describe('InitialPasswordActions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('생성하면 칸을 채우고 만든 값을 보여 주며, 칸을 고치면 감춘다', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: '복사' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '임시 비밀번호 생성' }));
    const value = screen.getByLabelText<HTMLInputElement>('비밀번호').value;
    expect(value).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{12}$/);
    expect(screen.getByText(value, { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '복사' })).toBeEnabled();

    await userEvent.type(screen.getByLabelText('비밀번호'), 'x');
    expect(screen.queryByText(/만든 비밀번호/)).not.toBeInTheDocument();
  });

  it('아이디를 주면 아이디로 채우기를 함께 두고, 주지 않으면 두지 않는다', async () => {
    const { unmount } = render(<Harness username="testadmin" />);
    await userEvent.click(screen.getByRole('button', { name: '아이디로 채우기' }));
    expect(screen.getByLabelText('비밀번호')).toHaveValue('testadmin');
    unmount();
    render(<Harness />);
    expect(screen.queryByRole('button', { name: '아이디로 채우기' })).not.toBeInTheDocument();
  });

  it.each([
    [true, 'success', '비밀번호를 복사했습니다.'],
    [false, 'error', '복사하지 못했습니다. 비밀번호를 직접 옮겨 적어 전달해 주세요.'],
  ] as const)('복사 결과 %s → %s 토스트', async (ok, kind, message) => {
    const writeText = ok
      ? vi.fn().mockResolvedValue(undefined)
      : vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    // 권한 거부 뒤 선택 복사도 실패하게 둔다
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true });
    const spy = vi.spyOn(toast, kind);
    render(<Harness username="testadmin" />);
    await userEvent.click(screen.getByRole('button', { name: '아이디로 채우기' }));
    await userEvent.click(screen.getByRole('button', { name: '복사' }));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith(message));
    if (ok) expect(writeText).toHaveBeenCalledWith('testadmin');
  });
});
