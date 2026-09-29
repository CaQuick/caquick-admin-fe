import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IdFilterInput } from './id-filter-input';

function setup(value?: string) {
  const onCommit = vi.fn();
  const view = render(<IdFilterInput label="매장 ID" value={value} onCommit={onCommit} />);
  return { onCommit, view, input: screen.getByRole('textbox', { name: '매장 ID' }) };
}

describe('IdFilterInput', () => {
  it.each([
    ['17', '17'],
    ['0', '0'],
    [' 17 ', '17'],
  ])('%j 는 %j 로 커밋한다', async (typed, expected) => {
    const { onCommit, input } = setup();
    await userEvent.type(input, typed);
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(expected);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('비우면 필터 해제로 커밋한다', async () => {
    const { onCommit, input } = setup('17');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it.each(['abc', '17a', '-1', '1.5', '18446744073709551616'])(
    '%j 는 커밋하지 않고 오류를 보인다',
    async (typed) => {
      const { onCommit, input } = setup();
      await userEvent.type(input, typed);
      await userEvent.tab();
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('숫자만 입력해 주세요.');
      expect(input).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
    },
  );

  it('URL 값이 바뀌면 입력과 오류를 새로 시작한다', async () => {
    const { view, input } = setup('17');
    await userEvent.clear(input);
    await userEvent.type(input, 'x');
    await userEvent.tab();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    view.rerender(<IdFilterInput label="매장 ID" value={undefined} onCommit={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '매장 ID' })).toHaveValue('');
  });
});
