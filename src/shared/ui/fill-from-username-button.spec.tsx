import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FillFromUsernameButton } from './fill-from-username-button';

describe('FillFromUsernameButton', () => {
  it.each([
    ['', false],
    ['seven77', false], // 7자
    ['  seven77  ', false], // 공백은 길이에 넣지 않는다
    ['eight888', true],
    ['testadmin', true],
  ])('아이디 "%s" → 사용 가능 %s', (username, enabled) => {
    render(<FillFromUsernameButton username={username} onFill={vi.fn()} />);
    const button = screen.getByRole('button', { name: '아이디로 채우기' });
    if (enabled) {
      expect(button).toBeEnabled();
      expect(screen.queryByText(/8자 이상이어야/)).not.toBeInTheDocument();
    } else {
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription('아이디가 8자 이상이어야 쓸 수 있습니다.');
    }
  });

  it('누르면 앞뒤 공백을 뺀 아이디를 넘긴다', async () => {
    const onFill = vi.fn();
    render(<FillFromUsernameButton username=" testadmin " onFill={onFill} />);
    await userEvent.click(screen.getByRole('button', { name: '아이디로 채우기' }));
    expect(onFill).toHaveBeenCalledWith('testadmin');
  });
});
