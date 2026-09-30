import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashIcon } from 'lucide-react';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('라벨을 접근 이름과 툴팁으로 쓴다', async () => {
    const onClick = vi.fn();
    render(
      <IconButton label="삭제" onClick={onClick}>
        <TrashIcon />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: '삭제' });
    await userEvent.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('삭제');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('비활성 사유가 있으면 누를 수 없고, 포커스·호버로 이유를 보인다', async () => {
    const onClick = vi.fn();
    render(
      <IconButton
        label="삭제"
        disabledReason="매장 3곳이 연결되어 있어 삭제할 수 없습니다."
        onClick={onClick}
      >
        <TrashIcon />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: '삭제' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAccessibleDescription('매장 3곳이 연결되어 있어 삭제할 수 없습니다.');

    await userEvent.tab();
    expect(button).toHaveFocus();
    // 마우스 사용자도 무슨 버튼인지 알 수 있게 라벨과 사유를 함께 보인다
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('삭제')).toBeInTheDocument();
    expect(
      within(tooltip).getByText('매장 3곳이 연결되어 있어 삭제할 수 없습니다.'),
    ).toBeInTheDocument();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('폼 안에서 비활성 사유가 있으면 제출하지 않는다', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
        <IconButton type="submit" label="저장" disabledReason="바뀐 내용이 없습니다.">
          <TrashIcon />
        </IconButton>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('사유 없이 disabled만 주면 일반 비활성 버튼이다', () => {
    render(
      <IconButton label="삭제" disabled>
        <TrashIcon />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: '삭제' });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('aria-disabled');
  });
});
