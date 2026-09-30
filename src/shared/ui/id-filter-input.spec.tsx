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

describe('IdFilterInput Enter', () => {
  it.each([
    ['17', '17'],
    ['0', '0'],
    [' 5 ', '5'],
  ])('%j 를 입력하고 Enter를 누르면 %j 로 적용한다', async (typed, expected) => {
    const { onCommit, input } = setup();
    await userEvent.type(input, `${typed}{Enter}`);
    expect(onCommit).toHaveBeenCalledWith(expected);
    expect(input).toHaveFocus();
  });

  it('Enter 뒤 포커스가 빠져도 한 번만 적용한다', async () => {
    const { onCommit, input } = setup();
    await userEvent.type(input, '17{Enter}');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('값이 그대로면 포커스가 빠져도 적용하지 않는다(목록 위치를 지킨다)', async () => {
    const { onCommit, input } = setup('17');
    await userEvent.click(input);
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('숫자가 아니면 Enter로도 적용하지 않고 오류를 보인다', async () => {
    const { onCommit, input } = setup();
    await userEvent.type(input, 'abc{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('숫자만 입력해 주세요.');
  });

  it('Enter로 감싼 폼을 제출하지 않는다', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
        <IdFilterInput label="계정 ID" value={undefined} onCommit={vi.fn()} />
      </form>,
    );
    await userEvent.type(screen.getByRole('textbox', { name: '계정 ID' }), '3{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
