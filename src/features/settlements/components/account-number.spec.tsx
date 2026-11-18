import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { copyText } from '@/shared/lib/clipboard';

import { AccountNumber } from './account-number';

vi.mock('@/shared/lib/clipboard', () => ({ copyText: vi.fn() }));

describe('AccountNumber', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [true, 'success', '계좌번호를 복사했습니다.'],
    [false, 'error', '복사하지 못했습니다. 계좌번호를 직접 옮겨 적어 주세요.'],
  ] as const)('복사 %s → %s 토스트(번호는 토스트에 남기지 않는다)', async (ok, kind, message) => {
    vi.mocked(copyText).mockResolvedValue(ok);
    const notify = vi.spyOn(toast, kind);
    render(<AccountNumber value="110123456789" />);
    expect(screen.getByText('110123456789')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '계좌번호 복사' }));
    await vi.waitFor(() => expect(notify).toHaveBeenCalledWith(message));
    expect(copyText).toHaveBeenCalledWith('110123456789');
  });
});
